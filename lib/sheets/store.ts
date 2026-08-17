import "server-only";

import { SignJWT, importPKCS8 } from "jose";
import type { LeadInput } from "@/lib/leads/schema";
import { SHEET_HEADER, SHEET_LAST_COLUMN, leadToRow } from "./schema";

/**
 * Appending leads to a Google Sheet.
 *
 * A service account signed with `jose` and three plain `fetch` calls, rather
 * than `googleapis`: the SDK is tens of megabytes to reach one endpoint, and
 * `jose` is already here signing session cookies. Same shape as `lib/email.ts`
 * for the same reason — this runs *after* the lead is safely in Postgres, so
 * every failure here is a degraded copy, never a lost enquiry.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TIMEOUT_MS = 8_000;

export type AppendResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "failed"; detail?: string };

type Config = { sheetId: string; clientEmail: string; privateKey: string; tab: string };

/**
 * Reads configuration at call time rather than at import.
 *
 * Module-level `process.env` reads run during the build, when the variables are
 * not necessarily present — and a value captured then would be the wrong one
 * anyway once Vercel injects the environment for a real request.
 */
function readConfig(): Config | null {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!sheetId || !clientEmail || !privateKey) return null;

  return {
    sheetId,
    clientEmail,
    /* A PEM key survives a single-line `.env` as the two characters `\` and `n`.
       Turning those back into real newlines here means the value can be pasted
       into Vercel's UI or quoted in `.env` and work either way. */
    privateKey: privateKey.replace(/\\n/g, "\n"),
    tab: process.env.GOOGLE_SHEETS_TAB || "Leads",
  };
}

/**
 * The access token, kept between requests.
 *
 * Google's tokens last an hour and minting one costs an RSA signature plus a
 * round trip. Cached with a minute of headroom so a token cannot expire in
 * flight; on a cold serverless invocation this is simply empty, which is fine.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(config: Config): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(config.privateKey, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`token ${res.status} ${await res.text()}`);

  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return body.access_token;
}

function range(config: Config, row: string): string {
  return encodeURIComponent(`${config.tab}!A${row}:${SHEET_LAST_COLUMN}${row}`);
}

/**
 * Writes the header once, if the sheet has never been written to.
 *
 * Without this the first lead lands in row 1 and the spreadsheet is thirteen
 * unlabelled columns. Guarded by a module-level promise so it costs one extra
 * request per process rather than one per lead, and cleared on failure so a
 * transient error does not leave the sheet permanently headerless.
 */
let headerCheck: Promise<void> | null = null;

/** Overwrites a range with the rows given. */
async function putValues(
  config: Config,
  token: string,
  cells: string,
  values: readonly (readonly string[])[],
): Promise<void> {
  const res = await fetch(
    `${SHEETS_API}/${config.sheetId}/values/${cells}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`header write ${res.status} ${await res.text()}`);
}

/**
 * How many rows this is willing to rewrite to put a header back on top.
 *
 * The repair below reads the sheet and writes it out again one row lower, which
 * is fine for the handful of rows the fault can realistically produce and not
 * something to attempt against a year of leads. Past this it gives up loudly
 * and leaves the data alone.
 */
const MAX_REPAIR_ROWS = 2000;

/**
 * Puts the header in row 1, whatever state row 1 is in.
 *
 * Three cases, and the third is the one that matters. An empty sheet just gets
 * the header written. A sheet whose row 1 is already the header is left alone.
 * But a sheet whose row 1 holds a *lead* has to be repaired, because that is
 * what a failed header write leaves behind — and testing `row 1 is non-empty`
 * would read that damage as "already labelled" and preserve it forever, every
 * later booking appending underneath an unlabelled first row.
 *
 * That is not hypothetical: it happened on the first real booking here, when a
 * cold start pushed the header write past its timeout.
 */
async function writeHeaderIfMissing(config: Config, token: string): Promise<void> {
  const headerCells = range(config, "1");
  const res = await fetch(`${SHEETS_API}/${config.sheetId}/values/${headerCells}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`header read ${res.status} ${await res.text()}`);

  /* Sheets omits `values` entirely for an empty range rather than returning an
     empty row, so both shapes mean "nothing has been written here yet". */
  const body = (await res.json()) as { values?: string[][] };
  const first = body.values?.[0] ?? [];

  if (first[0] === SHEET_HEADER[0]) return;

  if (first.length === 0) {
    await putValues(config, token, headerCells, [SHEET_HEADER]);
    return;
  }

  /* Row 1 is data. Read what is there and write it back one row down with the
     header above it — `insertDimension` would be tidier but needs the tab's
     numeric id, which is another round trip to learn for a path that should
     almost never run. */
  const allCells = encodeURIComponent(`${config.tab}!A:${SHEET_LAST_COLUMN}`);
  const readAll = await fetch(`${SHEETS_API}/${config.sheetId}/values/${allCells}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!readAll.ok) throw new Error(`repair read ${readAll.status} ${await readAll.text()}`);

  const rows = ((await readAll.json()) as { values?: string[][] }).values ?? [];
  if (rows.length > MAX_REPAIR_ROWS) {
    throw new Error(`refusing to rewrite ${rows.length} rows to insert a header`);
  }

  await putValues(
    config,
    token,
    encodeURIComponent(`${config.tab}!A1:${SHEET_LAST_COLUMN}${rows.length + 1}`),
    [SHEET_HEADER, ...rows],
  );
}

async function ensureHeader(config: Config, token: string): Promise<void> {
  headerCheck ??= writeHeaderIfMissing(config, token).catch((error) => {
    /* Cleared so the next lead retries rather than the sheet staying
       permanently headerless because of one bad minute. */
    headerCheck = null;
    throw error;
  });
  await headerCheck;
}

/**
 * Appends one lead. Never throws.
 *
 * `RAW` rather than `USER_ENTERED` is the load-bearing choice: `USER_ENTERED`
 * makes Google parse each cell the way the web UI would, which turns a message
 * beginning `=` into a live formula written by whoever filled in the form, and
 * quietly mangles phone numbers with leading zeros or a `+`. RAW stores exactly
 * what the visitor typed, as text.
 */
export async function appendLeadRow(lead: LeadInput): Promise<AppendResult> {
  const config = readConfig();
  if (!config) return { ok: false, reason: "unconfigured" };

  try {
    const token = await accessToken(config);

    /* Not fatal — the header is a convenience and the row is the point, so a
       sheet that could not be labelled still gets the lead. Logged rather than
       swallowed, though: a silent catch here is indistinguishable from a sheet
       that never needed a header, and the difference is exactly what you want
       to know when the columns turn out to be unlabelled. */
    await ensureHeader(config, token).catch((error) => {
      console.warn("[sheets] header not written", String(error));
    });

    const url =
      `${SHEETS_API}/${config.sheetId}/values/${encodeURIComponent(`${config.tab}!A:${SHEET_LAST_COLUMN}`)}:append` +
      `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [leadToRow(lead)] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      /* A 401 here means the cached token was rejected — most likely the key was
         rotated. Dropping it costs one re-mint on the next lead rather than an
         hour of failures. */
      if (res.status === 401) cachedToken = null;
      return { ok: false, reason: "failed", detail: `${res.status} ${await res.text()}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "failed", detail: String(error) };
  }
}

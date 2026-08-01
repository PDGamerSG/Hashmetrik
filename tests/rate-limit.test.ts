import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { WINDOW_MS, clientKey, isStale, windowKey } from "../lib/rate-limit/window.ts";

describe("windowKey", () => {
  it("is stable inside an hour and changes across the boundary", () => {
    const early = new Date("2026-08-02T10:00:00.000Z");
    const late = new Date("2026-08-02T10:59:59.999Z");
    const next = new Date("2026-08-02T11:00:00.000Z");

    assert.equal(windowKey(early), windowKey(late));
    assert.notEqual(windowKey(late), windowKey(next));
  });

  it("floors to the start of the window", () => {
    assert.equal(windowKey(new Date("2026-08-02T10:37:12.500Z")), "2026-08-02T10:00:00.000Z");
  });
});

describe("isStale", () => {
  const now = new Date("2026-08-02T12:00:00.000Z");

  it("keeps the current and previous windows", () => {
    assert.equal(isStale(now, now), false);
    assert.equal(isStale(new Date(now.getTime() - WINDOW_MS), now), false);
  });

  it("sweeps anything older than two windows", () => {
    assert.equal(isStale(new Date(now.getTime() - WINDOW_MS * 2 - 1), now), true);
  });
});

describe("clientKey", () => {
  it("takes the client from the front of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 70.41.3.18, 150.172.238.178" });
    assert.equal(clientKey(headers), "203.0.113.5");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    assert.equal(clientKey(new Headers({ "x-real-ip": "198.51.100.7" })), "198.51.100.7");
    assert.equal(clientKey(new Headers()), "unknown");
  });

  it("does not return an empty key when the header is present but blank", () => {
    /* An empty key would put every such caller in one bucket by accident — the
       same outcome as "unknown", but arrived at silently. */
    assert.equal(clientKey(new Headers({ "x-forwarded-for": "  " })), "unknown");
  });
});

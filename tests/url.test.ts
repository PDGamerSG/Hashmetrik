import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { isHttpUrl, safeUrl } from "../lib/url.ts";

describe("isHttpUrl", () => {
  it("accepts the two schemes a link may use", () => {
    assert.equal(isHttpUrl("https://example.com/poster.png"), true);
    assert.equal(isHttpUrl("http://example.com"), true);
    assert.equal(isHttpUrl("HTTPS://EXAMPLE.COM"), true);
  });

  /* The point of the check. Both of these parse as URLs, and both execute when
     the link is clicked — which is why "does `new URL()` throw?" is the wrong
     question and the scheme is the right one. */
  it("rejects schemes that execute", () => {
    assert.equal(isHttpUrl("javascript:alert(1)"), false);
    assert.equal(isHttpUrl("JavaScript:alert(1)"), false);
    assert.equal(isHttpUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isHttpUrl("vbscript:msgbox(1)"), false);
  });

  it("rejects other schemes that are not a web link", () => {
    assert.equal(isHttpUrl("file:///etc/passwd"), false);
    assert.equal(isHttpUrl("ftp://example.com"), false);
    assert.equal(isHttpUrl("mailto:someone@example.com"), false);
  });

  it("rejects anything that is not a URL at all", () => {
    for (const value of ["", "   ", "example.com", "//example.com", "not a url"]) {
      assert.equal(isHttpUrl(value), false, JSON.stringify(value));
    }
  });
});

describe("safeUrl", () => {
  it("passes a good link through unchanged", () => {
    assert.equal(safeUrl("https://example.com/a.png"), "https://example.com/a.png");
  });

  it("returns null for anything a page must not render", () => {
    assert.equal(safeUrl("javascript:alert(1)"), null);
    assert.equal(safeUrl(null), null);
    assert.equal(safeUrl(undefined), null);
    assert.equal(safeUrl(""), null);
  });
});

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { isContentType, toSlug } from "../lib/cms/schema.ts";

describe("toSlug", () => {
  it("lower cases and joins words with hyphens", () => {
    assert.equal(toSlug("About Us"), "about-us");
    assert.equal(toSlug("How we cut CAC by 40%"), "how-we-cut-cac-by-40");
  });

  it("collapses runs and trims the edges", () => {
    assert.equal(toSlug("  --Hello   World--  "), "hello-world");
  });

  /* Anything that would need escaping in a URL is gone by construction, which
     is what lets the slug be interpolated into a path without encoding. */
  it("drops everything that is not a letter or a number", () => {
    assert.equal(toSlug("a/b?c#d&e"), "a-b-c-d-e");
    assert.equal(toSlug("café & crème"), "caf-cr-me");
  });

  it("caps the length", () => {
    assert.equal(toSlug("word ".repeat(100)).length <= 120, true);
  });

  it("can reduce to nothing, which the caller has to handle", () => {
    assert.equal(toSlug("!!!"), "");
    assert.equal(toSlug(""), "");
  });
});

describe("isContentType", () => {
  it("accepts the known types", () => {
    for (const type of ["page", "blog", "case_study", "faq", "service"]) {
      assert.equal(isContentType(type), true, type);
    }
  });

  it("rejects anything else", () => {
    for (const type of ["Blog", "post", "", null, undefined, 3]) {
      assert.equal(isContentType(type), false, String(type));
    }
  });
});

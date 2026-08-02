import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { currentPeriod, isPeriod, recentPeriods, toSeries } from "../lib/kpis/series.ts";

describe("currentPeriod", () => {
  it("pads the month, so periods sort as strings", () => {
    assert.equal(currentPeriod(new Date(2026, 0, 15)), "2026-01");
    assert.equal(currentPeriod(new Date(2026, 11, 1)), "2026-12");
  });
});

describe("isPeriod", () => {
  it("accepts a real month", () => {
    assert.equal(isPeriod("2026-08"), true);
    assert.equal(isPeriod("1999-01"), true);
    assert.equal(isPeriod("2026-12"), true);
  });

  it("rejects anything else", () => {
    for (const value of ["2026-13", "2026-00", "2026-8", "26-08", "2026", "2026-08-01", ""]) {
      assert.equal(isPeriod(value), false, value);
    }
  });
});

describe("recentPeriods", () => {
  it("walks back from the given month, newest first", () => {
    assert.deepEqual(recentPeriods(3, new Date(2026, 7, 2)), ["2026-08", "2026-07", "2026-06"]);
  });

  /* The case that a naive `month - i` gets wrong. */
  it("crosses a year boundary", () => {
    assert.deepEqual(recentPeriods(3, new Date(2026, 1, 10)), ["2026-02", "2026-01", "2025-12"]);
  });
});

describe("toSeries", () => {
  const records = [
    { metricName: "Impressions", unit: null, period: "2026-08", value: 300 },
    { metricName: "Impressions", unit: null, period: "2026-06", value: 100 },
    { metricName: "Impressions", unit: null, period: "2026-07", value: 200 },
    { metricName: "Spend", unit: "₹", period: "2026-08", value: 50000 },
  ];

  it("groups by metric", () => {
    const series = toSeries(records);
    assert.equal(series.length, 2);
    assert.deepEqual(
      series.map((s) => s.metricName).sort(),
      ["Impressions", "Spend"],
    );
  });

  /* The chart draws a line straight from this array, so an out-of-order point
     is a line that doubles back on itself. */
  it("puts the points in chronological order", () => {
    const impressions = toSeries(records).find((s) => s.metricName === "Impressions");
    assert.deepEqual(
      impressions?.points.map((p) => p.period),
      ["2026-06", "2026-07", "2026-08"],
    );
    assert.deepEqual(impressions?.points.map((p) => p.value), [100, 200, 300]);
  });

  it("keeps the unit", () => {
    assert.equal(toSeries(records).find((s) => s.metricName === "Spend")?.unit, "₹");
  });

  it("handles nothing at all", () => {
    assert.deepEqual(toSeries([]), []);
  });
});

import { describe, expect, it } from "vitest";
import { bucketFor, parseDay, parseWindowParams, resolveWindow } from "./range";
import { csvCell, csvRow } from "./csv";

const NOW = new Date("2026-09-10T15:00:00Z");
const DAY = 86_400_000;

describe("parseDay", () => {
  it("reads a real calendar day as UTC midnight", () => {
    expect(parseDay("2026-09-01")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("rejects dates that do not exist instead of rolling them over", () => {
    // new Date("2026-02-31") silently becomes March 3.
    expect(parseDay("2026-02-31")).toBeNull();
    expect(parseDay("2026-13-01")).toBeNull();
  });

  it("rejects anything that is not YYYY-MM-DD", () => {
    expect(parseDay("09/01/2026")).toBeNull();
    expect(parseDay("2026-9-1")).toBeNull();
    expect(parseDay("")).toBeNull();
    expect(parseDay(undefined)).toBeNull();
  });
});

describe("parseWindowParams", () => {
  it("passes presets through", () => {
    expect(parseWindowParams({ range: "7d" }, NOW)).toEqual({ range: "7d" });
  });

  it("accepts a valid custom range", () => {
    expect(
      parseWindowParams({ range: "custom", from: "2026-09-01", to: "2026-09-05" }, NOW),
    ).toEqual({ range: "custom", from: "2026-09-01", to: "2026-09-05" });
  });

  it("falls back to 30 days for a custom range that is backwards", () => {
    expect(
      parseWindowParams({ range: "custom", from: "2026-09-05", to: "2026-09-01" }, NOW),
    ).toEqual({ range: "30d" });
  });

  it("falls back for missing or malformed dates", () => {
    expect(parseWindowParams({ range: "custom" }, NOW)).toEqual({ range: "30d" });
    expect(
      parseWindowParams({ range: "custom", from: "nope", to: "2026-09-05" }, NOW),
    ).toEqual({ range: "30d" });
  });

  it("falls back for a span beyond a year", () => {
    expect(
      parseWindowParams({ range: "custom", from: "2024-01-01", to: "2026-09-01" }, NOW),
    ).toEqual({ range: "30d" });
  });

  it("clamps an end date in the future to today", () => {
    expect(
      parseWindowParams({ range: "custom", from: "2026-09-01", to: "2027-01-01" }, NOW),
    ).toEqual({ range: "custom", from: "2026-09-01", to: "2026-09-10" });
  });

  it("falls back when the whole range is in the future", () => {
    expect(
      parseWindowParams({ range: "custom", from: "2027-01-01", to: "2027-01-05" }, NOW),
    ).toEqual({ range: "30d" });
  });

  it("treats an unknown range as 30 days", () => {
    expect(parseWindowParams({ range: "forever" }, NOW)).toEqual({ range: "30d" });
  });
});

describe("bucketFor", () => {
  it("picks hours, days or weeks by span so the chart stays readable", () => {
    expect(bucketFor(1 * DAY)).toBe("hour");
    expect(bucketFor(2 * DAY)).toBe("hour");
    expect(bucketFor(30 * DAY)).toBe("day");
    expect(bucketFor(90 * DAY)).toBe("day");
    expect(bucketFor(200 * DAY)).toBe("week");
  });
});

describe("resolveWindow", () => {
  it("makes a custom range inclusive of its last day", () => {
    const window = resolveWindow({ range: "custom", from: "2026-09-01", to: "2026-09-05" }, NOW);
    expect(window.from.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    // Runs to the start of the 6th, so all of the 5th is in.
    expect(window.to.toISOString()).toBe("2026-09-06T00:00:00.000Z");
    expect(window.label).toBe("Sep 1 – Sep 5");
  });

  it("compares against the same-length period just before", () => {
    const window = resolveWindow({ range: "custom", from: "2026-09-01", to: "2026-09-05" }, NOW);
    expect(window.previousTo.toISOString()).toBe(window.from.toISOString());
    expect(window.previousFrom.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("labels a single-day custom range once", () => {
    expect(
      resolveWindow({ range: "custom", from: "2026-09-03", to: "2026-09-03" }, NOW).label,
    ).toBe("Sep 3");
  });

  it("uses weekly buckets for a long custom range", () => {
    expect(
      resolveWindow({ range: "custom", from: "2026-01-01", to: "2026-08-01" }, NOW).bucket,
    ).toBe("week");
  });

  it("keeps the presets working", () => {
    expect(resolveWindow("24h", NOW).bucket).toBe("hour");
    expect(resolveWindow("30d", NOW).bucket).toBe("day");
    expect(resolveWindow("30d", NOW).label).toBe("30 days");
  });
});

describe("csv", () => {
  it("leaves plain values alone", () => {
    expect(csvCell("klip.to/summer-sale")).toBe("klip.to/summer-sale");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(null)).toBe("");
  });

  it("quotes commas, quotes and line breaks per RFC 4180", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });

  it("neutralises formula injection from visitor-controlled fields", () => {
    // The referrer header is whatever the clicker sends.
    expect(csvCell('=HYPERLINK("http://evil","x")')).toBe(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
  });

  it("ends each row with CRLF", () => {
    expect(csvRow(["a", "b,c", null])).toBe('a,"b,c",\r\n');
  });
});

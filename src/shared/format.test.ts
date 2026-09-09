import { describe, expect, it } from "vitest";
import {
  compactNumber,
  formatNumber,
  percentDelta,
  relativeTime,
  shortDate,
} from "./format";

const NOW = new Date("2026-09-09T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it("matches the design's compact units", () => {
    expect(relativeTime(ago(30_000), NOW)).toBe("just now");
    expect(relativeTime(ago(5 * MINUTE), NOW)).toBe("5m ago");
    expect(relativeTime(ago(3 * HOUR), NOW)).toBe("3h ago");
    expect(relativeTime(ago(2 * DAY), NOW)).toBe("2d ago");
    expect(relativeTime(ago(10 * DAY), NOW)).toBe("1w ago");
    expect(relativeTime(ago(21 * DAY), NOW)).toBe("3w ago");
    expect(relativeTime(ago(45 * DAY), NOW)).toBe("1mo ago");
    expect(relativeTime(ago(150 * DAY), NOW)).toBe("5mo ago");
    expect(relativeTime(ago(400 * DAY), NOW)).toBe("1y ago");
  });

  it("does not produce negative ages for clock skew", () => {
    expect(relativeTime(new Date(NOW.getTime() + 5 * MINUTE), NOW)).toBe("just now");
  });
});

describe("shortDate", () => {
  it("renders the QR card format", () => {
    expect(shortDate(new Date("2026-06-12T10:00:00Z"))).toBe("Jun 12");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(84392)).toBe("84,392");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("compactNumber", () => {
  it("shortens for the usage meter", () => {
    expect(compactNumber(412)).toBe("412");
    expect(compactNumber(84_392)).toBe("84.4k");
    expect(compactNumber(100_000)).toBe("100k");
    expect(compactNumber(2_400_000)).toBe("2.4M");
  });
});

describe("percentDelta", () => {
  it("signs the change", () => {
    expect(percentDelta(112, 100)).toBe("+12.0%");
    expect(percentDelta(90, 100)).toBe("-10.0%");
  });

  it("returns null when there is no baseline to divide by", () => {
    expect(percentDelta(50, 0)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { bucketReferrers, normalizeReferrer } from "./referrers";

describe("normalizeReferrer", () => {
  it("treats missing and empty referrers as direct traffic", () => {
    expect(normalizeReferrer(null)).toBe("Direct");
    expect(normalizeReferrer(undefined)).toBe("Direct");
    expect(normalizeReferrer("")).toBe("Direct");
    expect(normalizeReferrer("   ")).toBe("Direct");
  });

  it("maps the buckets spec §11 defines", () => {
    expect(normalizeReferrer("instagram.com")).toBe("Instagram");
    expect(normalizeReferrer("google.com")).toBe("Google");
    expect(normalizeReferrer("facebook.com")).toBe("Facebook");
    expect(normalizeReferrer("youtube.com")).toBe("YouTube");
  });

  it("ignores www and subdomains", () => {
    expect(normalizeReferrer("www.instagram.com")).toBe("Instagram");
    expect(normalizeReferrer("l.instagram.com")).toBe("Instagram");
    expect(normalizeReferrer("m.facebook.com")).toBe("Facebook");
  });

  it("matches Google's country domains", () => {
    expect(normalizeReferrer("google.com.br")).toBe("Google");
    expect(normalizeReferrer("google.co.uk")).toBe("Google");
  });

  it("accepts a full URL, not just a hostname", () => {
    expect(normalizeReferrer("https://www.instagram.com/p/abc")).toBe("Instagram");
    expect(normalizeReferrer("https://youtu.be/abc")).toBe("YouTube");
  });

  it("falls back to Other for anything unrecognised", () => {
    expect(normalizeReferrer("news.ycombinator.com")).toBe("Other");
    expect(normalizeReferrer("t.co")).toBe("Other");
  });

  it("does not match a lookalike domain", () => {
    // notinstagram.com must not fold into Instagram.
    expect(normalizeReferrer("notinstagram.com")).toBe("Other");
  });
});

describe("bucketReferrers", () => {
  it("folds hostnames into buckets and sorts by volume", () => {
    expect(
      bucketReferrers([
        { referrer: "www.instagram.com", count: 10 },
        { referrer: "l.instagram.com", count: 5 },
        { referrer: null, count: 20 },
        { referrer: "google.com", count: 3 },
      ]),
    ).toEqual([
      { label: "Direct", count: 20 },
      { label: "Instagram", count: 15 },
      { label: "Google", count: 3 },
    ]);
  });

  it("returns nothing for no rows", () => {
    expect(bucketReferrers([])).toEqual([]);
  });
});

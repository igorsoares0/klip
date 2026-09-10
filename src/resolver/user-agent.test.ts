import { describe, expect, it } from "vitest";
import { parseBrowser, parseDevice, parseOs, parseUserAgent } from "./user-agent";

/** Real user-agent strings — the only kind worth testing a UA parser against. */
const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  windowsChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  macFirefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
  linuxFirefox: "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
  instagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.0.25.95 (iPhone14,2; iOS 17_5; en_US)",
};

describe("parseOs", () => {
  it("puts Android ahead of Linux", () => {
    // Every Android UA also says "Linux"; the order is the whole test.
    expect(parseOs(UA.androidChrome)).toBe("Android");
    expect(parseOs(UA.linuxFirefox)).toBe("Linux");
  });

  it("recognises the rest of the spec §11 list", () => {
    expect(parseOs(UA.iphoneSafari)).toBe("iOS");
    expect(parseOs(UA.ipad)).toBe("iOS");
    expect(parseOs(UA.windowsChrome)).toBe("Windows");
    expect(parseOs(UA.macSafari)).toBe("macOS");
  });

  it("returns null for an empty user agent", () => {
    expect(parseOs("")).toBeNull();
  });
});

describe("parseDevice", () => {
  it("classifies phones", () => {
    expect(parseDevice(UA.iphoneSafari, "iOS")).toBe("MOBILE");
    expect(parseDevice(UA.androidChrome, "Android")).toBe("MOBILE");
  });

  it("classifies tablets, including the ones that hide", () => {
    expect(parseDevice(UA.ipad, "iOS")).toBe("TABLET");
    // An Android without "Mobile" is a tablet, per Google's guidance.
    expect(parseDevice(UA.androidTablet, "Android")).toBe("TABLET");
  });

  it("classifies desktops", () => {
    expect(parseDevice(UA.windowsChrome, "Windows")).toBe("DESKTOP");
    expect(parseDevice(UA.macSafari, "macOS")).toBe("DESKTOP");
    expect(parseDevice(UA.linuxFirefox, "Linux")).toBe("DESKTOP");
  });

  it("does not mistake a Mac for a tablet", () => {
    expect(parseDevice(UA.macFirefox, "macOS")).toBe("DESKTOP");
  });

  it("is UNKNOWN when there is nothing to go on", () => {
    expect(parseDevice("", null)).toBe("UNKNOWN");
    expect(parseDevice("curl/8.4.0", "Other")).toBe("UNKNOWN");
  });
});

describe("parseBrowser", () => {
  it("puts Chrome ahead of Safari", () => {
    // Chrome's UA claims to be Safari too.
    expect(parseBrowser(UA.windowsChrome).browser).toBe("Chrome");
    expect(parseBrowser(UA.macSafari).browser).toBe("Safari");
  });

  it("puts Edge ahead of Chrome", () => {
    // Edge's UA claims to be both.
    expect(parseBrowser(UA.windowsEdge).browser).toBe("Edge");
  });

  it("recognises Chrome on iOS, which calls itself CriOS", () => {
    expect(parseBrowser(UA.iphoneChrome).browser).toBe("Chrome");
  });

  it("puts in-app webviews ahead of everything", () => {
    // The design shows "Instagram in-app" as its own breakdown row.
    expect(parseBrowser(UA.instagram).browser).toBe("Instagram in-app");
  });

  it("extracts versions", () => {
    expect(parseBrowser(UA.windowsChrome).browserVersion).toBe("126.0.0.0");
    expect(parseBrowser(UA.macSafari).browserVersion).toBe("17.5");
    expect(parseBrowser(UA.windowsEdge).browserVersion).toBe("126.0.2592.87");
  });

  it("falls back to Other, never to a wrong guess", () => {
    expect(parseBrowser("curl/8.4.0").browser).toBe("Other");
    expect(parseBrowser("").browser).toBeNull();
  });
});

describe("parseUserAgent", () => {
  it("describes a real iPhone visit", () => {
    expect(parseUserAgent(UA.iphoneSafari)).toEqual({
      deviceType: "MOBILE",
      browser: "Safari",
      browserVersion: "17.5",
      os: "iOS",
    });
  });

  it("describes a real Android visit", () => {
    expect(parseUserAgent(UA.androidChrome)).toEqual({
      deviceType: "MOBILE",
      browser: "Chrome",
      browserVersion: "126.0.0.0",
      os: "Android",
    });
  });

  it("survives a missing user agent", () => {
    expect(parseUserAgent(null)).toEqual({
      deviceType: "UNKNOWN",
      browser: null,
      browserVersion: null,
      os: null,
    });
    expect(parseUserAgent(undefined).deviceType).toBe("UNKNOWN");
  });
});

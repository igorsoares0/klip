import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { renderQrPng, renderQrSvg } from "./render";
import { qrTargetUrl } from "./url";
import {
  DEFAULT_QR_COLORS,
  contrastRatio,
  isHexColor,
  luminance,
  normalizeHex,
  validateQrColors,
} from "./colors";

/** Decodes a PNG the way a phone camera would. */
function decode(png: Buffer): string | null {
  const image = PNG.sync.read(png);
  const result = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
  return result?.data ?? null;
}

describe("qrTargetUrl", () => {
  it("encodes the short link with the scan marker", () => {
    expect(qrTargetUrl("klip.to", "summer-sale")).toBe("https://klip.to/summer-sale?qr=1");
  });
});

describe("rendered codes actually scan", () => {
  // The placeholder this replaces looked like a QR and decoded to nothing.
  // These are the tests that prove the codes are real.
  it("decodes to exactly the short link", async () => {
    const url = qrTargetUrl("klip.to", "summer-sale");
    const png = await renderQrPng(url, DEFAULT_QR_COLORS);
    expect(decode(png)).toBe(url);
  });

  it("still decodes in brand colours that pass validation", async () => {
    const url = qrTargetUrl("go.acme.com", "creator-drop");
    const colors = { fg: "#3B2FE8", bg: "#FFFFFF" };
    expect(validateQrColors(colors)).toBeNull();

    const png = await renderQrPng(url, colors);
    expect(decode(png)).toBe(url);
  });

  it("decodes a long slug", async () => {
    const url = qrTargetUrl("klip.to", "a-very-long-slug-for-a-campaign-2026-q4-final");
    expect(decode(await renderQrPng(url, DEFAULT_QR_COLORS))).toBe(url);
  });

  it("renders at the requested size", async () => {
    const png = await renderQrPng(qrTargetUrl("klip.to", "x"), DEFAULT_QR_COLORS, 512);
    expect(PNG.sync.read(png).width).toBe(512);
  });

  it("produces an SVG carrying the chosen colours", async () => {
    const svg = await renderQrSvg(qrTargetUrl("klip.to", "x"), {
      fg: "#3B2FE8",
      bg: "#FFFFFF",
    });
    expect(svg).toMatch(/^<svg/);
    expect(svg.toLowerCase()).toContain("#3b2fe8");
  });
});

describe("rendering untrusted colours", () => {
  // The SVG is injected into the page as markup, with the colours inside it.
  const evil = '#000"/><script>alert(1)</script><x a="';

  it("never lets a colour inject markup into the SVG", async () => {
    const svg = await renderQrSvg(qrTargetUrl("klip.to", "x"), { fg: evil, bg: "#FFFFFF" });
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("alert(");
  });

  it("falls back to the default instead of throwing on a bad stored value", async () => {
    // A throw here would take down the whole QR screen.
    const url = qrTargetUrl("klip.to", "x");
    await expect(renderQrSvg(url, { fg: evil, bg: "nonsense" })).resolves.toMatch(/^<svg/);
    const png = await renderQrPng(url, { fg: evil, bg: "nonsense" });
    expect(decode(png)).toBe(url);
  });
});

describe("colour validation", () => {
  it("recognises hex colours", () => {
    expect(isHexColor("#15151A")).toBe(true);
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("15151A")).toBe(false);
    expect(isHexColor("#12345")).toBe(false);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#gggggg")).toBe(false);
  });

  it("expands shorthand hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
  });

  it("measures luminance at the extremes", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#FFFFFF")).toBe(1);
  });

  it("gives black on white the maximum ratio", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("accepts the default pair", () => {
    expect(validateQrColors(DEFAULT_QR_COLORS)).toBeNull();
  });

  it("refuses an inverted code, whatever the contrast", () => {
    // White on black has maximum contrast and still fails many scanners.
    expect(validateQrColors({ fg: "#FFFFFF", bg: "#000000" })).toMatch(/darker/);
  });

  it("refuses a pair without enough contrast", () => {
    expect(validateQrColors({ fg: "#CCCCCC", bg: "#FFFFFF" })).toMatch(/contrast/);
    // Lime on white is the design's own accent, and too pale to scan.
    expect(validateQrColors({ fg: "#C9FF3C", bg: "#FFFFFF" })).toMatch(/contrast/);
  });

  it("refuses identical colours", () => {
    expect(validateQrColors({ fg: "#15151A", bg: "#15151A" })).not.toBeNull();
  });

  it("refuses malformed input", () => {
    expect(validateQrColors({ fg: "black", bg: "#FFFFFF" })).toMatch(/hex/);
  });
});

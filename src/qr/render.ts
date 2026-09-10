import QRCode from "qrcode";
import { DEFAULT_QR_COLORS, isHexColor, type QrColors } from "./colors";

/**
 * Error correction M: the usual balance between density and damage tolerance.
 * An overlaid logo (future customisation, spec §15) will need H.
 */
const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
};

/**
 * Colours are validated on write (`updateQrColors`), but rendering does not
 * trust what is stored. Two reasons:
 *
 * - The SVG is injected into the page as markup, and the colours land inside it
 *   as attribute values. The qrcode library happens to reject non-hex input
 *   today, but that is its internal detail, not a guarantee we control.
 * - That rejection is a throw. One bad row would take down the whole QR screen,
 *   which renders every code in a single Promise.all.
 *
 * So anything that is not a plain hex colour falls back to the default.
 */
function safe(colors: QrColors): QrColors {
  return {
    fg: isHexColor(colors.fg) ? colors.fg : DEFAULT_QR_COLORS.fg,
    bg: isHexColor(colors.bg) ? colors.bg : DEFAULT_QR_COLORS.bg,
  };
}

export async function renderQrSvg(text: string, colors: QrColors): Promise<string> {
  const { fg, bg } = safe(colors);
  return QRCode.toString(text, {
    ...OPTIONS,
    type: "svg",
    color: { dark: fg, light: bg },
  });
}

/** 1024px holds up in print. */
export async function renderQrPng(
  text: string,
  colors: QrColors,
  size = 1024,
): Promise<Buffer> {
  const { fg, bg } = safe(colors);
  return QRCode.toBuffer(text, {
    ...OPTIONS,
    type: "png",
    width: size,
    color: { dark: fg, light: bg },
  });
}

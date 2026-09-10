/**
 * Whether a foreground/background pair still scans.
 *
 * Pure, so the popover can answer instantly and the server can refuse the same
 * pair regardless of what the client allowed.
 */

export interface QrColors {
  fg: string;
  bg: string;
}

export const DEFAULT_QR_COLORS: QrColors = { fg: "#15151A", bg: "#FFFFFF" };

/** Minimum WCAG contrast ratio we accept. Scanners are less forgiving than eyes. */
export const MIN_CONTRAST = 4;

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

/** Expands #abc to #aabbcc and lowercases, so equal colors compare equal. */
export function normalizeHex(value: string): string {
  const hex = value.trim().toLowerCase();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const full = normalizeHex(hex);
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Returns why a pair will not scan, or null when it will. */
export function validateQrColors(colors: QrColors): string | null {
  if (!isHexColor(colors.fg) || !isHexColor(colors.bg)) {
    return "Use hex colors like #15151A.";
  }

  // An inverted code — light modules on a dark field — fails on a large share
  // of phone scanners. It is the single most common way customisation breaks.
  if (luminance(colors.fg) >= luminance(colors.bg)) {
    return "The code must be darker than its background, or many phones won't read it.";
  }

  const ratio = contrastRatio(colors.fg, colors.bg);
  if (ratio < MIN_CONTRAST) {
    return `Not enough contrast to scan reliably (${ratio.toFixed(1)}:1, needs ${MIN_CONTRAST}:1).`;
  }

  return null;
}

/**
 * What a QR code encodes: the short link — never the destination, so the
 * destination can change without reprinting (spec §15) — plus `?qr=1`, which is
 * how the resolver tells a scan from a click.
 */
export function qrTargetUrl(host: string, slug: string): string {
  return `https://${host}/${slug}?qr=1`;
}

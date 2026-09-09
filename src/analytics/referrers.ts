/**
 * The database stores whatever hostname the referrer header carried (or null
 * for direct traffic). The screens show the buckets spec §11 defines:
 * Google / Instagram / Facebook / Direct / YouTube / Other.
 */

const HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)instagram\.com$/i, "Instagram"],
  [/(^|\.)google\.[a-z.]+$/i, "Google"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/i, "Facebook"],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, "YouTube"],
];

export function normalizeReferrer(referrer: string | null | undefined): string {
  if (!referrer) return "Direct";

  let host = referrer.trim();
  if (!host) return "Direct";

  // Accept both a bare hostname and a full URL.
  if (host.includes("://")) {
    try {
      host = new URL(host).hostname;
    } catch {
      return "Other";
    }
  }
  host = host.replace(/^www\./i, "").replace(/\/.*$/, "");

  for (const [pattern, label] of HOSTS) {
    if (pattern.test(host)) return label;
  }
  return "Other";
}

/** Folds raw hostname counts into the display buckets, largest first. */
export function bucketReferrers(
  rows: Array<{ referrer: string | null; count: number }>,
): Array<{ label: string; count: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = normalizeReferrer(row.referrer);
    totals.set(label, (totals.get(label) ?? 0) + row.count);
  }
  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

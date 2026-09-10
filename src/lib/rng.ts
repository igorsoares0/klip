/**
 * Seeded LCG, ported verbatim from the design prototype.
 *
 * Used by prisma/seed.ts so re-seeding produces the same click distribution
 * every time.
 */
export function rnd(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

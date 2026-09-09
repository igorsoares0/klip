/**
 * Seeded LCG, ported verbatim from the design prototype.
 *
 * Every generated series must be deterministic: the charts render on the server
 * and hydrate on the client, so `Math.random()` here would produce a hydration
 * mismatch. Same reason the QR placeholder grid is seeded.
 */
export function rnd(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

import { rnd } from "@/lib/rng";

/**
 * Placeholder QR pattern ported from the design prototype: a seeded 13x13 grid
 * with real finder squares in three corners. Seeded so a card keeps the same
 * pattern between renders.
 *
 * TODO: replace with a real QR renderer (`qrcode` / `qr-code-styling`).
 */
export function qrCells(seed: number): boolean[] {
  const next = rnd(seed);
  const n = 13;
  const cells: boolean[] = [];
  const isFinder = (x: number, y: number) =>
    (x < 3 && y < 3) || (x > 9 && y < 3) || (x < 3 && y > 9);
  const ring = (x: number, y: number) => {
    const lx = x > 9 ? x - 10 : x;
    const ly = y > 9 ? y - 10 : y;
    return lx === 0 || lx === 2 || ly === 0 || ly === 2 || (lx === 1 && ly === 1);
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      cells.push(isFinder(x, y) ? ring(x, y) : next() > 0.52);
    }
  }
  return cells;
}

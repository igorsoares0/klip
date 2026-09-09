import { rnd } from "../rng";
import type { QrCode } from "../types";

export const qrCodes: QrCode[] = [
  { id: "qr_1", slug: "summer-sale", scans: 2318, createdAt: "Jun 12" },
  { id: "qr_2", slug: "creator-drop", scans: 1204, createdAt: "Jul 03" },
  { id: "qr_3", slug: "menu-pdv", scans: 842, createdAt: "Aug 21" },
  { id: "qr_4", slug: "event-badge", scans: 318, createdAt: "Sep 01" },
];

/**
 * Placeholder QR grid, ported from the prototype: a seeded 13x13 pattern with
 * real finder squares in three corners.
 *
 * TODO: replace with a real QR renderer (the handoff names `qrcode` /
 * `qr-code-styling`) once the short link is a real URL.
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

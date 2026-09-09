import type { Invoice } from "../types";

export const plan = {
  name: "Klip Pro LTD",
  badge: "LIFETIME · ACTIVE",
  purchased: "Purchased Mar 12, 2026 via Paddle · $89 one-time",
};

/** Configurable click quota — spec §19 puts the MVP ceiling at 100k/month. */
export const usage = {
  label: "Tracked clicks this month",
  used: 84392,
  limit: 100000,
  resets: "Resets Oct 1 · need more? Add a click pack.",
};

export const entitlements = [
  "Unlimited short links",
  "Unlimited projects & folders",
  "QR codes (PNG + SVG)",
  "Full click analytics",
  "UTM builder",
  "3 custom domains",
];

export const invoices: Invoice[] = [
  { date: "Mar 12, 2026", amount: "$89.00" },
  { date: "—", amount: "LTD · no renewal" },
];

import { db } from "@/lib/db";
import { getMonthlyClickUsage, nextMonthStart } from "@/analytics/queries";
import { CLICK_LIMIT } from "@/entitlements/limits";

const PLAN_NAMES: Record<string, string> = {
  LIFETIME: "Klip Pro LTD",
  FREE: "Klip Free",
};

/** The name a workspace's plan goes by, from its entitlement row. No row is Free. */
export function planName(plan: string | null | undefined): string {
  return PLAN_NAMES[plan ?? "FREE"] ?? "Klip";
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Oct 1" — when tracked clicks reset. They count per UTC calendar month. */
export function resetDate(now = new Date()): string {
  return SHORT_DATE.format(nextMonthStart(now));
}

/**
 * The billing screen, limited to what the database actually knows.
 *
 * The design showed a price, a receipt list and a PDF link. None of those exist
 * until billing runs through Paddle (spec phase 6), so none are made up here —
 * not even the price, which is a decision the code should not be quietly making.
 */
export async function getBilling(workspaceId: string) {
  const [entitlement, used] = await Promise.all([
    db.entitlement.findUnique({ where: { workspaceId } }),
    getMonthlyClickUsage(workspaceId),
  ]);

  const purchased = entitlement?.createdAt;
  const via = entitlement?.paddleTransactionId ? " via Paddle" : "";

  return {
    plan: {
      name: planName(entitlement?.plan),
      badge: `${entitlement?.plan ?? "FREE"} · ${entitlement?.status ?? "INACTIVE"}`,
      purchased: purchased
        ? `Purchased ${LONG_DATE.format(purchased)}${via}`
        : "No purchase on record",
    },
    usage: {
      label: "Tracked clicks this month",
      used,
      limit: CLICK_LIMIT,
      resets: `Resets ${resetDate()}`,
    },
  };
}

/**
 * Static: what the LIFETIME plan grants (spec §19), limited to what is built.
 * Custom domains join this list when they exist (phase 7).
 */
export const LIFETIME_ENTITLEMENTS = [
  "Unlimited short links",
  "Unlimited projects & folders",
  "QR codes (PNG + SVG)",
  "Full click analytics",
  "UTM builder",
];

import { db } from "@/lib/db";
import { getMonthlyClickUsage } from "@/analytics/queries";
import { CLICK_LIMIT } from "@/entitlements/limits";

const PLAN_NAMES: Record<string, string> = {
  LIFETIME: "Klip Pro LTD",
  FREE: "Klip Free",
};

export async function getBilling(workspaceId: string) {
  const [entitlement, used] = await Promise.all([
    db.entitlement.findUnique({ where: { workspaceId } }),
    getMonthlyClickUsage(workspaceId),
  ]);

  const purchased = entitlement?.createdAt;
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);

  return {
    plan: {
      name: PLAN_NAMES[entitlement?.plan ?? "FREE"] ?? "Klip",
      badge: `${entitlement?.plan ?? "FREE"} · ${entitlement?.status ?? "INACTIVE"}`,
      purchased: purchased
        ? `Purchased ${purchased.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} via Paddle · $89 one-time`
        : "No purchase on record",
    },
    usage: {
      label: "Tracked clicks this month",
      used,
      limit: CLICK_LIMIT,
      resets: `Resets ${nextMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · need more? Add a click pack.`,
    },
    invoices: entitlement?.paddleTransactionId
      ? [
          {
            date: purchased!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            amount: "$89.00",
          },
          { date: "—", amount: "LTD · no renewal" },
        ]
      : [],
  };
}

/** Static: what the LIFETIME plan grants (spec §19). */
export const LIFETIME_ENTITLEMENTS = [
  "Unlimited short links",
  "Unlimited projects & folders",
  "QR codes (PNG + SVG)",
  "Full click analytics",
  "UTM builder",
  "3 custom domains",
];

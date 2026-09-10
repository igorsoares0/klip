import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getBilling, LIFETIME_ENTITLEMENTS, planName, resetDate } from "./queries";
import { getShellData } from "@/workspaces/queries";
import { getMonthlyClickUsage, monthStart } from "@/analytics/queries";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const ACME = "ws_acme";
const MARK = `billing-test-${Date.now()}`;
let fresh: string;
let userId: string;

beforeAll(async () => {
  // A workspace that bought nothing: no entitlement row at all.
  const user = await db.user.create({ data: { email: `${MARK}@example.com`, name: "Fresh User" } });
  userId = user.id;
  const workspace = await db.workspace.create({
    data: { name: "Fresh", slug: MARK, members: { create: { userId, role: "OWNER" } } },
  });
  fresh = workspace.id;
});

afterAll(async () => {
  await db.workspace.deleteMany({ where: { id: fresh } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("billing shows only what the database knows", () => {
  it("states no price, since none has been decided in code", async () => {
    const billing = await getBilling(ACME);
    expect(JSON.stringify(billing)).not.toMatch(/\$\d/);
  });

  it("invents no receipts and offers no click packs", async () => {
    const billing = await getBilling(ACME);
    expect(billing).not.toHaveProperty("invoices");
    expect(billing.usage.resets).not.toMatch(/click pack/i);
  });

  it("does not list custom domains, which are not built", () => {
    expect(LIFETIME_ENTITLEMENTS.join(" ")).not.toMatch(/domain/i);
  });

  it("says Free, not Lifetime, for a workspace that bought nothing", async () => {
    const billing = await getBilling(fresh);
    expect(billing.plan.name).toBe("Klip Free");
    expect(billing.plan.purchased).toBe("No purchase on record");
  });
});

describe("sidebar usage meter", () => {
  it("names the workspace's real plan", async () => {
    const shell = await getShellData(fresh, userId);
    expect(shell.usage.note).not.toMatch(/lifetime/i);
    expect(shell.usage.note).toContain(planName(null));

    const acme = await db.entitlement.findUnique({ where: { workspaceId: ACME } });
    const acmeShell = await getShellData(ACME, "usr_maria");
    expect(acmeShell.usage.note).toContain(planName(acme?.plan));
  });

  it("gives the reset as the first of next month", async () => {
    const shell = await getShellData(fresh, userId);
    expect(shell.usage.note).toContain(`resets ${resetDate()}`);
    expect(resetDate(new Date("2026-09-30T23:59:00Z"))).toBe("Oct 1");
    expect(resetDate(new Date("2026-12-15T12:00:00Z"))).toBe("Jan 1");
  });
});

describe("the tracked-click month", () => {
  it("starts at midnight UTC on the 1st", () => {
    expect(monthStart(new Date("2025-06-15T12:00:00Z")).toISOString()).toBe(
      "2025-06-01T00:00:00.000Z",
    );
  });

  it("does not count a click from the last evening of the previous UTC month", async () => {
    const link = await db.link.create({
      data: { workspaceId: fresh, domainId: "dom_klip", slug: MARK, destinationUrl: "https://example.com" },
    });
    await db.linkClick.createMany({
      data: [
        // Still May in UTC, though already June 1 in Tokyo — the server's
        // timezone must not decide which month this belongs to.
        { linkId: link.id, workspaceId: fresh, timestamp: new Date("2025-05-31T23:30:00Z") },
        { linkId: link.id, workspaceId: fresh, timestamp: new Date("2025-06-01T00:30:00Z") },
        { linkId: link.id, workspaceId: fresh, timestamp: new Date("2025-06-10T12:00:00Z"), isBot: true },
      ],
    });

    expect(await getMonthlyClickUsage(fresh, new Date("2025-06-15T12:00:00Z"))).toBe(1);
  });
});

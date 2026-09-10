import "dotenv/config";
import { afterAll, expect, it } from "vitest";
import { db } from "./db";
import { createLink } from "@/links/actions";
import { listLinks } from "@/links/queries";
import { listQrCodes } from "@/qr/queries";
import { getLink } from "@/links/queries";

/** The whole create-link journey, exactly as the drawer drives it. */

const WORKSPACE = "ws_acme";
let createdId: string | null = null;

afterAll(async () => {
  if (createdId) await db.link.deleteMany({ where: { id: createdId } });
  await db.$disconnect();
});

it("creates a link that shows up in the list, the detail page and QR codes", async () => {
  const form = new FormData();
  form.set("destination", "https://example.com/launch?variant=b");
  form.set("slug", "e2e-launch");
  form.set("domainId", "dom_klip");
  form.set("title", "Launch");
  form.set("utmSource", "instagram");
  form.set("utmCampaign", "launch");
  form.set("generateQr", "on");

  const result = await createLink(form);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  createdId = result.data.id;

  // The toast points at this id.
  expect(result.data.host).toBe("klip.to");
  expect(result.data.slug).toBe("e2e-launch");

  // It is reachable through the query the detail page uses...
  const detail = await getLink(WORKSPACE, result.data.id);
  expect(detail?.destinationUrl).toBe("https://example.com/launch?variant=b");
  expect(detail?.utmSource).toBe("instagram");
  expect(detail?.utmCampaign).toBe("launch");
  expect(detail?.utmMedium).toBeNull();

  // ...and appears in the links list with no clicks yet.
  const listed = (await listLinks(WORKSPACE, { take: 100 })).rows;
  const row = listed.find((link) => link.id === result.data.id);
  expect(row?.clicks).toBe(0);
  expect(row?.createdAt).toBe("just now");

  // The QR checkbox produced a real row on the QR screen.
  const qrCodes = await listQrCodes(WORKSPACE);
  expect(qrCodes.some((qr) => qr.slug === "e2e-launch")).toBe(true);
});

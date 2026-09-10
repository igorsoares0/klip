import "dotenv/config";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { checkSlugAvailability, createLink } from "@/links/actions";
import { createApiKey, revokeApiKey } from "@/api-keys/actions";
import { setPrivacyToggle, updateWorkspaceProfile } from "@/workspaces/actions";
import { listApiKeys } from "@/api-keys/queries";
import { createHash } from "node:crypto";

/**
 * Integration tests against the local Postgres. `npm run db:up && npm run db:seed`.
 *
 * These exercise the server actions directly — which is also how an attacker
 * would reach them, since server functions accept direct POSTs.
 */

const WORKSPACE = "ws_acme";
const KLIP_DOMAIN = "dom_klip";
const ACME_DOMAIN = "dom_acme";

const created: string[] = [];
const createdKeys: string[] = [];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

afterEach(async () => {
  if (created.length) {
    await db.link.deleteMany({ where: { id: { in: created.splice(0) } } });
  }
  if (createdKeys.length) {
    await db.apiKey.deleteMany({ where: { id: { in: createdKeys.splice(0) } } });
  }
});

afterAll(async () => {
  await db.$disconnect();
});

describe("createLink", () => {
  it("writes a link owned by the current workspace", async () => {
    const result = await createLink(
      form({
        destination: "https://example.com/new",
        slug: "action-test-1",
        domainId: KLIP_DOMAIN,
        title: "From the action",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push(result.data.id);

    const row = await db.link.findUnique({ where: { id: result.data.id } });
    expect(row?.workspaceId).toBe(WORKSPACE);
    expect(row?.slug).toBe("action-test-1");
    expect(row?.clickCount).toBe(0);
  });

  it("normalizes the slug before storing it", async () => {
    const result = await createLink(
      form({
        destination: "https://example.com/x",
        slug: "  Action TEST 2  ",
        domainId: KLIP_DOMAIN,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push(result.data.id);
    expect(result.data.slug).toBe("action-test-2");
  });

  it("creates the QR code when asked", async () => {
    const result = await createLink(
      form({
        destination: "https://example.com/qr",
        slug: "action-test-qr",
        domainId: KLIP_DOMAIN,
        generateQr: "on",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push(result.data.id);

    const qr = await db.qrCode.findUnique({ where: { linkId: result.data.id } });
    expect(qr).not.toBeNull();
    // Deleting the link cascades to its QR row.
  });

  it("rejects a slug already used on the same domain", async () => {
    const result = await createLink(
      form({
        destination: "https://example.com/dupe",
        slug: "summer-sale",
        domainId: KLIP_DOMAIN,
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("slug");
    expect(result.error).toContain("already in use");
  });

  it("accepts the same slug on a different domain", async () => {
    const result = await createLink(
      form({
        destination: "https://example.com/other",
        slug: "summer-sale",
        domainId: ACME_DOMAIN,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push(result.data.id);
    expect(result.data.host).toBe("go.acme.com");
  });

  it("validates the destination server-side", async () => {
    const result = await createLink(
      form({ destination: "example.com", slug: "action-bad-dest", domainId: KLIP_DOMAIN }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("destination");
  });

  it("refuses a reserved slug even though the client also blocks it", async () => {
    const result = await createLink(
      form({ destination: "https://example.com", slug: "admin", domainId: KLIP_DOMAIN }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("That path is reserved by Klip.");
  });
});

describe("createLink cross-tenant inputs", () => {
  // A server action is reachable by direct POST, so these ids are attacker
  // controlled. None of them may be honoured.
  it("refuses a domain the workspace does not own", async () => {
    const foreign = await db.customDomain.create({
      data: { host: `foreign-${Date.now()}.example`, status: "ACTIVE" },
    });
    // Give it to nobody-else's workspace so it is not the shared domain either.
    await db.customDomain.update({
      where: { id: foreign.id },
      data: { workspace: { create: { name: "Other", slug: `other-${Date.now()}` } } },
    });

    const result = await createLink(
      form({
        destination: "https://example.com",
        slug: "action-foreign-domain",
        domainId: foreign.id,
      }),
    );

    expect(result.ok).toBe(false);

    const orphan = await db.link.findFirst({ where: { slug: "action-foreign-domain" } });
    expect(orphan).toBeNull();

    const owner = await db.customDomain.findUnique({
      where: { id: foreign.id },
      select: { workspaceId: true },
    });
    await db.customDomain.delete({ where: { id: foreign.id } });
    if (owner?.workspaceId) {
      await db.workspace.delete({ where: { id: owner.workspaceId } });
    }
  });

  it("refuses a project from another workspace", async () => {
    const other = await db.workspace.create({
      data: { name: "Other", slug: `other-p-${Date.now()}` },
    });
    const project = await db.project.create({
      data: { workspaceId: other.id, name: "Theirs" },
    });

    const result = await createLink(
      form({
        destination: "https://example.com",
        slug: "action-foreign-project",
        domainId: KLIP_DOMAIN,
        projectId: project.id,
      }),
    );

    expect(result.ok).toBe(false);
    expect(await db.link.findFirst({ where: { slug: "action-foreign-project" } })).toBeNull();

    await db.workspace.delete({ where: { id: other.id } });
  });
});

describe("checkSlugAvailability", () => {
  it("reports a seeded slug as taken, with the suggestion", async () => {
    const result = await checkSlugAvailability(KLIP_DOMAIN, "summer-sale");
    expect(result.available).toBe(false);
    expect(result.message).toBe(
      "klip.to/summer-sale is already in use — try summer-sale-2.",
    );
  });

  it("reports a free slug as available", async () => {
    const result = await checkSlugAvailability(KLIP_DOMAIN, "definitely-not-taken-xyz");
    expect(result.available).toBe(true);
    expect(result.message).toBeNull();
  });

  it("answers format problems without consulting the database", async () => {
    const result = await checkSlugAvailability(KLIP_DOMAIN, "Not_Valid");
    expect(result.available).toBe(false);
    expect(result.message).toBe("Use lowercase letters, numbers and hyphens only.");
  });

  it("says nothing for an empty slug", async () => {
    expect(await checkSlugAvailability(KLIP_DOMAIN, "  ")).toEqual({
      available: false,
      message: null,
    });
  });

  it("scopes the answer to the domain", async () => {
    // Free on go.acme.com even though it is taken on klip.to.
    const result = await checkSlugAvailability(ACME_DOMAIN, "summer-sale");
    expect(result.available).toBe(true);
  });
});

describe("api keys", () => {
  it("stores only a hash and reveals the plaintext once", async () => {
    const result = await createApiKey();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdKeys.push(result.data.id);

    const { plaintext } = result.data;
    expect(plaintext.startsWith("klip_live_")).toBe(true);

    const row = await db.apiKey.findUnique({ where: { id: result.data.id } });
    expect(row?.hashedKey).not.toBe(plaintext);
    expect(row?.hashedKey).toBe(createHash("sha256").update(plaintext).digest("hex"));
    expect(row?.last4).toBe(plaintext.slice(-4));

    // The listing never carries the secret, in any form.
    const listed = await listApiKeys(WORKSPACE);
    const entry = listed.find((key) => key.id === result.data.id);
    expect(entry?.masked).toContain("••••");
    expect(JSON.stringify(listed)).not.toContain(plaintext);
  });

  it("revokes a key so it leaves the listing", async () => {
    const created = await createApiKey();
    if (!created.ok) throw new Error("setup failed");
    createdKeys.push(created.data.id);

    expect(await revokeApiKey(created.data.id)).toMatchObject({ ok: true });

    const listed = await listApiKeys(WORKSPACE);
    expect(listed.find((key) => key.id === created.data.id)).toBeUndefined();

    const row = await db.apiKey.findUnique({ where: { id: created.data.id } });
    expect(row?.revokedAt).not.toBeNull();
  });

  it("will not revoke a key belonging to another workspace", async () => {
    const other = await db.workspace.create({
      data: { name: "Other", slug: `other-k-${Date.now()}` },
    });
    const theirs = await db.apiKey.create({
      data: {
        workspaceId: other.id,
        name: "Theirs",
        hashedKey: `other-${Date.now()}`,
        keyPrefix: "klip_live",
        last4: "aaaa",
      },
    });

    const result = await revokeApiKey(theirs.id);
    expect(result.ok).toBe(false);

    const row = await db.apiKey.findUnique({ where: { id: theirs.id } });
    expect(row?.revokedAt).toBeNull();

    await db.workspace.delete({ where: { id: other.id } });
  });
});

describe("workspace settings", () => {
  it("persists the profile and restores it", async () => {
    const before = await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } });

    const result = await updateWorkspaceProfile(
      form({ name: "Renamed Co", slug: "renamed-co", defaultDomainId: KLIP_DOMAIN }),
    );
    expect(result).toMatchObject({ ok: true });

    const after = await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } });
    expect(after.name).toBe("Renamed Co");
    expect(after.slug).toBe("renamed-co");

    await db.workspace.update({
      where: { id: WORKSPACE },
      data: { name: before.name, slug: before.slug },
    });
  });

  it("rejects an empty name", async () => {
    const result = await updateWorkspaceProfile(form({ name: "  ", slug: "acme-growth" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("name");
  });

  it("rejects a malformed workspace slug", async () => {
    const result = await updateWorkspaceProfile(
      form({ name: "Acme Growth", slug: "Not Valid!" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.field).toBe("workspaceSlug");
  });

  it("toggles a privacy switch and persists it", async () => {
    const before = await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } });

    expect(await setPrivacyToggle("dnt", !before.respectDoNotTrack)).toMatchObject({
      ok: true,
    });

    const after = await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } });
    expect(after.respectDoNotTrack).toBe(!before.respectDoNotTrack);

    await setPrivacyToggle("dnt", before.respectDoNotTrack);
  });

  it("refuses a setting id that is not on the allowlist", async () => {
    // A crafted POST must not be able to name an arbitrary column.
    const result = await setPrivacyToggle("slug", true);
    expect(result.ok).toBe(false);

    const row = await db.workspace.findUniqueOrThrow({ where: { id: WORKSPACE } });
    expect(row.slug).toBe("acme-growth");
  });
});

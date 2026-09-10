import "dotenv/config";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { setTestSession, TEST_SESSION } from "../../vitest.setup";
import {
  checkCredentials,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "@/auth/actions";
import { consumeToken, hashToken, issueToken } from "@/auth/tokens";
import { hashPassword, passwordStrength, verifyPassword } from "@/auth/password";
import { listLinks } from "@/links/queries";
import { createApiKey } from "@/api-keys/actions";
import { UnauthenticatedError } from "@/auth/session";

/** Integration tests. `npm run db:up && npm run db:seed` first. */

const created: string[] = [];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

function uniqueEmail(tag: string): string {
  return `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
}

async function cleanupUser(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, memberships: { select: { workspaceId: true } } },
  });
  if (!user) return;
  for (const membership of user.memberships) {
    await db.workspace.deleteMany({ where: { id: membership.workspaceId } });
  }
  await db.user.deleteMany({ where: { id: user.id } });
}

beforeEach(() => {
  setTestSession(TEST_SESSION);
});

afterEach(async () => {
  for (const email of created.splice(0)) await cleanupUser(email);
  setTestSession(TEST_SESSION);
});

afterAll(async () => {
  await db.$disconnect();
});

describe("password hashing", () => {
  it("never stores the plaintext and verifies round-trip", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces a different hash for the same password", async () => {
    // bcrypt salts, so two hashes of one password must not match.
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
  });

  it("scores strength for the meter", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("short")).toBe(0);
    expect(passwordStrength("longenough")).toBe(1);
    expect(passwordStrength("Longenough12345")).toBeGreaterThanOrEqual(3);
  });
});

describe("register", () => {
  it("creates user, workspace and membership together (spec §6)", async () => {
    const email = uniqueEmail("reg");
    created.push(email);

    const result = await register(
      form({ name: "Test Person", email, password: "a-good-password" }),
    );
    expect(result.ok).toBe(true);

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, memberships: true },
    });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe("a-good-password");
    expect(user!.memberships).toHaveLength(1);
    expect(user!.memberships[0].role).toBe("OWNER");

    const workspace = await db.workspace.findUnique({
      where: { id: user!.memberships[0].workspaceId },
    });
    expect(workspace).not.toBeNull();
  });

  it("lowercases and trims the email", async () => {
    const email = uniqueEmail("case");
    created.push(email);

    await register(
      form({ name: "", email: `  ${email.toUpperCase()}  `, password: "a-good-password" }),
    );
    expect(await db.user.findUnique({ where: { email } })).not.toBeNull();
  });

  it("refuses a duplicate email", async () => {
    const email = uniqueEmail("dupe");
    created.push(email);

    expect((await register(form({ email, password: "a-good-password" }))).ok).toBe(true);

    const second = await register(form({ email, password: "another-password" }));
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toContain("already exists");

    expect(await db.user.count({ where: { email } })).toBe(1);
  });

  it("refuses a short password", async () => {
    const result = await register(form({ email: uniqueEmail("short"), password: "abc" }));
    expect(result.ok).toBe(false);
  });

  it("refuses a malformed email", async () => {
    const result = await register(form({ email: "not-an-email", password: "a-good-password" }));
    expect(result.ok).toBe(false);
  });

  it("issues a verification token that is stored hashed", async () => {
    const email = uniqueEmail("verify");
    created.push(email);
    await register(form({ email, password: "a-good-password" }));

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const token = await db.emailToken.findFirst({
      where: { userId: user.id, type: "VERIFY_EMAIL" },
    });
    expect(token).not.toBeNull();
    expect(token!.usedAt).toBeNull();
    // 64 hex characters — a SHA-256 digest, not the emailed value.
    expect(token!.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("credentials", () => {
  it("authenticates the seeded developer account", async () => {
    expect(await checkCredentials("maria@acme.com", "klip-dev-password")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    expect(await checkCredentials("maria@acme.com", "nope")).toBe(false);
  });

  it("rejects an unknown email without leaking that it is unknown", async () => {
    expect(await checkCredentials("nobody@example.com", "anything")).toBe(false);
  });
});

describe("email tokens", () => {
  it("is single use", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const { token } = await issueToken(user.id, "PASSWORD_RESET");

    expect(await consumeToken(token, "PASSWORD_RESET")).toBe(user.id);
    expect(await consumeToken(token, "PASSWORD_RESET")).toBeNull();
  });

  it("will not answer for the wrong token type", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const { token } = await issueToken(user.id, "PASSWORD_RESET");
    expect(await consumeToken(token, "VERIFY_EMAIL")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const { id, token } = await issueToken(user.id, "PASSWORD_RESET");

    await db.emailToken.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await consumeToken(token, "PASSWORD_RESET")).toBeNull();
  });

  it("invalidates the previous token of the same type", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const first = await issueToken(user.id, "PASSWORD_RESET");
    await issueToken(user.id, "PASSWORD_RESET");

    // Asking again must not leave two live links.
    expect(await consumeToken(first.token, "PASSWORD_RESET")).toBeNull();
  });

  it("stores the hash, not the token", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const { id, token } = await issueToken(user.id, "VERIFY_EMAIL");

    const row = await db.emailToken.findUniqueOrThrow({ where: { id } });
    expect(row.tokenHash).not.toBe(token);
    expect(row.tokenHash).toBe(hashToken(token));

    await db.emailToken.update({ where: { id }, data: { usedAt: new Date() } });
  });

  it("rejects garbage", async () => {
    expect(await consumeToken("", "PASSWORD_RESET")).toBeNull();
    expect(await consumeToken("not-a-real-token", "PASSWORD_RESET")).toBeNull();
  });
});

describe("password reset", () => {
  it("answers identically whether or not the account exists", async () => {
    // Otherwise the form tells anyone who asks which emails have accounts.
    const known = await requestPasswordReset(form({ email: "maria@acme.com" }));
    const unknown = await requestPasswordReset(form({ email: "nobody@example.com" }));
    expect(known).toEqual(unknown);
  });

  it("changes the password and burns the link", async () => {
    const email = uniqueEmail("reset");
    created.push(email);
    await register(form({ email, password: "original-password" }));

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const { token } = await issueToken(user.id, "PASSWORD_RESET");

    expect(
      await resetPassword(form({ token, password: "brand-new-password" })),
    ).toMatchObject({ ok: true });

    expect(await checkCredentials(email, "brand-new-password")).toBe(true);
    expect(await checkCredentials(email, "original-password")).toBe(false);

    // The same link a second time must fail.
    const replay = await resetPassword(form({ token, password: "third-password" }));
    expect(replay.ok).toBe(false);
    expect(await checkCredentials(email, "brand-new-password")).toBe(true);
  });

  it("refuses a short new password before touching the token", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "maria@acme.com" } });
    const { id, token } = await issueToken(user.id, "PASSWORD_RESET");

    expect((await resetPassword(form({ token, password: "abc" }))).ok).toBe(false);

    // The token survives, so a valid retry still works.
    const row = await db.emailToken.findUniqueOrThrow({ where: { id } });
    expect(row.usedAt).toBeNull();

    await db.emailToken.update({ where: { id }, data: { usedAt: new Date() } });
  });
});

describe("email verification", () => {
  it("marks the address verified, once", async () => {
    const email = uniqueEmail("confirm");
    created.push(email);
    await register(form({ email, password: "a-good-password" }));

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerified).toBeNull();

    const { token } = await issueToken(user.id, "VERIFY_EMAIL");
    expect(await verifyEmail(token)).toMatchObject({ ok: true });

    const after = await db.user.findUniqueOrThrow({ where: { email } });
    expect(after.emailVerified).not.toBeNull();

    expect((await verifyEmail(token)).ok).toBe(false);
  });
});

describe("without a session", () => {
  // proxy.ts keeps anonymous traffic out of the dashboard UI, but a server
  // action is reachable by direct POST regardless. These must refuse.
  it("refuses to list links", async () => {
    setTestSession(null);
    await expect(async () => {
      const { getCurrentWorkspaceId } = await import("@/workspaces/current");
      await listLinks(await getCurrentWorkspaceId());
    }).rejects.toThrow(UnauthenticatedError);
  });

  it("refuses to create an API key", async () => {
    setTestSession(null);
    await expect(createApiKey()).rejects.toThrow(UnauthenticatedError);
  });

  it("refuses a session missing the workspace", async () => {
    setTestSession({ user: { id: "usr_maria" } });
    await expect(createApiKey()).rejects.toThrow(UnauthenticatedError);
  });
});

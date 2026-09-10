import { vi } from "vitest";

/**
 * Server actions are called directly from these tests — which is also how a
 * crafted POST reaches them. Next's cache helpers need a request context that
 * only the framework provides, so they are stubbed; what they invalidate is a
 * framework concern, not the business logic under test.
 */
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

/**
 * The signed-in session. Tests that need an anonymous caller override this with
 * `setTestSession(null)` — the actions still run their real code path,
 * including resolving the workspace from the session.
 */
export const TEST_SESSION = {
  user: { id: "usr_maria", email: "maria@acme.com", name: "Maria Rocha" },
  workspaceId: "ws_acme",
};

let currentSession: unknown = TEST_SESSION;

export function setTestSession(session: unknown) {
  currentSession = session;
}

vi.mock("@/auth/config", () => ({
  auth: vi.fn(async () => currentSession),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

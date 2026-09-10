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

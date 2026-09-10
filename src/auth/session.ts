import "server-only";
import { auth } from "./config";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "UnauthenticatedError";
  }
}

export interface CurrentUser {
  userId: string;
  workspaceId: string;
}

/**
 * The authorization boundary.
 *
 * `proxy.ts` also redirects anonymous traffic away from /dashboard, but the
 * Next docs are explicit that proxy is an optimistic check, not the boundary —
 * server actions are reachable by direct POST regardless of it. Everything that
 * touches workspace data goes through here.
 */
export async function requireSession(): Promise<CurrentUser> {
  const session = await auth();
  const userId = session?.user?.id;
  const workspaceId = session?.workspaceId;

  if (!userId || !workspaceId) throw new UnauthenticatedError();
  return { userId, workspaceId };
}

export async function getSessionOrNull(): Promise<CurrentUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  const workspaceId = session?.workspaceId;
  return userId && workspaceId ? { userId, workspaceId } : null;
}

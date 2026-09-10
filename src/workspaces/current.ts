import { requireSession } from "@/auth/session";

/**
 * The current workspace, from the signed-in session.
 *
 * Every query and action takes workspaceId as an explicit argument and gets it
 * from here — so a request with no session cannot reach workspace data, whether
 * it arrived through a page or as a direct POST to a server action.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  const { workspaceId } = await requireSession();
  return workspaceId;
}

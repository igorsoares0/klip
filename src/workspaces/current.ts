/**
 * The single place the current workspace is resolved.
 *
 * TODO: replace with the workspace from the Auth.js session once auth lands.
 * Every query takes workspaceId explicitly, so this is the only line that has
 * to change.
 */
export async function getCurrentWorkspaceId(): Promise<string> {
  return "ws_acme";
}

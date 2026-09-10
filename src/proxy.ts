import { auth } from "@/auth/config";

/**
 * Next 16 renamed middleware to proxy. This is an *optimistic* check that keeps
 * anonymous traffic out of the dashboard UI — the real authorization boundary
 * is `requireSession()` in src/auth/session.ts, which every query and action
 * goes through.
 */
export default auth((req) => {
  if (req.auth) return;

  const signIn = new URL("/login", req.nextUrl.origin);
  signIn.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return Response.redirect(signIn);
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};

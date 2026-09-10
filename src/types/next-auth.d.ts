import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** Set from the JWT; the tenant every query is scoped by. */
    workspaceId?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    workspaceId?: string;
  }
}

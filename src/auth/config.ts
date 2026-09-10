import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { verifyPassword } from "./password";
import { ensureWorkspaceFor } from "./workspace";

/**
 * Auth.js v5.
 *
 * The session is a JWT, not a database row: Auth.js refuses to sign a user in
 * through the Credentials provider under the database strategy, and spec §3
 * requires email + password. `Session` and `VerificationToken` therefore exist
 * in the schema but stay empty — see spec §42.
 *
 * The upside is that `workspaceId` rides along in the token, so resolving the
 * current workspace costs no query.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, image: true, passwordHash: true },
        });

        // A Google-only account has no hash. Comparing against nothing must not
        // be treated as a match.
        if (!user?.passwordHash) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the sign-in pass.
      if (user?.id) {
        token.userId = user.id;
        token.workspaceId = await ensureWorkspaceFor(user.id, user.email ?? null);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      session.workspaceId = token.workspaceId as string | undefined;
      return session;
    },
  },
  events: {
    /**
     * The adapter creates the User for an OAuth sign-in on its own. Without
     * this hook that user would have no workspace and no membership — spec §6
     * requires all three.
     */
    async createUser({ user }) {
      if (user.id) await ensureWorkspaceFor(user.id, user.email ?? null);
    },
  },
});

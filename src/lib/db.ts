import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7 requires a driver adapter — the client cannot connect without one.
 * PrismaPg is the TCP adapter, which is what both the local Postgres and Neon
 * (reached from a long-running Hetzner container, per spec §26) want.
 *
 * The instance is cached on globalThis outside production so hot reload does
 * not open a new connection pool on every recompile.
 */
const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

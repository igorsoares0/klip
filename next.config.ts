import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's generated client and the native pg driver must not be bundled —
  // Turbopack loads them from node_modules at runtime instead.
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;

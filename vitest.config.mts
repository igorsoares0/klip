import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Everything under test today is pure logic — no DOM environment needed.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // The integration tests share one Postgres, so files must not run
    // concurrently — two of them creating the same slug would collide.
    fileParallelism: false,
    include: ["src/**/*.test.ts"],
  },
});

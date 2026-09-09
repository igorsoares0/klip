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
    include: ["src/**/*.test.ts"],
  },
});

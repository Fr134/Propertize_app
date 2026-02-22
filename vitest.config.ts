import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "backend/src/**/*.test.ts",
      "frontend/src/**/*.test.ts",
      "shared/src/**/*.test.ts",
    ],
    exclude: ["node_modules", ".next", "dist"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "backend/src/lib/validators.ts",
        "backend/src/lib/supply-utils.ts",
        "frontend/src/lib/supply-utils.ts",
      ],
      thresholds: {
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "frontend/src"),
    },
  },
});

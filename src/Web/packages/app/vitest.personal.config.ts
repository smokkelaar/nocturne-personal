import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  server: { fs: { strict: false } },
  resolve: {
    alias: [
      {
        find: "$lib/api/generated/personalGoogleHealths.generated.remote",
        replacement: local("./src/lib/test-stubs/personal-google-health.ts"),
      },
      {
        find: "$app/paths",
        replacement: local("./src/lib/test-stubs/personal-app-paths.ts"),
      },
      { find: "$lib", replacement: local("./src/lib") },
    ],
  },
  test: {
    include: [
      "src/**/google-health-page.svelte.test.ts",
      "src/lib/personal/google-health-error.test.ts",
    ],
    setupFiles: ["vitest-browser-svelte"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { channel: process.env.NOCTURNE_TEST_BROWSER_CHANNEL },
      }),
      instances: [{ browser: "chromium" }],
    },
  },
});

import { defineConfig } from "@playwright/test";

const port = Number(process.env.HISTORIA_BENCHMARK_PORT || 4173);

export default defineConfig({
  testDir: "./tools/benchmarks",
  testMatch: "map-benchmark.spec.js",
  workers: 1,
  timeout: Number(process.env.HISTORIA_BENCHMARK_TIMEOUT_MS || 45 * 60 * 1000),
  reporter: "line",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        headless: process.env.HISTORIA_BENCHMARK_HEADED !== "1",
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2,
        launchOptions: {
          args: (process.env.HISTORIA_CHROMIUM_FLAGS || "--enable-unsafe-webgpu").split(/\s+/).filter(Boolean),
        },
      },
    },
  ],
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/benchmarks/map-benchmark.html`,
    reuseExistingServer: process.env.CI !== "true",
    timeout: 120000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
  },
});

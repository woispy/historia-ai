import { defineConfig } from "@playwright/test";

const port = Number(process.env.HISTORIA_BENCHMARK_PORT || 4173);
const angleBackend = process.env.HISTORIA_CHROMIUM_ANGLE || "d3d11";
const defaultGpuFlags = [
  "--enable-unsafe-webgpu",
  "--enable-gpu",
  "--ignore-gpu-blocklist",
  "--enable-gpu-rasterization",
  "--enable-zero-copy",
  `--use-angle=${angleBackend}`,
  "--use-gpu-in-tests",
  "--enable-dawn-features=allow_unsafe_apis",
  "--disable-dawn-features=use_dxc",
  "--enable-webgpu-developer-features",
  "--use-webgpu-power-preference=default-high-performance",
  "--disable-software-rasterizer",
];
const launchArgs = process.env.HISTORIA_CHROMIUM_FLAGS
  ? process.env.HISTORIA_CHROMIUM_FLAGS.split(/\s+/).filter(Boolean)
  : defaultGpuFlags;

export default defineConfig({
  testDir: "./tools/benchmarks",
  testMatch: /(?:map-benchmark|production-gpu-timestamp-probe|production-renderer-gpu-timestamp)\.spec\.js$/,
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
          args: launchArgs,
        },
      },
    },
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/benchmarks/map-benchmark.html`,
    reuseExistingServer: process.env.CI !== "true",
    timeout: 120000,
  },
});
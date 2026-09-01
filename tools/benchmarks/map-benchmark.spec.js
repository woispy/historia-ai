import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || "artifacts/benchmark-result.json";

test("Historia AI 15k / 4K / 2x DPR benchmark", async ({ page }) => {
  await page.goto(`/benchmarks/map-benchmark.html?durationMs=${durationMs}`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__HISTORIA_BENCHMARK_RESULT__), null, { timeout: durationMs + 120000 });
  const result = await page.evaluate(() => window.__HISTORIA_BENCHMARK_RESULT__);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_BENCHMARK_JSON ${JSON.stringify(result)}`);
});

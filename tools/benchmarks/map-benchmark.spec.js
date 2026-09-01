import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || "artifacts/benchmark-result.json";

async function runBenchmark(page, backend, file) {
  await page.goto(`/benchmarks/map-benchmark.html?backend=${backend}&durationMs=${durationMs}`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__HISTORIA_BENCHMARK_RESULT__), null, { timeout: durationMs + 120000 });
  const result = await page.evaluate(() => window.__HISTORIA_BENCHMARK_RESULT__);
  if (result.error) throw new Error(result.error);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_BENCHMARK_JSON ${JSON.stringify(result)}`);
  return result;
}

test("Historia AI 15k / 4K / 2x DPR benchmark", async ({ page }) => {
  await runBenchmark(page, "auto", output);
});

test("Historia AI WebGL2 fallback parity benchmark", async ({ page }) => {
  const parityOutput = output.replace(/\.json$/i, "-webgl2.json");
  const result = await runBenchmark(page, "webgl2", parityOutput);
  if (result.backend !== "webgl2") throw new Error(`Expected WebGL2 fallback, received ${result.backend}`);
  if (result.internalCanvas.width !== 7680 || result.internalCanvas.height !== 4320) throw new Error("WebGL2 benchmark did not render at 4K / 2x DPR internal resolution");
});

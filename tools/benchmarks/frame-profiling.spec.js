import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_FRAME_PROFILING_DURATION_MS || 30000);
const output = process.env.HISTORIA_FRAME_PROFILING_OUTPUT || "artifacts/frame-profiling-result.json";

test("Historia AI frame/pass profiling", async ({ page }) => {
  await page.goto(`/benchmarks/frame-profiling.html?durationMs=${durationMs}`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__HISTORIA_FRAME_PROFILING_RESULT__), null, { timeout: durationMs + 120000 });
  const result = await page.evaluate(() => window.__HISTORIA_FRAME_PROFILING_RESULT__);
  if (result.error) throw new Error(result.error);
  if (!result.gpu) throw new Error("Frame profiling missing WebGPU telemetry");
  if (result.gpu.drawCalls <= 0) throw new Error("Frame profiling missing GPU draw calls");
  if (result.gpu.queueSubmits <= 0) throw new Error("Frame profiling missing GPU queue submissions");
  if (result.picking.accepted <= 0) throw new Error("Frame profiling did not accept any picking operations");
  if (result.picking.completed <= 0) throw new Error("Frame profiling did not observe any completed picking readbacks");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_FRAME_PROFILING_JSON ${JSON.stringify(result)}`);
});

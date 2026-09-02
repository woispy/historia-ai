import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_FRAME_PROFILING_DURATION_MS || 30000);
const output = process.env.HISTORIA_FRAME_PROFILING_OUTPUT || "artifacts/frame-profiling-result.json";
const mode = process.env.HISTORIA_BENCHMARK_MODE || "paced144";

 test("Historia AI frame/pass profiling", async ({ page }) => {
  page.on("console", (msg) => console.log(`PAGE CONSOLE [${msg.type()}]: ${msg.text()}`));
  page.on("pageerror", (error) => console.log(`PAGE ERROR: ${error?.stack || error?.message || error}`));
  page.on("requestfailed", (request) => console.log(`PAGE REQUEST FAILED: ${request.method()} ${request.url()} :: ${request.failure()?.errorText || "unknown"}`));

  await page.goto(`/benchmarks/frame-profiling.html?durationMs=${durationMs}&mode=${encodeURIComponent(mode)}`, { waitUntil: "load" });

  try {
    await page.waitForFunction(() => Boolean(window.__HISTORIA_FRAME_PROFILING_RESULT__), null, { timeout: durationMs + 120000 });
  } catch (error) {
    const state = await page.evaluate(() => ({ readyState: document.readyState, result: window.__HISTORIA_FRAME_PROFILING_RESULT__ ?? null, diagnostics: document.querySelector("#diagnostics")?.textContent ?? null }));
    console.log(`FRAME_PROFILING_TIMEOUT_STATE ${JSON.stringify(state)}`);
    throw error;
  }

  const result = await page.evaluate(() => window.__HISTORIA_FRAME_PROFILING_RESULT__);
  if (result.error) throw new Error(result.error);
  if (!result.gpu) throw new Error("Frame profiling missing WebGPU telemetry");
  if (result.benchmarkMode !== mode) throw new Error(`Frame profiling mode mismatch: expected ${mode}, got ${result.benchmarkMode}`);
  if (result.gpu.queueSubmits <= 0) throw new Error("Frame profiling missing GPU queue submissions");
  if (mode !== "isolatedPick" && result.gpu.drawCalls <= 0) throw new Error("Frame profiling missing GPU draw calls");
  if (mode !== "paced144-no-picking" && result.picking.accepted <= 0) throw new Error("Frame profiling did not accept any picking operations");
  if (mode !== "paced144-no-picking" && result.picking.completed <= 0) throw new Error("Frame profiling did not observe any completed picking readbacks");
  if (mode !== "paced144-no-picking" && result.pickingPipeline?.commandEncodingAndSetupCpuMs?.count <= 0) throw new Error("Frame profiling missing picking command encoding timings");
  if (mode !== "paced144-no-picking" && result.pickingPipeline?.queueSubmitCpuMs?.count <= 0) throw new Error("Frame profiling missing picking queue-submit timings");
  if (mode === "isolatedPick" && result.pickingPipeline?.queueWorkDoneMs?.count <= 0) throw new Error("Isolated picking missing queue completion timings");
  if (mode === "isolatedPick" && result.pickingPipeline?.readbackSyncMs?.count <= 0) throw new Error("Isolated picking missing readback synchronization timings");
  if (mode === "paced144-no-picking" && result.picking.accepted !== 0) throw new Error("No-picking benchmark unexpectedly performed picking");

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_FRAME_PROFILING_JSON ${JSON.stringify(result)}`);
});

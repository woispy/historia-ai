import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || "artifacts/benchmark-result.json";

async function runBenchmark(page, backend, file) {
  await page.goto(`/benchmarks/map-benchmark.html?backend=${backend}&durationMs=${durationMs}`, { waitUntil: "load" });
  const gpuInfo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return { webgl: false, renderer: null, vendor: null, unmaskedRenderer: null, unmaskedVendor: null };
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      webgl: true,
      renderer: gl.getParameter(gl.RENDERER),
      vendor: gl.getParameter(gl.VENDOR),
      unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
      webgpu: Boolean(navigator.gpu),
    };
  });
  if (gpuInfo.unmaskedRenderer && /swiftshader|llvmpipe|software raster/i.test(gpuInfo.unmaskedRenderer)) {
    throw new Error(`Software GPU detected; refusing performance result: ${gpuInfo.unmaskedRenderer}`);
  }
  await page.waitForFunction(() => Boolean(window.__HISTORIA_BENCHMARK_RESULT__), null, { timeout: durationMs + 120000 });
  const result = await page.evaluate(() => window.__HISTORIA_BENCHMARK_RESULT__);
  if (result.error) throw new Error(result.error);
  if (result.backend === "webgpu") {
    if (!result.gpu || result.gpu.computePasses <= 0) throw new Error("WebGPU telemetry missing compute pass count");
    if (result.gpu.dispatchCalls <= 0) throw new Error("WebGPU telemetry missing dispatch count");
    if (result.gpu.renderPasses <= 0) throw new Error("WebGPU telemetry missing render pass count");
    if (result.gpu.drawCalls <= 0) throw new Error("WebGPU telemetry missing draw call count");
    if (result.gpu.queueSubmits <= 0) throw new Error("WebGPU telemetry missing queue submission count");
    if (!result.gpu.gpuTiming || !["supported", "unsupported"].includes(result.gpu.gpuTiming)) throw new Error(`Invalid GPU timing state: ${result.gpu.gpuTiming}`);
  }
  result.gpuInfo = gpuInfo;
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

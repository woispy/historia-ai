import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || "artifacts/benchmark-result.json";

async function collectWebGpuCapability(page) {
  return page.evaluate(async () => {
    const result = {
      navigatorGpu: Boolean(navigator.gpu),
      adapterAvailable: false,
      adapter: null,
      features: [],
      timestampQuery: false,
      error: null,
    };
    if (!navigator.gpu) return result;
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) return result;
      result.adapterAvailable = true;
      result.features = Array.from(adapter.features || []).sort();
      result.timestampQuery = result.features.includes("timestamp-query");
      const info = adapter.info || adapter.adapterInfo || null;
      if (info) {
        result.adapter = {
          vendor: info.vendor || null,
          architecture: info.architecture || null,
          device: info.device || null,
          description: info.description || null,
          isFallbackAdapter: typeof info.isFallbackAdapter === "boolean" ? info.isFallbackAdapter : null,
        };
      }
    } catch (error) {
      result.error = String(error?.message || error);
    }
    return result;
  });
}

async function runTimestampProbe(page) {
  return page.evaluate(async () => {
    const result = {
      supported: false,
      feature: null,
      reason: null,
      adapter: null,
      raw: null,
      deltaNs: null,
      error: null,
    };
    if (!navigator.gpu) {
      result.reason = "navigator.gpu unavailable";
      return result;
    }
    let adapter;
    try {
      adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    } catch (error) {
      result.reason = "requestAdapter threw";
      result.error = String(error?.message || error);
      return result;
    }
    if (!adapter) {
      result.reason = "no adapter";
      return result;
    }
    const info = adapter.info || adapter.adapterInfo || null;
    result.adapter = info ? {
      vendor: info.vendor || null,
      architecture: info.architecture || null,
      device: info.device || null,
      description: info.description || null,
      isFallbackAdapter: typeof info.isFallbackAdapter === "boolean" ? info.isFallbackAdapter : null,
    } : null;
    result.feature = adapter.features?.has?.("timestamp-query") ? "timestamp-query" : null;
    result.supported = Boolean(result.feature);
    if (!result.supported) {
      result.reason = "adapter lacks timestamp-query";
      return result;
    }
    let device;
    let readback;
    let resolve;
    let querySet;
    let workload;
    try {
      device = await adapter.requestDevice({ requiredFeatures: ["timestamp-query"] });
      const shader = device.createShaderModule({ code: `
        @group(0) @binding(0) var<storage, read_write> data: array<u32>;
        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          var x = id.x + 1u;
          for (var i = 0u; i < 256u; i = i + 1u) {
            x = x * 1664525u + 1013904223u;
          }
          data[id.x] = x;
        }
      ` });
      const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: shader, entryPoint: "main" } });
      workload = device.createBuffer({ size: 65536 * 4, usage: GPUBufferUsage.STORAGE });
      const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: workload } }] });
      querySet = device.createQuerySet({ type: "timestamp", count: 2 });
      resolve = device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
      readback = device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      const encoder = device.createCommandEncoder();
      encoder.writeTimestamp(querySet, 0);
      const compute = encoder.beginComputePass();
      compute.setPipeline(pipeline);
      compute.setBindGroup(0, bindGroup);
      compute.dispatchWorkgroups(1024);
      compute.end();
      encoder.writeTimestamp(querySet, 1);
      encoder.resolveQuerySet(querySet, 0, 2, resolve, 0);
      encoder.copyBufferToBuffer(resolve, 0, readback, 0, 16);
      device.queue.submit([encoder.finish()]);
      await device.queue.onSubmittedWorkDone();
      await readback.mapAsync(GPUMapMode.READ);
      const data = new BigUint64Array(readback.getMappedRange());
      const begin = Number(data[0]);
      const end = Number(data[1]);
      result.raw = { begin, end };
      result.deltaNs = end - begin;
      readback.unmap();
    } catch (error) {
      result.error = String(error?.message || error);
    } finally {
      try { readback?.unmap?.(); } catch {}
      querySet?.destroy?.();
      resolve?.destroy?.();
      readback?.destroy?.();
      workload?.destroy?.();
      device?.destroy?.();
    }
    return result;
  });
}

async function readSoftwareGpuError(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return null;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) || "") : String(gl.getParameter(gl.RENDERER) || "");
  });
}

function isRecoverableAutoWebGpuFailure(error) {
  const message = String(error?.message || error || "");
  return /dxil\.dll|EnsureDXCLibraries|requestDevice.*OperationError|DynamicLib\.Open|WebGPU backend failed to initialize|navigator\.gpu unavailable|GPUAdapter/i.test(message);
}

async function runBenchmark(page, backend, file, metadata = {}) {
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
  const webgpuCapability = await collectWebGpuCapability(page);
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
  result.webgpuCapability = webgpuCapability;
  Object.assign(result, metadata);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_BENCHMARK_JSON ${JSON.stringify(result)}`);
  return result;
}

test("Historia AI WebGPU timestamp probe", async ({ page }) => {
  await page.goto("/benchmarks/map-benchmark.html?backend=webgpu&durationMs=1", { waitUntil: "load" });
  const result = await runTimestampProbe(page);
  const file = output.replace(/\.json$/i, "-timestamp-probe.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_TIMESTAMP_PROBE ${JSON.stringify(result)}`);
  test.info().annotations.push({ type: "gpu-timestamp-probe", description: JSON.stringify(result) });
  if (process.env.HISTORIA_REQUIRE_GPU_TIMESTAMP === "1") {
    if (!result.supported) throw new Error(`WebGPU timestamp-query unavailable: ${result.reason || "unknown reason"}`);
    if (result.error) throw new Error(`WebGPU timestamp probe failed: ${result.error}`);
    if (!(result.deltaNs > 0)) throw new Error(`WebGPU timestamp probe returned non-positive interval: ${result.deltaNs}`);
  }
});

test("Historia AI 15k / 4K / 2x DPR benchmark", async ({ page }) => {
  try {
    await runBenchmark(page, "auto", output);
  } catch (error) {
    if (process.env.HISTORIA_REQUIRE_WEBGPU === "1" || !isRecoverableAutoWebGpuFailure(error)) throw error;
    const renderer = await readSoftwareGpuError(page);
    console.warn(`HISTORIA_WEBGPU_AUTO_FALLBACK ${JSON.stringify({ reason: String(error?.message || error), renderer })}`);
    await runBenchmark(page, "webgl2", output, {
      backendFallback: "webgl2",
      backendFallbackReason: String(error?.message || error),
    });
  }
});

test("Historia AI WebGL2 fallback parity benchmark", async ({ page }) => {
  const parityOutput = output.replace(/\.json$/i, "-webgl2.json");
  const result = await runBenchmark(page, "webgl2", parityOutput);
  if (result.backend !== "webgl2") throw new Error(`Expected WebGL2 fallback, received ${result.backend}`);
  if (result.internalCanvas.width !== 7680 || result.internalCanvas.height !== 4320) throw new Error("WebGL2 benchmark did not render at 4K / 2x DPR internal resolution");
});

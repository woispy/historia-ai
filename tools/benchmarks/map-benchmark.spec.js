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

async function runTelemetryIsolationMatrix(page) {
  return page.evaluate(async () => {
    const { createWebGpuBenchmarkTelemetry } = await import("/src/map/runtime/BenchmarkGpuTelemetry.js");
    const result = { supported: false, adapter: null, variants: {}, error: null };
    if (!navigator.gpu) {
      result.error = "navigator.gpu unavailable";
      return result;
    }

    let adapter;
    let device;
    try {
      adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) {
        result.error = "no adapter";
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
      if (!adapter.features?.has?.("timestamp-query")) {
        result.error = "adapter lacks timestamp-query";
        return result;
      }
      device = await adapter.requestDevice({ requiredFeatures: ["timestamp-query"] });
      result.supported = true;

      const shader = device.createShaderModule({ code: `
        @group(0) @binding(0) var<storage, read_write> data: array<u32>;
        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          var x = id.x + 1u;
          for (var i = 0u; i < 256u; i = i + 1u) { x = x * 1664525u + 1013904223u; }
          data[id.x] = x;
        }
      ` });
      const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: shader, entryPoint: "main" } });
      const workload = device.createBuffer({ size: 65536 * 4, usage: GPUBufferUsage.STORAGE });
      const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: workload } }] });
      const geometry = device.createBuffer({ size: 3 * 2 * 4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(geometry, 0, new Float32Array([-1, -1, 1, -1, 0, 1]));
      const renderTexture = device.createTexture({ size: { width: 4, height: 4 }, format: "rgba8unorm", usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
      const renderModule = device.createShaderModule({ code: `
        @vertex fn vs(@location(0) p: vec2<f32>) -> @builtin(position) vec4<f32> { return vec4<f32>(p, 0.0, 1.0); }
        @fragment fn fs() -> @location(0) vec4<f32> { return vec4<f32>(0.2, 0.3, 0.4, 1.0); }
      ` });
      const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: renderModule, entryPoint: "vs", buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] }] },
        fragment: { module: renderModule, entryPoint: "fs", targets: [{ format: "rgba8unorm" }] },
        primitive: { topology: "triangle-list" },
      });
      const indirect = device.createBuffer({ size: 16, usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(indirect, 0, new Uint32Array([3, 1, 0, 0]));

      async function runVariant(name, mode) {
        const telemetryApi = createWebGpuBenchmarkTelemetry(device);
        let submitCount = 0;
        let frameCount = 0;
        try {
          for (let i = 0; i < 8; i += 1) {
            frameCount += 1;
            const slot = telemetryApi.beginFrame();
            const encoder = device.createCommandEncoder();
            const began = slot >= 0 ? telemetryApi.writeTimestamp(encoder, slot, "begin") : false;
            if (mode === "compute" || mode === "combined" || mode === "combined-indirect") {
              const compute = encoder.beginComputePass();
              compute.setPipeline(pipeline);
              compute.setBindGroup(0, bindGroup);
              compute.dispatchWorkgroups(1024);
              compute.end();
            }
            if (mode === "render-clear" || mode === "render-draw" || mode === "render-indirect" || mode === "combined" || mode === "combined-indirect") {
              const render = encoder.beginRenderPass({ colorAttachments: [{ view: renderTexture.createView(), clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }] });
              if (mode === "render-draw" || mode === "combined") {
                render.setPipeline(renderPipeline);
                render.setVertexBuffer(0, geometry);
                render.draw(3, 1, 0, 0);
              } else if (mode === "render-indirect" || mode === "combined-indirect") {
                render.setPipeline(renderPipeline);
                render.setVertexBuffer(0, geometry);
                render.drawIndirect(indirect, 0);
              }
              render.end();
            }
            const ended = slot >= 0 ? telemetryApi.writeTimestamp(encoder, slot, "end") : false;
            const ready = slot >= 0 && began && ended ? telemetryApi.finishFrame(encoder, slot) : false;
            device.queue.submit([encoder.finish()]);
            submitCount += 1;
            telemetryApi.recordSubmit(ready ? slot : -1);
            await telemetryApi.collect();
          }
          await telemetryApi.collect();
          return { mode, frameCount, submitCount, snapshot: telemetryApi.snapshot() };
        } catch (error) {
          return { mode, frameCount, submitCount, error: String(error?.message || error), snapshot: telemetryApi.snapshot() };
        } finally {
          telemetryApi.dispose();
        }
      }

      for (const [name, mode] of [
        ["compute", "compute"],
        ["render-clear", "render-clear"],
        ["render-draw", "render-draw"],
        ["render-indirect", "render-indirect"],
        ["combined", "combined"],
        ["combined-indirect", "combined-indirect"],
      ]) {
        result.variants[name] = await runVariant(name, mode);
      }

      geometry.destroy();
      workload.destroy();
      indirect.destroy();
      renderTexture.destroy();
    } catch (error) {
      result.error = String(error?.message || error);
    } finally {
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

test("Historia AI exact WebGPU telemetry isolation matrix", async ({ page }) => {
  await page.goto("/benchmarks/map-benchmark.html?backend=webgpu&durationMs=1", { waitUntil: "load" });
  const result = await runTelemetryIsolationMatrix(page);
  const file = output.replace(/\.json$/i, "-telemetry-isolation.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_TELEMETRY_ISOLATION ${JSON.stringify(result)}`);
  test.info().annotations.push({ type: "gpu-telemetry-isolation", description: JSON.stringify(result) });
  if (!result.supported) {
    if (process.env.HISTORIA_REQUIRE_GPU_TIMESTAMP === "1") throw new Error(`Telemetry isolation unavailable: ${result.error || "unknown reason"}`);
    return;
  }
  const requiredVariants = ["compute", "render-draw", "render-indirect", "combined", "combined-indirect"];
  for (const name of requiredVariants) {
    const variant = result.variants[name];
    if (!variant) throw new Error(`Telemetry isolation missing ${name} variant`);
    if (variant.error) throw new Error(`Telemetry isolation ${name} failed: ${variant.error}`);
    const snapshot = variant.snapshot;
    if (!snapshot || snapshot.gpuTiming !== "supported") throw new Error(`Telemetry isolation ${name} did not report supported timestamp timing`);
    if (!(snapshot.gpuTimeMs?.count > 0) || !(snapshot.gpuTimeMs?.average > 0)) {
      throw new Error(`Telemetry isolation ${name} returned invalid timestamp telemetry: zero=${snapshot.timestampSamplesZero}, dropped=${snapshot.timestampSamplesDropped}`);
    }
  }
});

test("Historia AI 15k / 4K / 2x DPR benchmark", async ({ page }) => {
  const file = output;
  let result;
  try {
    result = await runBenchmark(page, "webgpu", file, { provinceCount: 15000, geometryPointCount: 480000, internalCanvas: { width: 7680, height: 4320 } });
  } catch (error) {
    if (!isRecoverableAutoWebGpuFailure(error)) throw error;
    result = await runBenchmark(page, "webgl2", file, { provinceCount: 15000, geometryPointCount: 480000, internalCanvas: { width: 7680, height: 4320 }, fallbackReason: String(error?.message || error) });
  }
  if (process.env.HISTORIA_REQUIRE_GPU_TIMESTAMP === "1" && result.backend === "webgpu") {
    if (result.gpu?.gpuTiming !== "supported") throw new Error(`WebGPU timestamp telemetry unsupported: ${result.gpu?.gpuTiming}`);
    if (!(result.gpu?.gpuTimeMs?.count > 0) || !(result.gpu?.gpuTimeMs?.average > 0)) {
      throw new Error(`WebGPU production timestamp telemetry invalid: zero=${result.gpu?.timestampSamplesZero}, dropped=${result.gpu?.timestampSamplesDropped}`);
    }
  }
});

test("Historia AI WebGL2 fallback benchmark", async ({ page }) => {
  await runBenchmark(page, "webgl2", output.replace(/\.json$/i, "-webgl2.json"), { provinceCount: 15000, geometryPointCount: 480000, internalCanvas: { width: 7680, height: 4320 } });
});

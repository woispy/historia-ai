import { loadMapBin } from "/src/map/runtime/MapBinLoader.js";
import { MapCameraRig } from "/src/map/runtime/MapCameraRig.js";
import { MapRuntimeController } from "/src/map/runtime/MapRuntimeController.js";
import { WebGPUMapRenderer } from "/src/map/rendering/gpu/WebGPUMapRenderer.js";
import FramePassProfiler from "/src/map/runtime/FramePassProfiler.js";

const params = new URLSearchParams(location.search);
const durationMs = Number(params.get("durationMs") || 30000);
const assetUrl = params.get("asset") || "/assets/stress-15k.mapbin";
const canvas = document.querySelector("#map");
const diagnosticsNode = document.querySelector("#diagnostics");
const profiler = new FramePassProfiler();
let renderer;
let runtime;
let benchmarkStart = 0;
let lastHover = 0;
let restoreQueueSubmit = null;

function wrapRenderer() {
  const originalRender = renderer.render.bind(renderer);
  renderer.render = (...args) => {
    const start = performance.now();
    try {
      return originalRender(...args);
    } finally {
      profiler.recordRender(performance.now() - start);
    }
  };

  const originalPick = renderer.pick.bind(renderer);
  renderer.pick = (...args) => {
    profiler.recordPickRequested();
    if (renderer.pickPending) {
      profiler.recordPickSkippedBusy();
      return originalPick(...args);
    }
    const start = performance.now();
    const result = originalPick(...args);
    if (!renderer.pickPending) return result;
    profiler.recordPickAccepted();
    const waitForCompletion = () => {
      if (!renderer.pickPending) {
        profiler.recordPickCompleted(performance.now() - start);
        return;
      }
      requestAnimationFrame(waitForCompletion);
    };
    requestAnimationFrame(waitForCompletion);
    return result;
  };

  const queue = renderer.device?.queue;
  if (!queue || !globalThis.GPUQueue?.prototype?.submit) throw new Error("Frame profiler requires WebGPU queue access");
  const prototype = globalThis.GPUQueue.prototype;
  const originalSubmit = prototype.submit;
  prototype.submit = function profiledSubmit(...args) {
    if (this !== queue) return originalSubmit.apply(this, args);
    const start = performance.now();
    try {
      return originalSubmit.apply(this, args);
    } finally {
      profiler.recordQueueSubmit(performance.now() - start);
    }
  };
  restoreQueueSubmit = () => { prototype.submit = originalSubmit; };
}

async function main() {
  const asset = await loadMapBin(assetUrl);
  if (!WebGPUMapRenderer.isSupported()) throw new Error("WebGPU unavailable");
  renderer = new WebGPUMapRenderer(canvas);
  if (!(await renderer.initialize({ assetSource: asset }))) throw new Error("WebGPU renderer failed to initialize");

  canvas.style.width = "3840px";
  canvas.style.height = "2160px";
  renderer.resize(3840, 2160);
  wrapRenderer();

  const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  cameraRig.setState({ x: 0, y: 0, zoom: 2, pitch: 24, yaw: 0 });
  runtime = new MapRuntimeController({ canvas, cameraRig, renderer });
  profiler.start();
  benchmarkStart = performance.now();
  runtime.start();

  const frame = (now) => {
    profiler.recordRaf(now);
    if (now - benchmarkStart < durationMs) {
      if (Math.round((now - benchmarkStart) / 16.667) % 2 === 0) {
        const phase = (now - benchmarkStart) / 7000;
        cameraRig.setState({ x: Math.sin(phase) * 45, y: Math.cos(phase * 0.7) * 20, zoom: 2 + (Math.sin(phase * 0.5) + 1) * 2 });
      }
      requestAnimationFrame(frame);
    } else {
      void finish(now);
    }
  };

  const hover = (now) => {
    if (now - lastHover >= 8 && now - benchmarkStart < durationMs) {
      lastHover = now;
      const t = (now - benchmarkStart) / Math.max(1, durationMs);
      const x = (Math.sin(t * Math.PI * 12) * 0.5 + 0.5) * 3840;
      const y = (Math.cos(t * Math.PI * 8) * 0.5 + 0.5) * 2160;
      runtime.queueHover(x, y);
    }
    if (now - benchmarkStart < durationMs) requestAnimationFrame(hover);
  };

  requestAnimationFrame(frame);
  requestAnimationFrame(hover);
}

async function finish(now) {
  runtime?.stop();
  restoreQueueSubmit?.();
  restoreQueueSubmit = null;
  await renderer.collectTelemetry?.();
  const gpu = renderer.getTelemetrySnapshot?.() ?? null;
  const profiling = profiler.summary(now);
  const result = {
    ...profiling,
    target: { hz: 144, frameMs: 1000 / 144, viewport: "3840x2160", dpr: 2, internal: `${canvas.width}x${canvas.height}` },
    gpu: gpu ? {
      ...gpu,
      drawCalls: gpu.drawCalls,
      gpuTiming: gpu.gpuTiming,
      gpuTimingScope: gpu.gpuTimingScope,
      gpuTimeMs: gpu.gpuTimeMs,
      timestampSamplesDropped: gpu.timestampSamplesDropped,
      timestampSamplesZero: gpu.timestampSamplesZero,
      timestampError: gpu.timestampError,
    } : null,
    assetUrl,
    provinceCount: renderer.assetSource?.provinceCount ?? null,
    geometryPointCount: renderer.assetSource?.geometryPointCount ?? null,
  };
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  window.__HISTORIA_FRAME_PROFILING_RESULT__ = result;
  window.dispatchEvent(new CustomEvent("historia-frame-profiling-complete", { detail: result }));
  console.log("HISTORIA_FRAME_PROFILING_RESULT", JSON.stringify(result));
}

main().catch((error) => {
  restoreQueueSubmit?.();
  restoreQueueSubmit = null;
  const result = { error: String(error?.stack || error) };
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  window.__HISTORIA_FRAME_PROFILING_RESULT__ = result;
  console.error("HISTORIA_FRAME_PROFILING_ERROR", result.error);
});

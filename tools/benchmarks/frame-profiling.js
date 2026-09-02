import { loadMapBin } from "/src/map/runtime/MapBinLoader.js";
import { MapCameraRig } from "/src/map/runtime/MapCameraRig.js";
import { MapRuntimeController } from "/src/map/runtime/MapRuntimeController.js";
import { WebGPUMapRenderer } from "/src/map/rendering/gpu/WebGPUMapRenderer.js";
import FramePassProfiler from "/src/map/runtime/FramePassProfiler.js";
import { createBenchmarkPassProfiler } from "/src/map/runtime/BenchmarkPassProfiler.js";

const params = new URLSearchParams(location.search);
const durationMs = Number(params.get("durationMs") || 30000);
const assetUrl = params.get("asset") || "/assets/stress-15k.mapbin";
const pickIntervalMs = Math.max(16, Number(params.get("pickIntervalMs") || 16));
const benchmarkMode = params.get("mode") || "paced144";
const targetHz = 144;
const targetFrameMs = 1000 / targetHz;
const canvas = document.querySelector("#map");
const diagnosticsNode = document.querySelector("#diagnostics");
const profiler = new FramePassProfiler();
const pickingPipeline = { commandEncodingAndSetupCpuMs: [], queueSubmitCpuMs: [], queueWorkDoneMs: [], readbackSyncMs: [] };
let renderer;
let runtime;
let benchmarkStart = 0;
let lastHover = 0;
let restoreQueueSubmit = null;
let activePickProbe = null;
let renderTimer = 0;
let renderLoopActive = false;
let passProfiler = null;

function pushMetric(list, value) { if (Number.isFinite(value) && value >= 0) list.push(value); }

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const percentile = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
  return { count: sorted.length, average: sorted.reduce((sum, value) => sum + value, 0) / sorted.length, p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), max: sorted[sorted.length - 1], min: sorted[0] };
}

function wrapRenderer() {
  const originalRender = renderer.render.bind(renderer);
  renderer.render = (...args) => {
    const start = performance.now();
    passProfiler?.beginOperation("render");
    try { return originalRender(...args); }
    finally { passProfiler?.endOperation(); profiler.recordRender(performance.now() - start); }
  };

  const originalPick = renderer.pick.bind(renderer);
  renderer.pick = (...args) => {
    profiler.recordPickRequested();
    if (renderer.pickPending) { profiler.recordPickSkippedBusy(); return originalPick(...args); }
    const start = performance.now();
    const probe = { start, submitCpuMs: null, submitReturnedAt: null, queueDoneAt: null };
    activePickProbe = probe;
    passProfiler?.beginOperation("picking");
    let result;
    try { result = originalPick(...args); }
    finally { passProfiler?.endOperation(); }
    const accepted = Boolean(renderer.pickPending);
    if (probe.submitReturnedAt !== null) pushMetric(pickingPipeline.commandEncodingAndSetupCpuMs, probe.submitReturnedAt - start - (probe.submitCpuMs || 0));
    activePickProbe = null;
    if (!accepted) return result;
    profiler.recordPickAccepted();
    const queue = renderer.device?.queue;
    if (benchmarkMode === "isolatedPick" && queue?.onSubmittedWorkDone) {
      const queueDoneStart = performance.now();
      void queue.onSubmittedWorkDone().then(() => { probe.queueDoneAt = performance.now(); pushMetric(pickingPipeline.queueWorkDoneMs, probe.queueDoneAt - queueDoneStart); }).catch(() => {});
    }
    const waitForCompletion = () => {
      if (!renderer.pickPending) {
        const completedAt = performance.now();
        profiler.recordPickCompleted(completedAt - start);
        if (probe.queueDoneAt !== null) pushMetric(pickingPipeline.readbackSyncMs, Math.max(0, completedAt - probe.queueDoneAt));
        return;
      }
      setTimeout(waitForCompletion, 0);
    };
    setTimeout(waitForCompletion, 0);
    return result;
  };

  const queue = renderer.device?.queue;
  if (!queue || !globalThis.GPUQueue?.prototype?.submit) throw new Error("Frame profiler requires WebGPU queue access");
  const prototype = globalThis.GPUQueue.prototype;
  const originalSubmit = prototype.submit;
  prototype.submit = function profiledSubmit(...args) {
    if (this !== queue) return originalSubmit.apply(this, args);
    const start = performance.now();
    try { return originalSubmit.apply(this, args); }
    finally {
      const elapsed = performance.now() - start;
      profiler.recordQueueSubmit(elapsed);
      passProfiler?.notifySubmit(args[0]);
      if (activePickProbe) {
        activePickProbe.submitCpuMs = elapsed;
        activePickProbe.submitReturnedAt = performance.now();
        pushMetric(pickingPipeline.queueSubmitCpuMs, elapsed);
      }
    }
  };
  restoreQueueSubmit = () => { prototype.submit = originalSubmit; };
}

async function createRuntime(asset, { startRenderer = true } = {}) {
  renderer = new WebGPUMapRenderer(canvas);
  if (!(await renderer.initialize({ assetSource: asset }))) throw new Error("WebGPU renderer failed to initialize");
  canvas.style.width = "3840px";
  canvas.style.height = "2160px";
  renderer.resize(3840, 2160);
  passProfiler = createBenchmarkPassProfiler(renderer.device, { sampleIntervalFrames: 256 });
  wrapRenderer();
  const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  cameraRig.setState({ x: 0, y: 0, zoom: 2, pitch: 24, yaw: 0 });
  runtime = new MapRuntimeController({ canvas, cameraRig, renderer });
  profiler.start();
  if (startRenderer) runtime.start();
  return cameraRig;
}

function driveCamera(cameraRig, now, start) {
  const phase = (now - start) / 7000;
  cameraRig.setState({ x: Math.sin(phase) * 45, y: Math.cos(phase * 0.7) * 20, zoom: 2 + (Math.sin(phase * 0.5) + 1) * 2 });
}

async function runUnconstrained(asset) {
  const cameraRig = await createRuntime(asset);
  const start = performance.now();
  const frame = (now) => {
    profiler.recordRaf(now);
    if (now - start < durationMs) { driveCamera(cameraRig, now, start); requestAnimationFrame(frame); }
    else void finish(now);
  };
  requestAnimationFrame(frame);
}

async function runPaced144(asset, { withPicking = true } = {}) {
  const cameraRig = await createRuntime(asset, { startRenderer: false });
  const start = performance.now();
  let nextFrame = start;
  let lastHoverAt = start;
  renderLoopActive = true;
  const tick = () => {
    if (!renderLoopActive) return;
    const now = performance.now();
    if (now - start >= durationMs) { renderLoopActive = false; void finish(now); return; }
    profiler.recordRaf(now);
    driveCamera(cameraRig, now, start);
    renderer.render();
    nextFrame += targetFrameMs;
    if (withPicking && now - lastHoverAt >= pickIntervalMs) {
      lastHoverAt = now;
      const t = (now - start) / Math.max(1, durationMs);
      const x = (Math.sin(t * Math.PI * 12) * 0.5 + 0.5) * 3840;
      const y = (Math.cos(t * Math.PI * 8) * 0.5 + 0.5) * 2160;
      renderer.setHoveredProvinceId(renderer.pick(x, y));
    }
    renderTimer = Math.max(0, nextFrame - performance.now());
    setTimeout(tick, renderTimer);
  };
  tick();
}

async function runIsolatedPick(asset) {
  await createRuntime(asset, { startRenderer: false });
  const start = performance.now();
  let accepted = 0;
  const issuePick = () => {
    if (performance.now() - start >= durationMs) { void finish(performance.now()); return; }
    const x = 1920 + Math.sin(accepted * 0.37) * 1200;
    const y = 1080 + Math.cos(accepted * 0.29) * 700;
    const before = renderer.pickPending;
    renderer.pick(x, y);
    if (!before && renderer.pickPending) accepted += 1;
    const check = () => { if (!renderer.pickPending) setTimeout(issuePick, pickIntervalMs); else setTimeout(check, 0); };
    setTimeout(check, 0);
  };
  issuePick();
}

async function finish(now) {
  renderLoopActive = false;
  if (renderTimer) clearTimeout(renderTimer);
  runtime?.stop();
  restoreQueueSubmit?.();
  restoreQueueSubmit = null;
  await renderer?.collectTelemetry?.();
  await passProfiler?.collect?.();
  const gpu = renderer?.getTelemetrySnapshot?.() ?? null;
  const profiling = profiler.summary(now);
  const result = {
    ...profiling,
    benchmarkMode,
    pickingProbe: { intervalMs: pickIntervalMs, requestRateHz: 1000 / pickIntervalMs },
    pickingPipeline: { commandEncodingAndSetupCpuMs: summarize(pickingPipeline.commandEncodingAndSetupCpuMs), queueSubmitCpuMs: summarize(pickingPipeline.queueSubmitCpuMs), queueWorkDoneMs: summarize(pickingPipeline.queueWorkDoneMs), readbackSyncMs: summarize(pickingPipeline.readbackSyncMs) },
    passProfiling: passProfiler?.snapshot?.() ?? null,
    target: { hz: targetHz, frameMs: targetFrameMs, viewport: "3840x2160", dpr: 2, internal: `${canvas.width}x${canvas.height}` },
    gpu: gpu ? { ...gpu, drawCalls: gpu.drawCalls, gpuTiming: gpu.gpuTiming, gpuTimingScope: gpu.gpuTimingScope, gpuTimeMs: gpu.gpuTimeMs, timestampSamplesDropped: gpu.timestampSamplesDropped, timestampSamplesZero: gpu.timestampSamplesZero, timestampError: gpu.timestampError } : null,
    assetUrl,
    provinceCount: renderer?.assetSource?.provinceCount ?? null,
    geometryPointCount: renderer?.assetSource?.geometryPointCount ?? null,
  };
  passProfiler?.dispose?.();
  passProfiler = null;
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  window.__HISTORIA_FRAME_PROFILING_RESULT__ = result;
  window.dispatchEvent(new CustomEvent("historia-frame-profiling-complete", { detail: result }));
  console.log("HISTORIA_FRAME_PROFILING_RESULT", JSON.stringify(result));
}

async function main() {
  const asset = await loadMapBin(assetUrl);
  if (!WebGPUMapRenderer.isSupported()) throw new Error("WebGPU unavailable");
  if (benchmarkMode === "unconstrained") return runUnconstrained(asset);
  if (benchmarkMode === "isolatedPick") return runIsolatedPick(asset);
  return runPaced144(asset, { withPicking: benchmarkMode !== "paced144-no-picking" });
}

main().catch((error) => {
  renderLoopActive = false;
  if (renderTimer) clearTimeout(renderTimer);
  restoreQueueSubmit?.();
  restoreQueueSubmit = null;
  passProfiler?.dispose?.();
  passProfiler = null;
  const result = { error: String(error?.stack || error) };
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  window.__HISTORIA_FRAME_PROFILING_RESULT__ = result;
  window.dispatchEvent(new CustomEvent("historia-frame-profiling-complete", { detail: result }));
  console.error("HISTORIA_FRAME_PROFILING_ERROR", result.error);
});

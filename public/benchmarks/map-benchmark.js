import { loadMapBin } from "/src/map/runtime/MapBinLoader.js";
import { MapCameraRig } from "/src/map/runtime/MapCameraRig.js";
import { MapRuntimeController } from "/src/map/runtime/MapRuntimeController.js";
import { BinaryMapRenderer } from "/src/map/rendering/gpu/BinaryMapRenderer.js";
import { WebGPUMapRenderer } from "/src/map/rendering/gpu/WebGPUMapRenderer.js";
import { BenchmarkDiagnostics, BENCHMARK_TARGET } from "/src/map/runtime/BenchmarkDiagnostics.js";

const params = new URLSearchParams(location.search);
const assetUrl = params.get("asset") || "/assets/stress-15k.mapbin";
const backendPreference = params.get("backend") || "auto";
const durationMs = Number(params.get("durationMs") || 30000);
const canvas = document.querySelector("#map");
const diagnosticsNode = document.querySelector("#diagnostics");
const diagnostics = new BenchmarkDiagnostics();
let renderer;
let runtime;
let lastHover = 0;

function resize() {
  canvas.style.width = `${BENCHMARK_TARGET.viewportWidth}px`;
  canvas.style.height = `${BENCHMARK_TARGET.viewportHeight}px`;
  renderer?.resize(BENCHMARK_TARGET.viewportWidth, BENCHMARK_TARGET.viewportHeight);
}

async function main() {
  const asset = await loadMapBin(assetUrl);
  const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
  cameraRig.setState({ x: 0, y: 0, zoom: 2, pitch: 24, yaw: 0 });

  if (backendPreference !== "webgl2" && WebGPUMapRenderer.isSupported()) {
    const candidate = new WebGPUMapRenderer(canvas);
    if (await candidate.initialize({ assetSource: asset })) renderer = candidate;
    else candidate.dispose();
  }
  if (!renderer && backendPreference !== "webgpu") {
    renderer = new BinaryMapRenderer(canvas);
    if (!renderer.initialize({ assetSource: asset })) throw new Error("WebGL2 backend failed to initialize");
  }
  if (!renderer) throw new Error(`Requested backend is unavailable: ${backendPreference}`);

  resize();
  runtime = new MapRuntimeController({ canvas, cameraRig, renderer });
  runtime.start();
  diagnostics.start();

  const benchmarkStart = performance.now();
  let frameCount = 0;
  const frame = (now) => {
    frameCount += 1;
    diagnostics.frame(now);
    if (frameCount % 2 === 0) {
      const phase = (now - benchmarkStart) / 7000;
      cameraRig.setState({ x: Math.sin(phase) * 45, y: Math.cos(phase * 0.7) * 20, zoom: 2 + (Math.sin(phase * 0.5) + 1) * 2 });
    }
    if (now - benchmarkStart < durationMs) requestAnimationFrame(frame);
    else finish(now);
  };

  const hover = (now) => {
    if (now - lastHover >= 8) {
      lastHover = now;
      const t = (now - benchmarkStart) / Math.max(1, durationMs);
      const x = (Math.sin(t * Math.PI * 12) * 0.5 + 0.5) * BENCHMARK_TARGET.viewportWidth;
      const y = (Math.cos(t * Math.PI * 8) * 0.5 + 0.5) * BENCHMARK_TARGET.viewportHeight;
      runtime.queueHover(x, y);
    }
    if (now - benchmarkStart < durationMs) requestAnimationFrame(hover);
  };

  requestAnimationFrame(frame);
  requestAnimationFrame(hover);
}

function finish(now) {
  runtime?.stop();
  const result = {
    ...diagnostics.summary(now),
    backend: renderer instanceof WebGPUMapRenderer ? "webgpu" : "webgl2",
    backendPreference,
    assetUrl,
    provinceCount: renderer.assetSource?.provinceCount ?? null,
    geometryPointCount: renderer.assetSource?.geometryPointCount ?? null,
    internalCanvas: { width: canvas.width, height: canvas.height },
  };
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  window.__HISTORIA_BENCHMARK_RESULT__ = result;
  window.dispatchEvent(new CustomEvent("historia-benchmark-complete", { detail: result }));
  console.log("HISTORIA_BENCHMARK_RESULT", JSON.stringify(result));
}

window.addEventListener("resize", resize);
main().catch((error) => {
  const result = { error: String(error?.stack || error), target: BENCHMARK_TARGET, backendPreference };
  window.__HISTORIA_BENCHMARK_RESULT__ = result;
  diagnosticsNode.textContent = JSON.stringify(result, null, 2);
  console.error("HISTORIA_BENCHMARK_ERROR", result.error);
});

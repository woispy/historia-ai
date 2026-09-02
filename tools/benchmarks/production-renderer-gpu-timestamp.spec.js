import { test } from "@playwright/test";

test("Historia AI exact production renderer GPU timestamp diagnostic", async ({ page }) => {
  await page.goto("/benchmarks/map-benchmark.html?backend=webgpu&durationMs=1", { waitUntil: "load" });

  const result = await page.evaluate(async () => {
    const { loadMapBin } = await import("/src/map/runtime/MapBinLoader.js");
    const { WebGPUMapRenderer } = await import("/src/map/rendering/gpu/WebGPUMapRenderer.js");
    const asset = await loadMapBin("/assets/stress-15k.mapbin");
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    document.body.appendChild(canvas);

    const renderer = new WebGPUMapRenderer(canvas);
    const uncaptured = [];
    let initialized = false;
    let initializationError = null;
    try {
      if (!navigator.gpu) throw new Error("navigator.gpu unavailable");
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) throw new Error("no adapter");
      const info = adapter.info || adapter.adapterInfo || null;
      const adapterInfo = info ? {
        vendor: info.vendor || null,
        architecture: info.architecture || null,
        device: info.device || null,
        description: info.description || null,
        isFallbackAdapter: typeof info.isFallbackAdapter === "boolean" ? info.isFallbackAdapter : null,
      } : null;
      const ok = await renderer.initialize({ assetSource: asset });
      initialized = ok;
      renderer.device?.addEventListener?.("uncapturederror", (event) => {
        uncaptured.push(String(event?.error?.message || event?.error || event));
      });
      if (!ok) throw new Error("renderer.initialize returned false");
      renderer.resize(64, 64);
      renderer.setCamera({ viewProj: new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]), zoom: 2 });

      for (let i = 0; i < 8; i += 1) {
        renderer.device.pushErrorScope("validation");
        renderer.render();
        await renderer.device.queue.onSubmittedWorkDone();
        const error = await renderer.device.popErrorScope();
        if (error) uncaptured.push(`validation: ${error.message}`);
        await renderer.collectTelemetry();
      }

      await renderer.collectTelemetry();
      const snapshot = renderer.getTelemetrySnapshot();
      renderer.dispose();
      canvas.remove();
      return { initialized, adapter: adapterInfo, snapshot, uncaptured, initializationError };
    } catch (error) {
      initializationError = String(error?.stack || error);
      try { renderer.dispose(); } catch {}
      canvas.remove();
      return { initialized, adapter: null, snapshot: renderer.getTelemetrySnapshot?.() ?? null, uncaptured, initializationError };
    }
  });

  console.log(`HISTORIA_PRODUCTION_RENDERER_GPU_TIMESTAMP ${JSON.stringify(result)}`);
  test.info().annotations.push({ type: "production-renderer-gpu-timestamp", description: JSON.stringify(result) });

  if (result.initializationError) throw new Error(result.initializationError);
  if (!result.snapshot) throw new Error("Production renderer returned no telemetry snapshot");
});

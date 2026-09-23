import { useEffect, useRef, useState } from "react";
import { ProductionBinaryMapRenderer } from "./gpu/ProductionBinaryMapRenderer.js";
import { loadMapBin } from "../runtime/MapBinLoader.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { MapRuntimeController } from "../runtime/MapRuntimeController.js";

/** Thin React host. Runtime assets are fetched as immutable binary data. */
export default function MapEngineV2({ selectedProvinceId = null, onProvinceClick, assetUrl = "/assets/political-authority.mapbin" }) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);
  const selectedProvinceIdRef = useRef(selectedProvinceId);
  const onProvinceClickRef = useRef(onProvinceClick);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    selectedProvinceIdRef.current = selectedProvinceId;
    onProvinceClickRef.current = onProvinceClick;
  }, [selectedProvinceId, onProvinceClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let runtime = null;

    setLoadError(null);
    Promise.all([
      loadMapBin(assetUrl),
      fetch("/assets/political-authority.manifest.json", { cache: "no-cache" }).then(async (response) => {
        if (!response.ok) throw new Error(`Authority map manifest request failed: ${response.status}`);
        return response.json();
      }),
    ]).then(([assetSource, manifest]) => {
      if (cancelled) return;
      const idMap = Array.isArray(manifest?.idMap) ? manifest.idMap : [];
      if (manifest?.kind !== "political-geography-authority-map" || idMap.length !== assetSource.provinceCount) {
        throw new Error("Authority map manifest does not match the compiled mapbin.");
      }
      const idByIndex = idMap.map((entry) => entry?.provinceId ?? null);
      const indexById = new Map(idByIndex.map((provinceId, index) => [provinceId, index]));
      assetSource.getProvinceId = (index) => idByIndex[index] ?? null;
      assetSource.indexOf = (provinceId) => indexById.get(provinceId) ?? -1;
      // Use the production frame-driven 2.5D rig defaults: pitch 10°..42°,
      // yaw -12°..+12°, logarithmic zoom and inertial pan/rotation.
      const cameraRig = new MapCameraRig({ minZoom: 2, maxZoom: 96, initialZoom: 2.75 });
      const renderer = new ProductionBinaryMapRenderer(canvas);
      if (!renderer.initialize({ assetSource })) {
        renderer.dispose();
        return;
      }
      runtime = new MapRuntimeController({
        canvas,
        cameraRig,
        renderer,
        onProvinceClick: (...args) => onProvinceClickRef.current?.(...args),
      });
      runtime.setSelectedProvinceId(selectedProvinceIdRef.current);
      runtimeRef.current = runtime;
      runtime.start();
    }).catch((error) => {
      if (!cancelled) {
        console.error("Historia AI authority map asset load failed", error);
        setLoadError("İncelenmiş siyasî harita verisi henüz production için hazır değil. Eski Phase 2D haritası bilinçli olarak devre dışı bırakıldı.");
      }
    });

    return () => {
      cancelled = true;
      runtime?.dispose();
      runtimeRef.current = null;
    };
  }, [assetUrl]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtime.setOnProvinceClick(onProvinceClick);
  }, [selectedProvinceId, onProvinceClick]);

  return <>
    <canvas ref={canvasRef} className="map-engine-v2" aria-label="Historia AI GPU map" style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />
    {loadError && <div role="alert" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, background: "#071117", color: "#e5c878", fontWeight: 600, textAlign: "center" }}>{loadError}</div>}
  </>;
}

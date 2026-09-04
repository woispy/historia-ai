import { useEffect, useRef } from "react";
import { ProductionBinaryMapRenderer } from "./gpu/ProductionBinaryMapRenderer.js";
import { loadMapBin } from "../runtime/MapBinLoader.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { MapRuntimeController } from "../runtime/MapRuntimeController.js";

/** Thin React host. Runtime assets are fetched as immutable binary data. */
export default function MapEngineV2({ selectedProvinceId = null, onProvinceClick, assetUrl = "/assets/world.mapbin" }) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);
  const onProvinceClickRef = useRef(onProvinceClick);
  onProvinceClickRef.current = onProvinceClick;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let runtime = null;

    loadMapBin(assetUrl).then((assetSource) => {
      if (cancelled) return;
      // Use the production frame-driven 2.5D rig defaults: pitch 10°..42°,
      // yaw -12°..+12°, logarithmic zoom and inertial pan/rotation.
      const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
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
      runtime.setSelectedProvinceId(selectedProvinceId);
      runtimeRef.current = runtime;
      runtime.start();
    }).catch((error) => {
      if (!cancelled) console.error("Historia AI map asset load failed", error);
    });

    return () => {
      cancelled = true;
      runtime?.dispose();
      runtimeRef.current = null;
    };
  }, [assetUrl, selectedProvinceId]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtime.setOnProvinceClick(onProvinceClick);
  }, [selectedProvinceId, onProvinceClick]);

  return <canvas ref={canvasRef} className="map-engine-v2" aria-label="Historia AI GPU map" style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />;
}

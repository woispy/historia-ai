import { useEffect, useRef } from "react";
import { BinaryMapRenderer } from "./gpu/BinaryMapRenderer.js";
import { loadMapBin } from "../runtime/MapBinLoader.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { MapRuntimeController } from "../runtime/MapRuntimeController.js";

/** Thin React host. Runtime assets are fetched as immutable binary data. */
export default function MapEngineV2({ camera = {}, selectedProvinceId = null, onProvinceClick, assetUrl = "/assets/world.mapbin" }) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);

  const productionCamera = { ...camera, pitch: 0, yaw: 0 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let runtime = null;

    loadMapBin(assetUrl).then((assetSource) => {
      if (cancelled) return;
      const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96, pitch: 0, pitchMin: 0, pitchMax: 0, yaw: 0, yawMin: 0, yawMax: 0 });
      cameraRig.setState(productionCamera);
      const renderer = new BinaryMapRenderer(canvas);
      if (!renderer.initialize({ assetSource })) { renderer.dispose(); return; }
      runtime = new MapRuntimeController({ canvas, cameraRig, renderer, onProvinceClick });
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
  }, [assetUrl]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setExternalCamera(productionCamera);
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtime.setOnProvinceClick(onProvinceClick);
  }, [camera, selectedProvinceId, onProvinceClick]);

  return <canvas ref={canvasRef} className="map-engine-v2" aria-label="Historia AI GPU map" style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />;
}

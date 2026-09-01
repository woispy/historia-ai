import { useEffect, useRef } from "react";
import { BinaryMapRenderer } from "./gpu/BinaryMapRenderer.js";
import { buildMapBinFromProvinces } from "../runtime/BinaryMapAssetBuilder.js";
import { BinaryMapAssetSource } from "../runtime/BinaryMapAssetSource.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { MapRuntimeController } from "../runtime/MapRuntimeController.js";

/** Thin React host. Rendering and interaction are entirely imperative. */
export default function MapEngineV2({ provinces = [], camera = {}, selectedProvinceId = null, mapStyle = "detailed", onProvinceClick }) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const buffer = buildMapBinFromProvinces(provinces, mapStyle);
    const assetSource = BinaryMapAssetSource.fromArrayBuffer(buffer);
    const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
    cameraRig.setState(camera);
    const renderer = new BinaryMapRenderer(canvas);
    if (!renderer.initialize({ assetSource })) { renderer.dispose(); return undefined; }
    const runtime = new MapRuntimeController({ canvas, cameraRig, renderer, onProvinceClick });
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtimeRef.current = runtime;
    runtime.start();
    return () => { runtime.dispose(); runtimeRef.current = null; };
  }, [mapStyle, provinces]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setExternalCamera(camera);
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtime.setOnProvinceClick(onProvinceClick);
  }, [camera, selectedProvinceId, onProvinceClick]);

  return <canvas ref={canvasRef} className="map-engine-v2" aria-label="Historia AI GPU map" style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />;
}

import { useEffect, useRef } from "react";
import { GpuMapRenderer } from "./gpu/GpuMapRenderer.js";
import { buildGpuAssetBridge } from "./gpu/MapAssetBridge.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { MapRuntimeController } from "../runtime/MapRuntimeController.js";

/**
 * Thin React host. React owns only creation/configuration of the map runtime;
 * the controller owns DOM input, camera mutation, resize and frame lifecycle.
 */
export default function MapEngineV2({
  provinces = [],
  camera = {},
  selectedProvinceId = null,
  mapStyle = "detailed",
  onProvinceClick,
}) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const asset = buildGpuAssetBridge(provinces, mapStyle);
    if (!asset) return undefined;

    const cameraRig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
    cameraRig.setState(camera);

    const renderer = new GpuMapRenderer(canvas);
    renderer.setCamera(cameraRig.snapshot());

    const initialized = renderer.initialize({
      provinceSource: asset.provinceSource,
      landSource: asset.landSource,
      palette: asset.palette,
      provinceIds: asset.provinceIds,
    });

    if (!initialized) {
      renderer.dispose();
      return undefined;
    }

    const runtime = new MapRuntimeController({
      canvas,
      cameraRig,
      renderer,
      onProvinceClick,
    });

    runtime.setSelectedProvinceId(selectedProvinceId);
    runtimeRef.current = runtime;
    runtime.start();

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [mapStyle, provinces]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setExternalCamera(camera);
    runtime.setSelectedProvinceId(selectedProvinceId);
    runtime.setOnProvinceClick(onProvinceClick);
  }, [camera, selectedProvinceId, onProvinceClick]);

  return (
    <canvas
      ref={canvasRef}
      className="map-engine-v2"
      aria-label="Historia AI GPU map"
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
    />
  );
}

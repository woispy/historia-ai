import { useEffect, useRef } from "react";
import { GpuMapRenderer } from "./gpu/GpuMapRenderer.js";
import { buildGpuAssetBridge } from "./gpu/MapAssetBridge.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { buildSpatialItems, ProvinceSoA, QuadtreeIndex } from "../runtime/index.js";

/** Thin React host: one canvas, one imperative GPU renderer, no SVG map tree. */
export default function MapEngineV2({
  provinces = [],
  camera = {},
  selectedProvinceId = null,
  mapStyle = "detailed",
  onProvinceClick,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const rigRef = useRef(null);
  const indexRef = useRef(null);
  const dragRef = useRef({ active: false, pointerId: null, moved: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const asset = buildGpuAssetBridge(provinces, mapStyle);
    if (!asset) return undefined;

    const rig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
    rig.setState(camera);
    const renderer = new GpuMapRenderer(canvas);
    renderer.setCamera(rig.snapshot());
    if (!renderer.initialize({
      provinceSource: asset.provinceSource,
      landSource: asset.landSource,
      palette: asset.palette,
      provinceIds: asset.provinceIds,
    })) {
      renderer.dispose();
      return undefined;
    }

    renderer.resize(canvas.clientWidth, canvas.clientHeight);
    renderer.setSelectedProvinceId(selectedProvinceId);
    renderer.start();
    rigRef.current = rig;
    rendererRef.current = renderer;

    const resizeObserver = new ResizeObserver(() => renderer.resize(canvas.clientWidth, canvas.clientHeight));
    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
      rigRef.current = null;
    };
    // Province/style changes rebuild GPU resources once; camera changes never do.
  }, [mapStyle, provinces]);

  useEffect(() => {
    rendererRef.current?.setCamera(camera);
    rendererRef.current?.setSelectedProvinceId(selectedProvinceId);
  }, [camera, selectedProvinceId]);

  useEffect(() => {
    const soa = new ProvinceSoA(provinces);
    indexRef.current = new QuadtreeIndex(buildSpatialItems(soa));
  }, [provinces]);

  const handleWheel = (event) => {
    event.preventDefault();
    const rig = rigRef.current;
    if (!rig) return;
    rig.zoomBy(-event.deltaY * 0.0015);
    rendererRef.current?.setCamera(rig.snapshot());
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = { active: true, pointerId: event.pointerId, moved: false, lastX: event.clientX, lastY: event.clientY };
    rigRef.current?.beginDrag();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    rigRef.current?.panPixels(dx, dy, event.currentTarget.clientWidth, event.currentTarget.clientHeight);
    rendererRef.current?.setCamera(rigRef.current?.snapshot() ?? camera);
  };

  const stopDrag = (event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current.active = false;
  };

  const handleHover = (event) => {
    if (dragRef.current.active) return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    const provinceId = renderer.pick(event.clientX, event.clientY);
    renderer.setHoveredRasterId(provinceId ? renderer.lookupRasterId(provinceId) : 0);
  };

  const handleClick = (event) => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    const provinceId = rendererRef.current?.pick(event.clientX, event.clientY);
    if (provinceId) onProvinceClick?.(provinceId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="map-engine-v2"
      aria-label="Historia AI GPU map"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => {
        handlePointerMove(event);
        handleHover(event);
      }}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onClick={handleClick}
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
    />
  );
}

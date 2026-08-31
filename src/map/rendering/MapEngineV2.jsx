import { useEffect, useRef } from "react";
import { GpuMapRenderer } from "./gpu/GpuMapRenderer.js";
import { MapCameraRig } from "../runtime/MapCameraRig.js";
import { buildSpatialItems, ProvinceSoA, QuadtreeIndex } from "../runtime/index.js";

/**
 * Thin React host for the GPU map engine. It mounts one canvas and delegates
 * all hot interaction/render work to an imperative renderer instance.
 */
export default function MapEngineV2({
  provinces = [],
  camera = {},
  selectedProvinceId = null,
  onProvinceClick,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const rigRef = useRef(null);
  const indexRef = useRef(null);
  const dragRef = useRef({ active: false, pointerId: null, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const rig = new MapCameraRig({ minZoom: 1, maxZoom: 96 });
    rig.state = { ...rig.state, ...camera };
    const renderer = new GpuMapRenderer(canvas, { cameraRig: rig });
    rigRef.current = rig;
    rendererRef.current = renderer;

    // This host intentionally has no React-driven animation state. The next
    // migration step supplies build-time binary texture assets to this API.
    const raf = requestAnimationFrame(() => renderer.start());
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
      rigRef.current = null;
    };
  }, []);

  useEffect(() => {
    const soa = new ProvinceSoA(provinces);
    indexRef.current = new QuadtreeIndex(buildSpatialItems(soa));
  }, [provinces]);

  useEffect(() => {
    rendererRef.current?.setCamera(camera);
    rendererRef.current?.setSelectedProvinceId(selectedProvinceId);
  }, [camera, selectedProvinceId]);

  const handleWheel = (event) => {
    event.preventDefault();
    const rig = rigRef.current;
    if (!rig) return;
    rig.zoomBy(-event.deltaY * 0.0015);
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = { active: true, pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
    rigRef.current?.beginDrag();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    rigRef.current?.panPixels(dx, dy, event.currentTarget.clientWidth, event.currentTarget.clientHeight);
    const renderer = rendererRef.current;
    renderer?.setCamera(rigRef.current?.snapshot() ?? camera);
  };

  const stopDrag = (event) => {
    const drag = dragRef.current;
    if (drag.active && drag.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      dragRef.current = { active: false, pointerId: null, lastX: 0, lastY: 0 };
    }
  };

  const handleClick = (event) => {
    if (dragRef.current.active) return;
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
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onClick={handleClick}
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
    />
  );
}

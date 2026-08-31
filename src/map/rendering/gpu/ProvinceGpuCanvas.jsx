import { useEffect, useRef } from "react";
import { buildProvinceGpuGeometry, getGpuProvinceIndex } from "./ProvinceGpuGeometry.js";
import { createProvinceGpuRenderer } from "./ProvinceGpuRenderer.js";

/**
 * Phase C visual bridge: authoritative runtime province geometry is uploaded
 * directly to a WebGL2 canvas. The canvas is intentionally non-interactive;
 * the SVG interaction surface remains above it until GPU picking is introduced.
 */
function ProvinceGpuCanvas({
  provinces = [],
  camera = {},
  zoom = 1,
  selectedProvinceId = null,
  selectedColor = "#d6b04d",
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const geometryRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    try {
      rendererRef.current = createProvinceGpuRenderer(canvas);
    } catch {
      rendererRef.current = null;
    }

    return () => {
      rendererRef.current?.dispose?.();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    geometryRef.current = buildProvinceGpuGeometry(provinces);
    rendererRef.current.upload(geometryRef.current);
  }, [provinces]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return undefined;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
      renderer.render({
        camera,
        width: rect.width,
        height: rect.height,
        zoom,
        selectedProvinceIndex: getGpuProvinceIndex(geometryRef.current, selectedProvinceId),
        selectedColor,
      });
    };

    resize();
    const observer = typeof ResizeObserver === "function"
      ? new ResizeObserver(resize)
      : null;
    observer?.observe(canvas.parentElement || canvas);
    window.addEventListener("resize", resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [camera, zoom, selectedProvinceId, selectedColor, provinces]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}

export default ProvinceGpuCanvas;

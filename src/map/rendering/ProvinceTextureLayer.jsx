import { useEffect, useMemo, useRef } from "react";
import { WORLD_LAND_PATH } from "../physical/WorldPhysicalAtlas";
import { buildProvinceTextureSet, createProvinceGpuRenderer, getProvinceIdAtPoint } from "./ProvinceTextureRenderer";

function ProvinceTextureLayer({ provinces = [], camera, selectedProvinceId, onProvinceClick }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const idCanvasRef = useRef(null);
  const textureKey = useMemo(() => provinces.map(({ province, country, geometry }) => `${province.id}:${province.geometryId}:${country?.color ?? ""}:${geometry?.polygons?.length ?? 0}`).join("|"), [provinces]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !provinces.length) return undefined;
    const renderer = createProvinceGpuRenderer(canvas);
    if (!renderer) return undefined;
    rendererRef.current = renderer;
    const textures = buildProvinceTextureSet(provinces, WORLD_LAND_PATH);
    renderer.setTextures(textures);
    idCanvasRef.current = textures.id;
    renderer.render(camera, selectedProvinceId);
    const resizeObserver = new ResizeObserver(() => renderer.resize());
    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
      idCanvasRef.current = null;
    };
  }, [textureKey]);

  useEffect(() => {
    rendererRef.current?.render(camera, selectedProvinceId);
  }, [camera, camera?.x, camera?.y, camera?.zoom, selectedProvinceId]);

  const handleClick = (event) => {
    const id = getProvinceIdAtPoint(idCanvasRef.current, event.clientX, event.clientY, canvasRef.current?.getBoundingClientRect());
    if (id) onProvinceClick?.(id);
  };

  return <canvas ref={canvasRef} className="province-texture-layer" aria-label="Province map" onClick={handleClick} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "auto" }} />;
}

export default ProvinceTextureLayer;

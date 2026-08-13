import { useEffect, useRef } from "react";
import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas";
import { buildMapTextureSet } from "./MapTextureAtlas";

function drawFrame(canvas, atlas, camera) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !atlas?.composite) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const zoom = Math.max(0.85, Number(camera?.zoom ?? 1));
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera?.x ?? 0);
  const centerY = Number(camera?.y ?? 0);
  const viewX = centerX - viewWidth / 2;
  const viewY = centerY - viewHeight / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#102c35";
  ctx.fillRect(0, 0, width, height);

  const sourceX = ((viewX + 180) / 360) * atlas.width;
  const sourceY = ((90 - (viewY + viewHeight)) / 180) * atlas.height;
  const sourceWidth = (viewWidth / 360) * atlas.width;
  const sourceHeight = (viewHeight / 180) * atlas.height;

  const copies = [sourceX - atlas.width, sourceX, sourceX + atlas.width];
  copies.forEach((sx) => {
    ctx.drawImage(
      atlas.composite,
      sx,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );
  });
}

function ProvinceTextureLayer({ provinces = [], camera = {}, mapStyle = "detailed", onReady }) {
  const canvasRef = useRef(null);
  const atlasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const maxTextureSize = 4096;
    const colorResolver = ({ country }) => (
      mapStyle === "terrain"
        ? country?.terrainColor ?? country?.color
        : country?.color
    );
    const textures = buildMapTextureSet(
      provinces,
      WORLD_LAND_POLYGONS,
      maxTextureSize,
      colorResolver,
    );
    if (!textures.provinces || !textures.landMask) {
      onReady?.(false);
      return undefined;
    }

    const composite = document.createElement("canvas");
    composite.width = textures.width;
    composite.height = textures.height;
    const compositeContext = composite.getContext("2d");
    compositeContext.drawImage(textures.provinces, 0, 0);
    compositeContext.globalCompositeOperation = "destination-in";
    compositeContext.drawImage(textures.landMask, 0, 0);
    compositeContext.globalCompositeOperation = "source-over";
    atlasRef.current = { ...textures, composite };
    onReady?.(true);

    const render = () => drawFrame(canvas, atlasRef.current, camera);
    render();
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      atlasRef.current = null;
    };
  }, [provinces, mapStyle, onReady]);

  useEffect(() => {
    if (atlasRef.current) drawFrame(canvasRef.current, atlasRef.current, camera);
  }, [camera]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="map-gpu-province-layer"
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

export default ProvinceTextureLayer;

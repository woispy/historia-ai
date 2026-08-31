import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas.js";

const DEFAULT_WIDTH = 2048;
const DEFAULT_HEIGHT = 1024;

/**
 * Transitional bridge from the existing authoritative geometry repository to
 * the standalone GPU renderer. It is deliberately called only during map
 * initialization, never from the camera frame loop.
 */
export function buildGpuAssetBridge(provinces, mapStyle = "detailed") {
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;
  const provinceIds = [null];
  const palette = new Uint8Array((provinces.length + 1) * 4);
  const provinceCanvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : createCanvas(width, height);
  const landCanvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(width, height)
    : createCanvas(width, height);
  if (!provinceCanvas || !landCanvas) return null;

  const provinceContext = provinceCanvas.getContext("2d", { alpha: true });
  const landContext = landCanvas.getContext("2d", { alpha: true });
  if (!provinceContext || !landContext) return null;

  landContext.fillStyle = "black";
  landContext.fillRect(0, 0, width, height);
  landContext.fillStyle = "white";
  for (const polygon of WORLD_LAND_POLYGONS) drawPolygon(landContext, polygon, width, height);

  provinces.forEach((entry, index) => {
    const rasterId = index + 1;
    provinceIds[rasterId] = entry?.province?.id ?? null;
    const sourceColor = mapStyle === "terrain"
      ? entry?.country?.terrainColor ?? entry?.country?.color
      : entry?.country?.color;
    const [r, g, b] = parseColor(sourceColor);
    palette.set([r, g, b, 255], rasterId * 4);
    provinceContext.fillStyle = `rgb(${r} ${g} ${b})`;
    for (const polygon of entry?.geometry?.polygons ?? []) drawPolygon(provinceContext, polygon, width, height);
  });

  const clipped = createCanvas(width, height);
  if (clipped) {
    const ctx = clipped.getContext("2d", { alpha: true });
    ctx.drawImage(provinceCanvas, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(landCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  return {
    width,
    height,
    provinceSource: clipped ?? provinceCanvas,
    landSource: landCanvas,
    provinceIds,
    palette,
  };
}

function createCanvas(width, height) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawPolygon(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return;
  ctx.beginPath();
  polygon.forEach((point, index) => {
    const x = ((Number(point?.[0]) + 180) / 360) * width;
    const y = ((90 - Number(point?.[1])) / 180) * height;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function parseColor(value) {
  const normalized = String(value ?? "6f765f").replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return [111, 118, 95];
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

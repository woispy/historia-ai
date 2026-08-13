/**
 * Historia AI — GPU map texture atlas.
 *
 * The political fill is rasterized once into a power-of-two RGBA texture and
 * the physical land authority is rasterized into a second single-channel-like
 * RGBA mask. Runtime camera movement then becomes a two-texture GPU sample
 * instead of re-painting hundreds of SVG province paths every frame.
 */

export const MAP_TEXTURE_ATLAS = Object.freeze({
  WORLD_WIDTH: 360,
  WORLD_HEIGHT: 180,
  PREFERRED_WIDTH: 4096,
  PREFERRED_HEIGHT: 2048,
  FALLBACK_WIDTH: 2048,
  FALLBACK_HEIGHT: 1024,
});

export function getTextureDimensions(maxTextureSize = 4096) {
  if (Number(maxTextureSize) >= MAP_TEXTURE_ATLAS.PREFERRED_WIDTH) {
    return {
      width: MAP_TEXTURE_ATLAS.PREFERRED_WIDTH,
      height: MAP_TEXTURE_ATLAS.PREFERRED_HEIGHT,
    };
  }

  return {
    width: MAP_TEXTURE_ATLAS.FALLBACK_WIDTH,
    height: MAP_TEXTURE_ATLAS.FALLBACK_HEIGHT,
  };
}

export function normalizeLongitude(longitude) {
  let value = Number(longitude) || 0;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

export function worldToTexturePoint(point, width, height) {
  const longitude = normalizeLongitude(point?.[0]);
  const latitude = Math.max(-90, Math.min(90, Number(point?.[1]) || 0));

  return [
    ((longitude + 180) / MAP_TEXTURE_ATLAS.WORLD_WIDTH) * width,
    ((90 - latitude) / MAP_TEXTURE_ATLAS.WORLD_HEIGHT) * height,
  ];
}

export function hexToRgb(hex, fallback = [111, 118, 95]) {
  const value = String(hex ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function drawPolygon(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  ctx.beginPath();
  polygon.forEach((point, index) => {
    const [x, y] = worldToTexturePoint(point, width, height);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  return true;
}

function createCanvas(width, height) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function buildProvinceTexture(provinces, width, height) {
  const canvas = createCanvas(width, height);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;

  provinces.forEach(({ province, country, geometry }) => {
    const polygons = geometry?.polygons;
    if (!Array.isArray(polygons)) return;

    const [r, g, b] = hexToRgb(country?.color);
    ctx.fillStyle = `rgb(${r} ${g} ${b})`;
    polygons.forEach((polygon) => drawPolygon(ctx, polygon, width, height));
  });

  return canvas;
}

export function buildLandMaskTexture(landPolygons, width, height) {
  const canvas = createCanvas(width, height);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";

  landPolygons.forEach((polygon) => drawPolygon(ctx, polygon, width, height));

  return canvas;
}

export function buildMapTextureSet(provinces, landPolygons, maxTextureSize = 4096) {
  const { width, height } = getTextureDimensions(maxTextureSize);
  return {
    width,
    height,
    provinces: buildProvinceTexture(provinces, width, height),
    landMask: buildLandMaskTexture(landPolygons, width, height),
  };
}

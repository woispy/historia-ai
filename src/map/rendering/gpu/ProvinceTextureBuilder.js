const DEFAULT_WIDTH = 4096;
const DEFAULT_HEIGHT = 2048;

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(value, fallback = [111, 118, 95]) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return fallback;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function createRasterCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  return null;
}

function projectPoint(point, width, height) {
  const longitude = Number(point?.[0]);
  const latitude = Number(point?.[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ];
}

function drawPolygon(ctx, polygon, width, height) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  let started = false;
  for (const point of polygon) {
    const projected = projectPoint(point, width, height);
    if (!projected) continue;

    if (!started) {
      ctx.moveTo(projected[0], projected[1]);
      started = true;
    } else {
      ctx.lineTo(projected[0], projected[1]);
    }
  }

  if (!started) return false;
  ctx.closePath();
  return true;
}

function drawPolygons(ctx, polygons, width, height) {
  ctx.beginPath();
  let count = 0;
  for (const polygon of polygons ?? []) {
    if (drawPolygon(ctx, polygon, width, height)) count += 1;
  }
  if (count) ctx.fill();
  return count;
}

function encodeId(id) {
  return [
    id & 255,
    (id >> 8) & 255,
    (id >> 16) & 255,
  ];
}

function getProvinceGeometry(provinceEntry) {
  return provinceEntry?.geometry?.polygons ?? [];
}

function isRenderableProvince(entry) {
  return Boolean(
    entry?.province?.id &&
    Array.isArray(entry?.geometry?.polygons) &&
    entry.geometry.polygons.length > 0,
  );
}

export function buildProvinceRasterData({
  provinces = [],
  landPolygons = [],
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
} = {}) {
  const provinceCanvas = createRasterCanvas(width, height);
  const landCanvas = createRasterCanvas(width, height);

  if (!provinceCanvas || !landCanvas) {
    return {
      supported: false,
      width,
      height,
      provinceCanvas: null,
      landCanvas: null,
      provinceIds: [],
      palette: new Uint8Array(0),
    };
  }

  const provinceContext = provinceCanvas.getContext("2d", { alpha: true });
  const landContext = landCanvas.getContext("2d", { alpha: true });
  if (!provinceContext || !landContext) {
    return {
      supported: false,
      width,
      height,
      provinceCanvas: null,
      landCanvas: null,
      provinceIds: [],
      palette: new Uint8Array(0),
    };
  }

  provinceContext.clearRect(0, 0, width, height);
  landContext.clearRect(0, 0, width, height);

  landContext.fillStyle = "#ffffff";
  drawPolygons(landContext, landPolygons, width, height);

  const runtimeProvinces = provinces.filter(isRenderableProvince);
  const provinceIds = [null];
  const palette = new Uint8Array((runtimeProvinces.length + 1) * 4);

  runtimeProvinces.forEach((entry, index) => {
    const rasterId = index + 1;
    const [r, g, b] = encodeId(rasterId);
    const [cr, cg, cb] = parseHexColor(entry.country?.color);

    provinceIds[rasterId] = entry.province.id;
    palette[rasterId * 4] = clampByte(cr);
    palette[rasterId * 4 + 1] = clampByte(cg);
    palette[rasterId * 4 + 2] = clampByte(cb);
    palette[rasterId * 4 + 3] = 255;

    provinceContext.fillStyle = `rgb(${r} ${g} ${b})`;
    drawPolygons(provinceContext, getProvinceGeometry(entry), width, height);
  });

  return {
    supported: true,
    width,
    height,
    provinceCanvas,
    landCanvas,
    provinceIds,
    palette,
  };
}

export { DEFAULT_HEIGHT, DEFAULT_WIDTH, encodeId, parseHexColor };

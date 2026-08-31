const EPSG_WGS84 = 4326;
const EPSG_WEB_MERCATOR = 3857;
const EPSG_GEOGRAPHIC_KEY = 2048;
const EPSG_PROJECTED_KEY = 3072;
const EPSG_MODEL_TYPE_KEY = 1024;

function finite(value) { return Number.isFinite(value); }

export function resolveGeoTiffGeoreferencing({ pixelScale, tiepoint, geoKeys } = {}) {
  if (!Array.isArray(pixelScale) || pixelScale.length < 2 || !pixelScale.slice(0, 2).every(finite) || pixelScale[0] <= 0 || pixelScale[1] <= 0) throw new Error("GeoTIFF requires positive ModelPixelScale X/Y.");
  if (!Array.isArray(tiepoint) || tiepoint.length < 6 || !tiepoint.slice(0, 6).every(finite)) throw new Error("GeoTIFF requires a valid ModelTiepoint.");
  if (!Array.isArray(geoKeys) || geoKeys.length < 4 || !geoKeys.slice(0, 4).every(Number.isInteger)) throw new Error("GeoTIFF requires a valid GeoKeyDirectory.");
  const keyCount = geoKeys[3];
  if (geoKeys.length < 4 + keyCount * 4) throw new Error("GeoTIFF GeoKeyDirectory is truncated.");
  const keys = new Map();
  for (let i = 0; i < keyCount; i += 1) {
    const base = 4 + i * 4;
    const keyId = geoKeys[base]; const location = geoKeys[base + 1]; const count = geoKeys[base + 2]; const valueOffset = geoKeys[base + 3];
    if (!Number.isInteger(keyId) || !Number.isInteger(location) || !Number.isInteger(count) || !Number.isInteger(valueOffset) || count < 1) throw new Error("GeoTIFF GeoKeyDirectory contains invalid key metadata.");
    if (location === 0) keys.set(keyId, valueOffset);
  }
  const modelType = keys.get(EPSG_MODEL_TYPE_KEY);
  const geographicType = keys.get(EPSG_GEOGRAPHIC_KEY);
  const projectedType = keys.get(EPSG_PROJECTED_KEY);
  const epsg = projectedType && projectedType !== 32767 ? projectedType : geographicType && geographicType !== 32767 ? geographicType : null;
  if (!epsg) throw new Error("GeoTIFF GeoKeyDirectory does not declare a resolvable EPSG CRS.");
  if (epsg !== EPSG_WGS84 && epsg !== EPSG_WEB_MERCATOR) throw new Error(`Unsupported GeoTIFF EPSG CRS: ${epsg}`);
  if (modelType !== 2) throw new Error("Phase E geographic terrain requires a geographic/projected raster model type.");
  const [scaleX, scaleY] = pixelScale;
  const [i, j, k, x, y, z] = tiepoint;
  if (i !== 0 || j !== 0) throw new Error("Phase E georeferencing requires the first tiepoint to anchor pixel origin.");
  return Object.freeze({ epsg, crs: `EPSG:${epsg}`, originX: x, originY: y, pixelSizeX: scaleX, pixelSizeY: scaleY, tiepoint: Object.freeze([i, j, k, x, y, z]) });
}

export function rasterPixelToWorld({ georeferencing, pixelX, pixelY } = {}) {
  if (!georeferencing || !finite(pixelX) || !finite(pixelY)) throw new Error("Raster pixel transform requires finite coordinates and georeferencing.");
  return Object.freeze({ x: georeferencing.originX + pixelX * georeferencing.pixelSizeX, y: georeferencing.originY - pixelY * georeferencing.pixelSizeY });
}

export function rasterBoundsToWorld({ georeferencing, width, height } = {}) {
  if (!Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) throw new Error("Raster bounds require dimensions >= 2.");
  const a = rasterPixelToWorld({ georeferencing, pixelX: 0, pixelY: 0 });
  const b = rasterPixelToWorld({ georeferencing, pixelX: width - 1, pixelY: height - 1 });
  return Object.freeze({ minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y), maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y) });
}

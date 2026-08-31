function finite(value, name) { if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`); return value; }

export function createTerrainHeightSampler({ bounds, width, height, samples, spacingX, spacingY } = {}) {
  if (!bounds || !(bounds.minX < bounds.maxX) || !(bounds.minY < bounds.maxY)) throw new Error("Terrain sampler requires valid geographic bounds.");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) throw new Error("Terrain sampler dimensions must be >= 2.");
  if (!(samples instanceof Float32Array) || samples.length !== width * height) throw new Error("Terrain sampler samples must match dimensions.");
  finite(spacingX, "spacingX"); finite(spacingY, "spacingY"); if (spacingX <= 0 || spacingY <= 0) throw new Error("Terrain sampler spacing must be positive.");
  const spanX = (width - 1) * spacingX; const spanY = (height - 1) * spacingY;
  function coordinates(lon, lat) { finite(lon, "longitude"); finite(lat, "latitude"); if (lon < bounds.minX || lon > bounds.maxX || lat < bounds.minY || lat > bounds.maxY) throw new Error(`Terrain sample coordinate is outside tile bounds at ${lon},${lat}.`); const u = (lon - bounds.minX) / (bounds.maxX - bounds.minX); const v = (lat - bounds.minY) / (bounds.maxY - bounds.minY); return { x: u * (width - 1), y: v * (height - 1), localX: u * spanX, localY: v * spanY }; }
  function sampleHeight(lon, lat) { const { x, y } = coordinates(lon, lat); const x0 = Math.floor(x); const y0 = Math.floor(y); const x1 = Math.min(width - 1, x0 + 1); const y1 = Math.min(height - 1, y0 + 1); const tx = x - x0; const ty = y - y0; const a = samples[y0 * width + x0]; const b = samples[y0 * width + x1]; const c = samples[y1 * width + x0]; const d = samples[y1 * width + x1]; if (![a,b,c,d].every(Number.isFinite)) throw new Error(`Terrain sampler encountered invalid elevation at ${lon},${lat}.`); return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty; }
  function sample(lon, lat) { const point = coordinates(lon, lat); return Object.freeze({ x: point.localX, y: point.localY, height: sampleHeight(lon, lat) }); }
  return Object.freeze({ sampleHeight, sample, width, height, bounds: Object.freeze({ ...bounds }), spacingX, spacingY, spanX, spanY });
}

function finite(value, name) { if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`); return value; }
function boundsContain(bounds, x, y, epsilon) { return x >= bounds.minX - epsilon && x <= bounds.maxX + epsilon && y >= bounds.minY - epsilon && y <= bounds.maxY + epsilon; }

export function validateTerrainProvinceParity({ provinceGeometry, terrainSampler, terrainTileId, epsilon = 1e-6 } = {}) {
  if (!provinceGeometry?.positions || provinceGeometry.positions.length % 2 !== 0) throw new Error("Province geometry positions must contain lon/lat pairs.");
  if (!terrainSampler || typeof terrainSampler.sample !== "function") throw new Error("Spatial parity requires a canonical terrain sampler.");
  if (typeof terrainTileId !== "string" || !terrainTileId) throw new Error("Spatial parity requires a terrain tile id.");
  if (!Number.isFinite(epsilon) || epsilon < 0) throw new Error("Spatial parity epsilon must be non-negative.");
  if (terrainSampler.tileId && terrainSampler.tileId !== terrainTileId) throw new Error(`Terrain sampler tile ${terrainSampler.tileId} does not match ${terrainTileId}.`);
  const bounds = terrainSampler.bounds; const samples = [];
  for (let i = 0; i < provinceGeometry.positions.length; i += 2) {
    const lon = finite(provinceGeometry.positions[i], "longitude"); const lat = finite(provinceGeometry.positions[i + 1], "latitude");
    if (!boundsContain(bounds, lon, lat, epsilon)) throw new Error(`Province vertex ${lon},${lat} lies outside terrain tile ${terrainTileId}.`);
    const point = terrainSampler.sample(lon, lat);
    if (![point.x, point.y, point.height].every(Number.isFinite)) throw new Error(`Invalid terrain sample at ${lon},${lat}.`);
    samples.push(Object.freeze({ lon, lat, x: point.x, y: point.y, height: point.height }));
  }
  return Object.freeze({ tileId: terrainTileId, vertexCount: samples.length, samples: Object.freeze(samples) });
}

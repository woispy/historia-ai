function finite(value, name) { if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`); return value; }
function assertTerrainSampler(sampler) { if (!sampler || (typeof sampler.sample !== "function" && typeof sampler.sampleHeight !== "function")) throw new Error("Province terrain binding requires a canonical terrain sampler."); }

export function bindProvinceGeometryToTerrain(geometry, { sampler, sampleHeight, terrainTileId, heightScale = 1, baseElevation = 0 } = {}) {
  const resolvedSampler = sampler || { sampleHeight };
  assertTerrainSampler(resolvedSampler);
  if (!geometry?.positions || geometry.positions.length % 2 !== 0) throw new Error("Province geometry positions must contain lon/lat pairs.");
  finite(heightScale, "heightScale"); finite(baseElevation, "baseElevation");
  if (heightScale <= 0) throw new Error("heightScale must be positive.");
  const vertices = new Float32Array((geometry.positions.length / 2) * 3);
  for (let i = 0; i < geometry.positions.length; i += 2) {
    const lon = finite(geometry.positions[i], "longitude"); const lat = finite(geometry.positions[i + 1], "latitude");
    const point = typeof resolvedSampler.sample === "function" ? resolvedSampler.sample(lon, lat) : { x: lon, y: lat, height: resolvedSampler.sampleHeight(lon, lat, terrainTileId) };
    if (![point.x, point.y, point.height].every(Number.isFinite)) throw new Error(`Terrain sampler returned invalid terrain coordinates at ${lon},${lat}.`);
    const out = (i / 2) * 3; vertices[out] = point.x; vertices[out + 1] = point.y; vertices[out + 2] = baseElevation + point.height * heightScale;
  }
  return Object.freeze({ positions3D: vertices, provinceIndices: geometry.provinceIndices, colors: geometry.colors, provinceIds: geometry.provinceIds, drawRanges: geometry.drawRanges, bounds: geometry.bounds, vertexCount: vertices.length / 3, triangleCount: geometry.triangleCount, terrainTileId });
}

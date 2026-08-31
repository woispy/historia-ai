function finite(value, name) { if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`); return value; }
function assertTerrainSampler(sampler) { if (!sampler || typeof sampler.sampleHeight !== "function") throw new Error("Province terrain binding requires a canonical terrain sampler."); }

export function bindProvinceGeometryToTerrain(geometry, { sampleHeight, terrainTileId, heightScale = 1, baseElevation = 0 } = {}) {
  assertTerrainSampler({ sampleHeight });
  if (!geometry?.positions || geometry.positions.length % 2 !== 0) throw new Error("Province geometry positions must contain lon/lat pairs.");
  finite(heightScale, "heightScale"); finite(baseElevation, "baseElevation");
  if (heightScale <= 0) throw new Error("heightScale must be positive.");
  const vertices = new Float32Array((geometry.positions.length / 2) * 3);
  for (let i = 0; i < geometry.positions.length; i += 2) {
    const lon = geometry.positions[i]; const lat = geometry.positions[i + 1];
    finite(lon, "longitude"); finite(lat, "latitude");
    const height = sampleHeight(lon, lat, terrainTileId);
    if (!Number.isFinite(height)) throw new Error(`Terrain sampler returned invalid height at ${lon},${lat}.`);
    const out = (i / 2) * 3; vertices[out] = lon; vertices[out + 1] = lat; vertices[out + 2] = baseElevation + height * heightScale;
  }
  return Object.freeze({ positions3D: vertices, provinceIndices: geometry.provinceIndices, colors: geometry.colors, provinceIds: geometry.provinceIds, drawRanges: geometry.drawRanges, bounds: geometry.bounds, vertexCount: vertices.length / 3, triangleCount: geometry.triangleCount, terrainTileId });
}

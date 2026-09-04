import { sanitizeTerrainHeights, TERRAIN_HEIGHT_MIN_METERS } from "./TerrainAssetCodec.js";

export const TERRAIN_MAX_SKIRT_DEPTH_METERS = 100;

/** Build a terrain tile mesh with optional duplicated boundary vertices lowered by a bounded skirt depth. */
export function buildTerrainGridMesh({ heights, size, skirtDepth = 50 }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain grid size must be an integer >= 2.");
  if (!(heights instanceof Float32Array) || heights.length !== size * size) throw new Error("Terrain heights must be a Float32Array matching the grid size.");
  if (!Number.isFinite(skirtDepth) || skirtDepth < 0) throw new Error("Terrain skirt depth must be non-negative.");
  const safeHeights = sanitizeTerrainHeights(heights);
  const safeSkirtDepth = Math.min(skirtDepth, TERRAIN_MAX_SKIRT_DEPTH_METERS);
  const baseVertexCount = size * size, skirtVertexCount = (size - 1) * 8, vertexCount = baseVertexCount + skirtVertexCount;
  const positions = new Float32Array(vertexCount * 2), vertexHeights = new Float32Array(vertexCount), uvs = new Float32Array(vertexCount * 2), normals = new Float32Array(vertexCount * 3);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, p = i * 2, uv = i * 2;
    positions[p] = x / (size - 1); positions[p + 1] = y / (size - 1); vertexHeights[i] = safeHeights[i];
    uvs[uv] = positions[p]; uvs[uv + 1] = positions[p + 1];
  }
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, left = safeHeights[y * size + Math.max(0, x - 1)], right = safeHeights[y * size + Math.min(size - 1, x + 1)], down = safeHeights[Math.max(0, y - 1) * size + x], up = safeHeights[Math.min(size - 1, y + 1) * size + x];
    const nx = left - right, ny = down - up, nz = 2, length = Math.hypot(nx, ny, nz) || 1, p = i * 3;
    normals[p] = nx / length; normals[p + 1] = ny / length; normals[p + 2] = nz / length;
  }
  const skirtSegments = safeSkirtDepth > 0 ? (size - 1) * 4 : 0;
  const indices = new Uint32Array((size - 1) * (size - 1) * 6 + skirtSegments * 6);
  let cursor = 0;
  for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
    const a = y * size + x, b = a + 1, c = a + size, d = c + 1;
    indices[cursor++] = a; indices[cursor++] = c; indices[cursor++] = b; indices[cursor++] = b; indices[cursor++] = c; indices[cursor++] = d;
  }
  if (safeSkirtDepth > 0) {
    let nextVertex = baseVertexCount;
    const edges = [];
    for (let x = 0; x < size - 1; x += 1) edges.push([x, x + 1]);
    for (let y = 0; y < size - 1; y += 1) edges.push([y * size + (size - 1), (y + 1) * size + (size - 1)]);
    for (let x = size - 1; x > 0; x -= 1) edges.push([(size - 1) * size + x, (size - 1) * size + x - 1]);
    for (let y = size - 1; y > 0; y -= 1) edges.push([y * size, (y - 1) * size]);
    for (const [a, b] of edges) {
      const skirtA = copySkirtVertex(a, nextVertex++), skirtB = copySkirtVertex(b, nextVertex++);
      indices[cursor++] = a; indices[cursor++] = skirtA; indices[cursor++] = b; indices[cursor++] = b; indices[cursor++] = skirtA; indices[cursor++] = skirtB;
    }
  }
  return Object.freeze({ positions, vertexHeights, uvs, normals, indices, skirtDepth: safeSkirtDepth });

  function copySkirtVertex(source, target) {
    positions[target * 2] = positions[source * 2]; positions[target * 2 + 1] = positions[source * 2 + 1];
    vertexHeights[target] = Math.max(TERRAIN_HEIGHT_MIN_METERS - TERRAIN_MAX_SKIRT_DEPTH_METERS, safeHeights[source] - safeSkirtDepth); uvs[target * 2] = uvs[source * 2]; uvs[target * 2 + 1] = uvs[source * 2 + 1];
    normals[target * 3] = normals[source * 3]; normals[target * 3 + 1] = normals[source * 3 + 1]; normals[target * 3 + 2] = normals[source * 3 + 2];
    return target;
  }
}

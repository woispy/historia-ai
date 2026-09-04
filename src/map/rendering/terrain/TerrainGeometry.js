import { sanitizeTerrainHeights, TERRAIN_HEIGHT_MIN_METERS } from "./TerrainAssetCodec.js";

export const TERRAIN_MAX_SKIRT_DEPTH_METERS = 100;

/** Build a terrain tile mesh while excluding every triangle that touches a NoData vertex. */
export function buildTerrainGridMesh({ heights, validity = null, size, skirtDepth = 50 }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain grid size must be an integer >= 2.");
  if (!(heights instanceof Float32Array) || heights.length !== size * size) throw new Error("Terrain heights must be a Float32Array matching the grid size.");
  if (validity !== null && (!(validity instanceof Uint8Array) || validity.length !== size * size)) throw new Error("Terrain validity must be a Uint8Array matching the grid size.");
  if (!Number.isFinite(skirtDepth) || skirtDepth < 0) throw new Error("Terrain skirt depth must be non-negative.");
  const safeHeights = sanitizeTerrainHeights(heights);
  const safeValidity = validity ? normalizeValidity(validity) : allValid(size * size);
  const safeSkirtDepth = Math.min(skirtDepth, TERRAIN_MAX_SKIRT_DEPTH_METERS);
  const baseVertexCount = size * size;
  const maxSkirtVertexCount = (size - 1) * 8;
  const vertexCount = baseVertexCount + maxSkirtVertexCount;
  const positions = new Float32Array(vertexCount * 2), vertexHeights = new Float32Array(vertexCount), uvs = new Float32Array(vertexCount * 2), normals = new Float32Array(vertexCount * 3);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, p = i * 2, uv = i * 2;
    positions[p] = x / (size - 1); positions[p + 1] = y / (size - 1); vertexHeights[i] = safeHeights[i];
    uvs[uv] = positions[p]; uvs[uv + 1] = positions[p + 1];
  }
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x;
    const center = safeHeights[i];
    const leftIndex = y * size + Math.max(0, x - 1), rightIndex = y * size + Math.min(size - 1, x + 1), downIndex = Math.max(0, y - 1) * size + x, upIndex = Math.min(size - 1, y + 1) * size + x;
    const left = safeValidity[leftIndex] ? safeHeights[leftIndex] : center, right = safeValidity[rightIndex] ? safeHeights[rightIndex] : center, down = safeValidity[downIndex] ? safeHeights[downIndex] : center, up = safeValidity[upIndex] ? safeHeights[upIndex] : center;
    const nx = left - right, ny = down - up, nz = 2, length = Math.hypot(nx, ny, nz) || 1, p = i * 3;
    normals[p] = nx / length; normals[p + 1] = ny / length; normals[p + 2] = nz / length;
  }
  const maxIndexCount = (size - 1) * (size - 1) * 6 + (safeSkirtDepth > 0 ? (size - 1) * 4 * 6 : 0);
  const indices = new Uint32Array(maxIndexCount);
  let cursor = 0;
  for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
    const a = y * size + x, b = a + 1, c = a + size, d = c + 1;
    if (safeValidity[a] && safeValidity[b] && safeValidity[c]) {
      indices[cursor++] = a; indices[cursor++] = c; indices[cursor++] = b;
    }
    if (safeValidity[b] && safeValidity[c] && safeValidity[d]) {
      indices[cursor++] = b; indices[cursor++] = c; indices[cursor++] = d;
    }
  }
  if (safeSkirtDepth > 0) {
    let nextVertex = baseVertexCount;
    const edges = [];
    for (let x = 0; x < size - 1; x += 1) edges.push([x, x + 1]);
    for (let y = 0; y < size - 1; y += 1) edges.push([y * size + (size - 1), (y + 1) * size + (size - 1)]);
    for (let x = size - 1; x > 0; x -= 1) edges.push([(size - 1) * size + x, (size - 1) * size + x - 1]);
    for (let y = size - 1; y > 0; y -= 1) edges.push([y * size, (y - 1) * size]);
    for (const [a, b] of edges) {
      if (!safeValidity[a] || !safeValidity[b]) continue;
      const skirtA = copySkirtVertex(a, nextVertex++), skirtB = copySkirtVertex(b, nextVertex++);
      indices[cursor++] = a; indices[cursor++] = skirtA; indices[cursor++] = b; indices[cursor++] = b; indices[cursor++] = skirtA; indices[cursor++] = skirtB;
    }
  }
  return Object.freeze({ positions, vertexHeights, uvs, normals, indices: indices.subarray(0, cursor), vertexValidity: safeValidity, skirtDepth: safeSkirtDepth });

  function copySkirtVertex(source, target) {
    positions[target * 2] = positions[source * 2]; positions[target * 2 + 1] = positions[source * 2 + 1];
    vertexHeights[target] = Math.max(TERRAIN_HEIGHT_MIN_METERS - TERRAIN_MAX_SKIRT_DEPTH_METERS, safeHeights[source] - safeSkirtDepth); uvs[target * 2] = uvs[source * 2]; uvs[target * 2 + 1] = uvs[source * 2 + 1];
    normals[target * 3] = normals[source * 3]; normals[target * 3 + 1] = normals[source * 3 + 1]; normals[target * 3 + 2] = normals[source * 3 + 2];
    return target;
  }
}

function normalizeValidity(values) {
  const result = new Uint8Array(values.length);
  for (let index = 0; index < values.length; index += 1) result[index] = values[index] !== 0 ? 255 : 0;
  return result;
}

function allValid(length) {
  const result = new Uint8Array(length);
  result.fill(255);
  return result;
}

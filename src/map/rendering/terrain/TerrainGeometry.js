/** Build a regular terrain tile mesh from a normalized height sample grid. */
export function buildTerrainGridMesh({ heights, size, skirtDepth = 0.02 }) {
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain grid size must be an integer >= 2.");
  if (!(heights instanceof Float32Array) || heights.length !== size * size) throw new Error("Terrain heights must be a Float32Array matching the grid size.");
  if (!Number.isFinite(skirtDepth) || skirtDepth < 0) throw new Error("Terrain skirt depth must be non-negative.");
  const vertexCount = size * size;
  const positions = new Float32Array(vertexCount * 3), uvs = new Float32Array(vertexCount * 2), normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array((size - 1) * (size - 1) * 6);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, p = i * 3, uv = i * 2;
    positions[p] = x / (size - 1); positions[p + 1] = y / (size - 1); positions[p + 2] = heights[i];
    uvs[uv] = x / (size - 1); uvs[uv + 1] = y / (size - 1);
  }
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const i = y * size + x, left = heights[y * size + Math.max(0, x - 1)], right = heights[y * size + Math.min(size - 1, x + 1)];
    const down = heights[Math.max(0, y - 1) * size + x], up = heights[Math.min(size - 1, y + 1) * size + x];
    const nx = left - right, ny = down - up, nz = 2 / Math.max(1, size - 1), length = Math.hypot(nx, ny, nz) || 1, p = i * 3;
    normals[p] = nx / length; normals[p + 1] = ny / length; normals[p + 2] = nz / length;
  }
  let cursor = 0;
  for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
    const a = y * size + x, b = a + 1, c = a + size, d = c + 1;
    indices[cursor++] = a; indices[cursor++] = c; indices[cursor++] = b; indices[cursor++] = b; indices[cursor++] = c; indices[cursor++] = d;
  }
  return Object.freeze({ positions, uvs, normals, indices, skirtDepth });
}

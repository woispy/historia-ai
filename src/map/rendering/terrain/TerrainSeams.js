/** Phase E geometry-side crack protection for adjacent terrain tiles with different LODs. */
const EDGE_NAMES = Object.freeze(["top", "right", "bottom", "left"]);
function edgeVertexIndex(edge, i, size) { if (edge === "top") return i; if (edge === "right") return i * size + size - 1; if (edge === "bottom") return (size - 1) * size + (size - 1 - i); return (size - 1 - i) * size; }
export function addTerrainSkirts(mesh, { size, depth = 0.02 } = {}) {
  if (!mesh?.positions || !mesh?.uvs || !mesh?.normals || !mesh?.indices) throw new Error("Terrain skirt generation requires a complete mesh.");
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain skirt size must be an integer >= 2.");
  if (!Number.isFinite(depth) || depth < 0) throw new Error("Terrain skirt depth must be non-negative.");
  const baseVertexCount = mesh.positions.length / 3;
  if (baseVertexCount !== size * size) throw new Error("Terrain skirt size does not match mesh vertex count.");
  const extraVertices = EDGE_NAMES.length * size;
  const positions = new Float32Array(mesh.positions.length + extraVertices * 3), uvs = new Float32Array(mesh.uvs.length + extraVertices * 2), normals = new Float32Array(mesh.normals.length + extraVertices * 3);
  positions.set(mesh.positions); uvs.set(mesh.uvs); normals.set(mesh.normals);
  const skirtIndices = new Uint32Array(EDGE_NAMES.length * (size - 1) * 6);
  let vertexCursor = baseVertexCount, indexCursor = 0;
  for (const edge of EDGE_NAMES) {
    for (let i = 0; i < size; i += 1) { const source = edgeVertexIndex(edge, i, size), sp = source * 3, su = source * 2, tp = vertexCursor * 3, tu = vertexCursor * 2; positions[tp] = mesh.positions[sp]; positions[tp + 1] = mesh.positions[sp + 1]; positions[tp + 2] = mesh.positions[sp + 2] - depth; uvs[tu] = mesh.uvs[su]; uvs[tu + 1] = mesh.uvs[su + 1]; normals[tp] = mesh.normals[sp]; normals[tp + 1] = mesh.normals[sp + 1]; normals[tp + 2] = mesh.normals[sp + 2]; vertexCursor += 1; }
    const start = vertexCursor - size;
    for (let i = 0; i < size - 1; i += 1) { const topA = edgeVertexIndex(edge, i, size), topB = edgeVertexIndex(edge, i + 1, size), skirtA = start + i, skirtB = start + i + 1; skirtIndices[indexCursor++] = topA; skirtIndices[indexCursor++] = skirtA; skirtIndices[indexCursor++] = topB; skirtIndices[indexCursor++] = topB; skirtIndices[indexCursor++] = skirtA; skirtIndices[indexCursor++] = skirtB; }
  }
  const indices = new Uint32Array(mesh.indices.length + skirtIndices.length); indices.set(mesh.indices); indices.set(skirtIndices, mesh.indices.length);
  return Object.freeze({ positions, uvs, normals, indices, skirtDepth: depth });
}
export function terrainLodEdgeCompatible(fineSize, coarseSize) { return Number.isInteger(fineSize) && Number.isInteger(coarseSize) && fineSize >= 2 && coarseSize >= 2 && (fineSize - 1) % (coarseSize - 1) === 0; }

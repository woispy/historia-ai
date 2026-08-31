/**
 * Geometry-side crack protection for adjacent terrain tiles with different LODs.
 * A skirt is generated from the tile boundary and pushed below the terrain.
 * Neighbor-aware refinement can later replace a skirt edge with a stitched strip
 * without changing the tile/LOD contract.
 */

const EDGE_NAMES = Object.freeze(["top", "right", "bottom", "left"]);

function edgeVertexIndex(edge, i, size) {
  if (edge === "top") return i;
  if (edge === "right") return i * size + size - 1;
  if (edge === "bottom") return (size - 1) * size + (size - 1 - i);
  return (size - 1 - i) * size;
}

export function addTerrainSkirts(mesh, { size, depth = 0.02 } = {}) {
  if (!mesh?.positions || !mesh?.uvs || !mesh?.normals || !mesh?.indices) throw new Error("Terrain skirt generation requires a complete mesh.");
  if (!Number.isInteger(size) || size < 2) throw new Error("Terrain skirt size must be an integer >= 2.");
  if (!Number.isFinite(depth) || depth < 0) throw new Error("Terrain skirt depth must be non-negative.");
  const baseVertexCount = mesh.positions.length / 3;
  if (baseVertexCount !== size * size) throw new Error("Terrain skirt size does not match mesh vertex count.");

  const extraVertices = EDGE_NAMES.length * size;
  const positions = new Float32Array(mesh.positions.length + extraVertices * 3);
  const uvs = new Float32Array(mesh.uvs.length + extraVertices * 2);
  const normals = new Float32Array(mesh.normals.length + extraVertices * 3);
  positions.set(mesh.positions);
  uvs.set(mesh.uvs);
  normals.set(mesh.normals);

  const skirtIndices = new Uint32Array(EDGE_NAMES.length * (size - 1) * 6);
  let vertexCursor = baseVertexCount;
  let indexCursor = 0;

  for (const edge of EDGE_NAMES) {
    for (let i = 0; i < size; i += 1) {
      const source = edgeVertexIndex(edge, i, size);
      const sourcePosition = source * 3;
      const sourceUv = source * 2;
      const targetPosition = vertexCursor * 3;
      const targetUv = vertexCursor * 2;
      positions[targetPosition] = mesh.positions[sourcePosition];
      positions[targetPosition + 1] = mesh.positions[sourcePosition + 1];
      positions[targetPosition + 2] = mesh.positions[sourcePosition + 2] - depth;
      uvs[targetUv] = mesh.uvs[sourceUv];
      uvs[targetUv + 1] = mesh.uvs[sourceUv + 1];
      normals[targetPosition] = mesh.normals[sourcePosition];
      normals[targetPosition + 1] = mesh.normals[sourcePosition + 1];
      normals[targetPosition + 2] = mesh.normals[sourcePosition + 2];
      vertexCursor += 1;
    }

    const start = vertexCursor - size;
    for (let i = 0; i < size - 1; i += 1) {
      const topA = edgeVertexIndex(edge, i, size);
      const topB = edgeVertexIndex(edge, i + 1, size);
      const skirtA = start + i;
      const skirtB = start + i + 1;
      skirtIndices[indexCursor++] = topA;
      skirtIndices[indexCursor++] = skirtA;
      skirtIndices[indexCursor++] = topB;
      skirtIndices[indexCursor++] = topB;
      skirtIndices[indexCursor++] = skirtA;
      skirtIndices[indexCursor++] = skirtB;
    }
  }

  const indices = new Uint32Array(mesh.indices.length + skirtIndices.length);
  indices.set(mesh.indices);
  indices.set(skirtIndices, mesh.indices.length);
  return Object.freeze({ positions, uvs, normals, indices, skirtDepth: depth });
}

export function terrainLodEdgeCompatible(fineSize, coarseSize) {
  if (!Number.isInteger(fineSize) || !Number.isInteger(coarseSize) || fineSize < 2 || coarseSize < 2) return false;
  return (fineSize - 1) % (coarseSize - 1) === 0;
}

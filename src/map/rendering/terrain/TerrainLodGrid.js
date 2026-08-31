function assertGrid(values, size) { if (!(values instanceof Float32Array) || !Number.isInteger(size) || size < 2 || values.length !== size * size) throw new Error("Terrain LOD grid requires a square Float32 sample grid."); }

export function validateNestedLodGrid({ parentSize, childSize } = {}) {
  if (!Number.isInteger(parentSize) || !Number.isInteger(childSize) || parentSize < 2 || childSize < 2) throw new Error("LOD grid sizes must be integers >= 2.");
  const parentSegments = parentSize - 1; const childSegments = childSize - 1;
  if (childSegments !== parentSegments * 2) throw new Error("Adjacent terrain LOD grids must have a 2:1 segment ratio.");
  return true;
}

export function sampleNestedLodEdge({ values, size, edge, index } = {}) {
  assertGrid(values, size); if (!Number.isInteger(index) || index < 0 || index >= size) throw new Error("Terrain edge index is outside the grid.");
  if (!["top","bottom","left","right"].includes(edge)) throw new Error("Unknown terrain edge.");
  const i = edge === "top" ? index : edge === "bottom" ? (size - 1) * size + index : edge === "left" ? index * size : index * size + size - 1;
  return values[i];
}

export function buildCoarseEdgeConstraints({ fineValues, fineSize, coarseSize, edge } = {}) {
  assertGrid(fineValues, fineSize); validateNestedLodGrid({ parentSize: coarseSize, childSize: fineSize });
  const result = new Float32Array(coarseSize); const ratio = (fineSize - 1) / (coarseSize - 1);
  for (let i = 0; i < coarseSize; i += 1) result[i] = sampleNestedLodEdge({ values: fineValues, size: fineSize, edge, index: Math.round(i * ratio) });
  return result;
}

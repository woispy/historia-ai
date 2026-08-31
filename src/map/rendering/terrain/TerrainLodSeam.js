function assertSize(size) { if (!Number.isInteger(size) || size < 2) throw new Error("Terrain LOD size must be an integer >= 2."); }
function edgeVertex(size, edge, i) { if (edge === "top") return i; if (edge === "bottom") return (size - 1) * size + i; if (edge === "left") return i * size; return i * size + size - 1; }

export function buildLodSeamIndices({ fineSize, coarseSize, edge } = {}) {
  assertSize(fineSize); assertSize(coarseSize); if (!['top','bottom','left','right'].includes(edge)) throw new Error("Unknown terrain LOD seam edge.");
  if (fineSize - 1 !== (coarseSize - 1) * 2) throw new Error("LOD seam requires a 2:1 segment ratio.");
  const indices = [];
  const fine = (i) => edgeVertex(fineSize, edge, i); const coarse = (i) => edgeVertex(coarseSize, edge, i) + fineSize * fineSize;
  for (let i = 0; i < coarseSize - 1; i += 1) {
    const f0 = fine(i * 2); const fm = fine(i * 2 + 1); const f1 = fine(i * 2 + 2); const c0 = coarse(i); const c1 = coarse(i + 1);
    indices.push(f0, fm, c0, fm, c1, c0, fm, f1, c1);
  }
  return Uint32Array.from(indices);
}

export function validateLodSeamIndexRange(indices, fineSize, coarseSize) {
  assertSize(fineSize); assertSize(coarseSize); const maxIndex = fineSize * fineSize + coarseSize * coarseSize - 1;
  for (const index of indices) if (!Number.isInteger(index) || index < 0 || index > maxIndex) throw new Error("LOD seam index is outside combined mesh range.");
  return true;
}

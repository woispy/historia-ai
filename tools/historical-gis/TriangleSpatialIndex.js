/** Deterministic uniform-grid broad phase for triangle pair candidates. */
export function buildTriangleSpatialIndex(triangles, { cellSize = 1 } = {}) {
  if (!Number.isFinite(cellSize) || cellSize <= 0) throw new RangeError("cellSize must be positive");
  const bins = new Map();
  triangles.forEach((triangle, index) => {
    const box = triangleAabb(triangle);
    const minX = Math.floor(box.minX / cellSize), maxX = Math.floor(box.maxX / cellSize);
    const minY = Math.floor(box.minY / cellSize), maxY = Math.floor(box.maxY / cellSize);
    for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
      const key = `${x}:${y}`;
      const bucket = bins.get(key);
      if (bucket) bucket.push(index); else bins.set(key, [index]);
    }
  });
  return Object.freeze({ cellSize, bins });
}

export function candidateTrianglePairs(triangles, index) {
  const pairs = new Set();
  for (const bucket of index.bins.values()) {
    for (let i = 0; i < bucket.length; i += 1) for (let j = i + 1; j < bucket.length; j += 1) {
      const a = Math.min(bucket[i], bucket[j]), b = Math.max(bucket[i], bucket[j]);
      if (a !== b && aabbOverlap(triangleAabb(triangles[a]), triangleAabb(triangles[b]))) pairs.add(`${a}:${b}`);
    }
  }
  return [...pairs].map((key) => key.split(":").map(Number)).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
}

function triangleAabb(t) { const p = t.points ?? [t.a,t.b,t.c]; return { minX: Math.min(p[0][0],p[1][0],p[2][0]), maxX: Math.max(p[0][0],p[1][0],p[2][0]), minY: Math.min(p[0][1],p[1][1],p[2][1]), maxY: Math.max(p[0][1],p[1][1],p[2][1]) }; }
function aabbOverlap(a,b) { return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY; }

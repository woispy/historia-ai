function finite(v) { return Number.isFinite(v); }
function assertGrid(heights, width, height) { if (!heights || heights.length !== width * height || !Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) throw new Error("Terrain gradient requires a rectangular elevation grid."); }
function sample(heights, width, height, x, y) { const cx = Math.max(0, Math.min(width - 1, x)); const cy = Math.max(0, Math.min(height - 1, y)); return heights[cy * width + cx]; }

export function derivePhysicalGradients({ heights, width, height, spacingX, spacingY, noDataValue = null } = {}) {
  assertGrid(heights, width, height);
  if (![spacingX, spacingY].every(finite) || spacingX <= 0 || spacingY <= 0) throw new Error("Terrain gradient spacing must be positive meters.");
  const slope = new Float32Array(width * height); const normals = new Float32Array(width * height * 3);
  const valid = (v) => finite(v) && (noDataValue === null || v !== noDataValue);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const center = sample(heights, width, height, x, y);
    const left = sample(heights, width, height, x - 1, y); const right = sample(heights, width, height, x + 1, y);
    const up = sample(heights, width, height, x, y - 1); const down = sample(heights, width, height, x, y + 1);
    const index = y * width + x; const ni = index * 3;
    if (![center,left,right,up,down].every(valid)) { slope[index] = 0; normals[ni] = 0; normals[ni + 1] = 1; normals[ni + 2] = 0; continue; }
    const dx = (right - left) / (2 * spacingX); const dy = (down - up) / (2 * spacingY);
    const gradient = Math.hypot(dx, dy); slope[index] = Math.atan(gradient) * 180 / Math.PI;
    const nx = -dx; const ny = 1; const nz = -dy; const length = Math.hypot(nx, ny, nz);
    normals[ni] = nx / length; normals[ni + 1] = ny / length; normals[ni + 2] = nz / length;
  }
  return Object.freeze({ slope, normals });
}

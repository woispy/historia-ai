import { assertRealDemProvenance } from "./CopernicusDemSource.js";

export const TERRAIN_DEM_PIPELINE_VERSION = 2;

export function validateDemRaster({ width, height, samples, noDataValue = null, min = null, max = null } = {}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) throw new Error("DEM raster dimensions must be integers >= 2.");
  if (!samples || samples.length !== width * height) throw new Error("DEM sample count does not match raster dimensions.");
  const values = Array.from(samples, Number);
  const valid = values.filter((value) => Number.isFinite(value) && (noDataValue === null || value !== noDataValue));
  if (!valid.length) throw new Error("DEM raster contains no valid elevation samples.");
  const observedMin = Math.min(...valid);
  const observedMax = Math.max(...valid);
  if (min !== null && observedMin < min) throw new Error("DEM raster is below declared minimum.");
  if (max !== null && observedMax > max) throw new Error("DEM raster exceeds declared maximum.");
  return Object.freeze({ width, height, validSamples: valid.length, min: observedMin, max: observedMax, noDataValue });
}

function isValidSample(value, noDataValue) {
  return Number.isFinite(value) && (noDataValue === null || value !== noDataValue);
}

export function bilinearSample(raster, u, v) {
  if (!raster?.samples || raster.width < 2 || raster.height < 2) throw new Error("Bilinear sampling requires a validated raster.");
  const x = Math.max(0, Math.min(raster.width - 1, u * (raster.width - 1)));
  const y = Math.max(0, Math.min(raster.height - 1, v * (raster.height - 1)));
  const x0 = Math.floor(x); const y0 = Math.floor(y);
  const x1 = Math.min(raster.width - 1, x0 + 1); const y1 = Math.min(raster.height - 1, y0 + 1);
  const tx = x - x0; const ty = y - y0;
  const noDataValue = raster.noDataValue ?? null;
  const at = (ix, iy) => raster.samples[iy * raster.width + ix];
  const a = at(x0, y0); const b = at(x1, y0); const c = at(x0, y1); const d = at(x1, y1);
  const samples = [a, b, c, d];
  if (!samples.every((value) => isValidSample(value, noDataValue))) return null;
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

export function buildHeightmap({ raster, outputSize, provenance } = {}) {
  assertRealDemProvenance(provenance);
  validateDemRaster(raster);
  if (!Number.isInteger(outputSize) || outputSize < 2) throw new Error("Heightmap outputSize must be an integer >= 2.");
  const heights = new Float32Array(outputSize * outputSize);
  for (let y = 0; y < outputSize; y += 1) {
    for (let x = 0; x < outputSize; x += 1) {
      const sample = bilinearSample(raster, x / (outputSize - 1), y / (outputSize - 1));
      if (sample === null) throw new Error("Cannot resample terrain tile across DEM no-data samples.");
      heights[y * outputSize + x] = sample;
    }
  }
  return Object.freeze({ version: TERRAIN_DEM_PIPELINE_VERSION, size: outputSize, heights, provenance, noDataValue: raster.noDataValue ?? null });
}

export function deriveNormals(heights, size, cellSize = 1) {
  if (!heights || heights.length !== size * size || size < 2 || cellSize <= 0) throw new Error("Normal derivation requires a square heightmap and positive cell size.");
  const normals = new Float32Array(heights.length * 3);
  const sample = (x, y) => heights[Math.max(0, Math.min(size - 1, y)) * size + Math.max(0, Math.min(size - 1, x))];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) / (2 * cellSize);
      const dy = (sample(x, y + 1) - sample(x, y - 1)) / (2 * cellSize);
      const nx = -dx; const ny = -dy; const nz = 1;
      const length = Math.hypot(nx, ny, nz) || 1;
      const index = (y * size + x) * 3;
      normals[index] = nx / length; normals[index + 1] = ny / length; normals[index + 2] = nz / length;
    }
  }
  return normals;
}

/**
 * DEM-derived terrain evidence. This module deliberately produces physical
 * evidence only: it does not know province ownership or create borders.
 *
 * Inputs are a regular elevation sample grid. Ridge likelihood is derived
 * from local relief and directional profile prominence; mountain resistance
 * combines normalized slope and relief. The algorithm is deterministic and
 * bounded so it can feed T3/P6.1/P6.2 without introducing political authority.
 */

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be finite`);
  return number;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finite(value, "value")));
}

function indexOf(width, x, y) {
  return y * width + x;
}

function elevation(grid, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const value = grid[indexOf(width, x, y)];
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function normalizedSlope(rise, runMeters) {
  if (runMeters <= 0 || rise == null) return 0;
  const degrees = Math.atan(Math.abs(rise) / runMeters) * 180 / Math.PI;
  return clamp01(degrees / 45);
}

function localReliefMeters(grid, width, height, x, y) {
  const center = elevation(grid, width, height, x, y);
  if (center == null) return null;
  const values = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const value = elevation(grid, width, height, x + dx, y + dy);
      if (value != null) values.push(value);
    }
  }
  if (!values.length) return null;
  return Math.max(...values) - Math.min(...values);
}

function ridgeProminence(grid, width, height, x, y) {
  const center = elevation(grid, width, height, x, y);
  if (center == null) return null;
  const north = elevation(grid, width, height, x, y - 1);
  const south = elevation(grid, width, height, x, y + 1);
  const west = elevation(grid, width, height, x - 1, y);
  const east = elevation(grid, width, height, x + 1, y);
  const profiles = [
    [north, south],
    [west, east],
  ].filter(([a, b]) => a != null && b != null);
  if (!profiles.length) return 0;
  const prominence = profiles.reduce((sum, [a, b]) => sum + Math.max(0, center - Math.max(a, b)), 0) / profiles.length;
  return prominence;
}

/**
 * Extract bounded evidence from a DEM grid.
 * @param {{elevations:number[], width:number, height:number, cellSizeMeters:number}} grid
 * @param {{reliefScaleMeters?:number, ridgeScaleMeters?:number}} options
 */
export function extractDEMReliefEvidence(grid, { reliefScaleMeters = 500, ridgeScaleMeters = 400 } = {}) {
  if (!grid || !Array.isArray(grid.elevations)) throw new TypeError("grid.elevations must be an array");
  const width = finite(grid.width, "grid.width");
  const height = finite(grid.height, "grid.height");
  const cellSizeMeters = finite(grid.cellSizeMeters, "grid.cellSizeMeters");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new RangeError("invalid DEM dimensions");
  if (grid.elevations.length !== width * height) throw new RangeError("DEM elevation length does not match dimensions");
  if (cellSizeMeters <= 0) throw new RangeError("grid.cellSizeMeters must be positive");
  if (reliefScaleMeters <= 0 || ridgeScaleMeters <= 0) throw new RangeError("evidence scales must be positive");

  const samples = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const center = elevation(grid.elevations, width, height, x, y);
      if (center == null) {
        samples.push({ valid: false, x, y, elevationMeters: null, slopeNormalized: 0, ridgeAffinity: 0, mountainResistance: 0 });
        continue;
      }
      const neighbors = [
        elevation(grid.elevations, width, height, x - 1, y),
        elevation(grid.elevations, width, height, x + 1, y),
        elevation(grid.elevations, width, height, x, y - 1),
        elevation(grid.elevations, width, height, x, y + 1),
      ].filter((value) => value != null);
      const meanNeighbor = neighbors.length ? neighbors.reduce((sum, value) => sum + value, 0) / neighbors.length : center;
      const slope = normalizedSlope(center - meanNeighbor, cellSizeMeters);
      const relief = localReliefMeters(grid.elevations, width, height, x, y) ?? 0;
      const prominence = ridgeProminence(grid.elevations, width, height, x, y) ?? 0;
      const reliefSignal = clamp01(relief / reliefScaleMeters);
      const ridgeSignal = clamp01(prominence / ridgeScaleMeters);
      const ridgeAffinity = clamp01(ridgeSignal * 0.65 + reliefSignal * 0.35);
      const mountainResistance = clamp01(slope * 0.55 + reliefSignal * 0.45);
      samples.push({
        valid: true,
        x,
        y,
        elevationMeters: center,
        slopeNormalized: Number(slope.toFixed(6)),
        reliefMeters: Number(relief.toFixed(3)),
        ridgeProminenceMeters: Number(prominence.toFixed(3)),
        ridgeAffinity: Number(ridgeAffinity.toFixed(6)),
        mountainResistance: Number(mountainResistance.toFixed(6)),
      });
    }
  }
  return Object.freeze({ schemaVersion: 1, source: "DEM", authoritative: false, width, height, cellSizeMeters, samples });
}

function finite(v) { return Number.isFinite(v); }
function assertRaster(raster, name) { if (!raster || !Number.isInteger(raster.width) || raster.width < 2 || !Number.isInteger(raster.height) || raster.height < 2 || typeof raster.crs !== "string" || !raster.bounds) throw new Error(`${name} raster metadata is invalid.`); }
function nearlyEqual(a, b, epsilon) { return Math.abs(a - b) <= epsilon; }

export function validateTerrainRasterAlignment({ dem, landCover, tolerance = 1e-6 } = {}) {
  assertRaster(dem, "DEM"); assertRaster(landCover, "Land-cover");
  if (!finite(tolerance) || tolerance < 0) throw new Error("Alignment tolerance must be non-negative.");
  if (dem.crs !== landCover.crs) throw new Error(`Raster CRS mismatch: ${dem.crs} vs ${landCover.crs}.`);
  const pairs = [["minX", dem.bounds.minX, landCover.bounds.minX], ["minY", dem.bounds.minY, landCover.bounds.minY], ["maxX", dem.bounds.maxX, landCover.bounds.maxX], ["maxY", dem.bounds.maxY, landCover.bounds.maxY]];
  for (const [name, a, b] of pairs) if (!finite(a) || !finite(b) || !nearlyEqual(a, b, tolerance)) throw new Error(`Raster bounds mismatch at ${name}.`);
  if (!finite(dem.resolutionMeters) || dem.resolutionMeters <= 0 || !finite(landCover.resolution) || landCover.resolution <= 0) throw new Error("Raster resolutions must be positive.");
  return Object.freeze({ aligned: true, crs: dem.crs, demResolution: dem.resolutionMeters, landCoverResolution: landCover.resolution, bounds: Object.freeze({ ...dem.bounds }) });
}

export function resampleLandCoverNearest({ landCover, targetWidth, targetHeight } = {}) {
  assertRaster(landCover, "Land-cover");
  if (!Number.isInteger(targetWidth) || targetWidth < 2 || !Number.isInteger(targetHeight) || targetHeight < 2) throw new Error("Target raster dimensions must be >= 2.");
  if (!landCover.values || landCover.values.length !== landCover.width * landCover.height) throw new Error("Land-cover values are missing or malformed.");
  const output = new Uint16Array(targetWidth * targetHeight);
  for (let y = 0; y < targetHeight; y += 1) for (let x = 0; x < targetWidth; x += 1) {
    const sx = Math.min(landCover.width - 1, Math.round(x * (landCover.width - 1) / (targetWidth - 1)));
    const sy = Math.min(landCover.height - 1, Math.round(y * (landCover.height - 1) / (targetHeight - 1)));
    output[y * targetWidth + x] = landCover.values[sy * landCover.width + sx];
  }
  return output;
}

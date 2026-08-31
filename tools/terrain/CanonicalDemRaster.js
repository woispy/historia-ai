import { assertDemBinaryPayload } from "./RealDemBinaryContract.js";
import { resolveGeoTiffGeoreferencing, rasterPixelToWorld, rasterBoundsToWorld } from "./GeoTiffGeoreferencing.js";

function assertFiniteSamples(samples) {
  if (!samples || typeof samples.length !== "number") throw new Error("Canonical DEM requires an elevation sample array.");
}

export function createCanonicalDemRaster({ decoded, metadata } = {}) {
  if (!decoded?.metadata || !decoded?.samples) throw new Error("Canonical DEM requires a decoded DEM payload.");
  assertFiniteSamples(decoded.samples);
  const validated = assertDemBinaryPayload({ metadata: { ...decoded.metadata, ...(metadata || {}) }, samples: decoded.samples });
  const georeferencing = resolveGeoTiffGeoreferencing(decoded.georeferencing);
  const bounds = rasterBoundsToWorld({ georeferencing, width: validated.metadata.width, height: validated.metadata.height });
  const declared = validated.metadata.bounds;
  const epsilon = Math.max(1e-7, Math.max(Math.abs(declared.maxX - declared.minX), Math.abs(declared.maxY - declared.minY)) * 1e-5);
  if (Math.abs(bounds.minX - declared.minX) > epsilon || Math.abs(bounds.maxX - declared.maxX) > epsilon || Math.abs(bounds.minY - declared.minY) > epsilon || Math.abs(bounds.maxY - declared.maxY) > epsilon) throw new Error("DEM georeferencing bounds do not match declared geographic bounds.");
  const samples = Float32Array.from(decoded.samples, Number);
  return Object.freeze({ version: 1, width: validated.metadata.width, height: validated.metadata.height, crs: georeferencing.crs, resolutionMeters: validated.metadata.resolutionMeters, bounds, noDataValue: validated.metadata.noDataValue, samples, min: validated.min, max: validated.max, sampleCount: validated.validSamples, pixelToWorld: (pixelX, pixelY) => rasterPixelToWorld({ georeferencing, pixelX, pixelY }) });
}

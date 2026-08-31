import { assertRealDemProvenance } from "./CopernicusDemSource.js";

export const REAL_DEM_BINARY_CONTRACT_VERSION = 1;

export const DEM_CONTAINER_TYPES = Object.freeze(["GeoTIFF", "DTED"]);

export function validateDemBinaryMetadata({ container, byteLength, width, height, sampleType, noDataValue = null, crs, resolutionMeters, bounds, provenance } = {}) {
  if (!DEM_CONTAINER_TYPES.includes(container)) throw new Error(`Unsupported DEM container: ${container}`);
  if (!Number.isInteger(byteLength) || byteLength <= 0) throw new Error("DEM binary must have a positive byte length.");
  if (!Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) throw new Error("DEM binary dimensions must be integers >= 2.");
  if (!sampleType || !["int16", "uint16", "float32", "float64"].includes(sampleType)) throw new Error("Unsupported DEM sample type.");
  if (!crs || typeof crs !== "string") throw new Error("DEM binary requires a CRS identifier.");
  if (!Number.isFinite(resolutionMeters) || resolutionMeters <= 0) throw new Error("DEM binary requires a positive horizontal resolution.");
  if (!bounds || ![bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isFinite) || bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    throw new Error("DEM binary requires valid geographic bounds.");
  }
  assertRealDemProvenance(provenance);
  return Object.freeze({ version: REAL_DEM_BINARY_CONTRACT_VERSION, container, byteLength, width, height, sampleType, noDataValue, crs, resolutionMeters, bounds, provenance });
}

export function assertDemBinaryPayload({ metadata, samples } = {}) {
  if (!metadata) throw new Error("DEM binary metadata is required.");
  validateDemBinaryMetadata(metadata);
  if (!samples || samples.length !== metadata.width * metadata.height) throw new Error("DEM binary sample payload does not match metadata dimensions.");
  const values = Array.from(samples, Number);
  const valid = values.filter((value) => Number.isFinite(value) && (metadata.noDataValue === null || value !== metadata.noDataValue));
  if (!valid.length) throw new Error("DEM binary contains no valid elevation samples.");
  return Object.freeze({ metadata, validSamples: valid.length, min: Math.min(...valid), max: Math.max(...valid) });
}

export function assertNoSyntheticDemFallback(mode) {
  if (mode !== "real-binary") throw new Error("Production terrain requires a real DEM binary; synthetic fallback is forbidden.");
  return true;
}

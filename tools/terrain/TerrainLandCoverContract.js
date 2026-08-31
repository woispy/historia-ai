const REQUIRED_CLASSES = Object.freeze(["desert", "forest", "steppe", "rock", "snow"]);

function finite(v) { return Number.isFinite(v); }
function assertBounds(bounds) { if (!bounds || ![bounds.minX,bounds.minY,bounds.maxX,bounds.maxY].every(finite) || bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) throw new Error("Land-cover bounds are invalid."); }

export function createAuthoritativeLandCover({ sourceId, sourceUrl, attribution, width, height, crs, bounds, resolution, classes, values, noDataValue = null } = {}) {
  if (typeof sourceId !== "string" || !sourceId) throw new Error("Land-cover sourceId is required.");
  if (typeof sourceUrl !== "string" || !/^https?:\/\//.test(sourceUrl)) throw new Error("Land-cover sourceUrl must be an HTTP(S) URL.");
  if (typeof attribution !== "string" || !attribution) throw new Error("Land-cover attribution is required.");
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 || !values || values.length !== width * height) throw new Error("Land-cover raster dimensions are invalid.");
  if (typeof crs !== "string" || !/^EPSG:\d+$/.test(crs)) throw new Error("Land-cover CRS must be an EPSG identifier.");
  assertBounds(bounds);
  if (!finite(resolution) || resolution <= 0) throw new Error("Land-cover resolution must be positive.");
  if (!Array.isArray(classes) || classes.length === 0) throw new Error("Land-cover class dictionary is required.");
  const allowed = new Set(classes);
  for (const required of REQUIRED_CLASSES) if (!allowed.has(required)) throw new Error(`Land-cover class dictionary is missing ${required}.`);
  for (const value of values) if (value !== noDataValue && (!Number.isInteger(value) || value < 0 || value >= classes.length)) throw new Error("Land-cover raster contains an invalid class index.");
  return Object.freeze({ version: 1, sourceId, sourceUrl, attribution, width, height, crs, bounds: Object.freeze({ ...bounds }), resolution, classes: Object.freeze([...classes]), values, noDataValue });
}

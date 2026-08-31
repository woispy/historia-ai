import { createDemTileId } from "./CopernicusDemSource.js";

export function requiredDemTilesForBounds({ minLatitude, maxLatitude, minLongitude, maxLongitude } = {}) {
  if (![minLatitude, maxLatitude, minLongitude, maxLongitude].every(Number.isFinite)) throw new Error("DEM coverage bounds must be finite.");
  if (minLatitude < -90 || maxLatitude > 90 || minLatitude >= maxLatitude) throw new Error("Invalid latitude bounds.");
  if (minLongitude < -180 || maxLongitude > 180 || minLongitude >= maxLongitude) throw new Error("Invalid longitude bounds.");
  const tiles = [];
  const startLat = Math.max(-90, Math.floor(minLatitude));
  const endLat = Math.min(89, Math.ceil(maxLatitude) - 1);
  const startLon = Math.max(-180, Math.floor(minLongitude));
  const endLon = Math.min(179, Math.ceil(maxLongitude) - 1);
  for (let latitude = startLat; latitude <= endLat; latitude += 1) {
    for (let longitude = startLon; longitude <= endLon; longitude += 1) tiles.push(createDemTileId(latitude, longitude));
  }
  return Object.freeze(tiles);
}

export function auditDemCoverage({ requiredTiles, availableTiles, expectedResolutionMeters, provenanceByTile = {} } = {}) {
  if (!Array.isArray(requiredTiles) || !Array.isArray(availableTiles)) throw new Error("DEM coverage audit requires tile arrays.");
  const available = new Set(availableTiles);
  const missing = requiredTiles.filter((tile) => !available.has(tile));
  const invalidResolution = Object.entries(provenanceByTile)
    .filter(([tile, provenance]) => requiredTiles.includes(tile) && provenance?.resolutionMeters !== expectedResolutionMeters)
    .map(([tile]) => tile);
  const missingProvenance = requiredTiles.filter((tile) => available.has(tile) && !provenanceByTile[tile]);
  const passed = missing.length === 0 && invalidResolution.length === 0 && missingProvenance.length === 0;
  return Object.freeze({ passed, requiredCount: requiredTiles.length, availableCount: requiredTiles.filter((tile) => available.has(tile)).length, missing, invalidResolution, missingProvenance });
}

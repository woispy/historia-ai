import {
  loadGeometryRepository,
  loadHistoricalGeometryRepository,
} from "./loader/index.js";

/**
 * Builds the runtime Geometry Repository.
 *
 * Historical scenarios are strict: a dated scenario must resolve to its
 * historical runtime geometry. Falling back to modern Admin-0 country
 * geometry would silently turn modern countries into historical provinces.
 *
 * The undated path remains available for tooling and generic map previews.
 */
export function bootstrapGeometry(date = null) {
  if (!date) {
    return loadGeometryRepository();
  }

  const historicalRepository = loadHistoricalGeometryRepository(date);
  if (!historicalRepository) {
    throw new Error(
      `Historical geometry runtime asset is missing for ${String(date)}. `
      + "Generate the historical GIS runtime assets before starting a dated scenario."
    );
  }

  return historicalRepository;
}

import {
  loadGeometryRepository,
  loadHistoricalGeometryRepository,
} from "./loader/index.js";

/**
 * Builds the runtime Geometry Repository.
 *
 * A date-specific historical geometry repository takes precedence when an
 * imported asset manifest exists. Otherwise the generated modern fallback is
 * used without changing the simulation state.
 */
export function bootstrapGeometry(date = null) {
  const historicalRepository = date
    ? loadHistoricalGeometryRepository(date)
    : null;

  return historicalRepository ?? loadGeometryRepository();
}

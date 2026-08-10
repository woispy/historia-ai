import { loadProvinceRepository } from "./loader/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province Bootstrap
 * ============================================================================
 *
 * Runtime bootstrap for generated Province Assets.
 */
export function bootstrapProvinces() {
  return loadProvinceRepository();
}

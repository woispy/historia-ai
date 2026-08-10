import {
  loadProvinceRepository,
} from "./loader/index.js";

import {
  createProvinceRepository,
  addProvince,
} from "./ProvinceRepository.js";

/**
 * ============================================================================
 * Historia AI
 * Province Bootstrap
 * ============================================================================
 *
 * Runtime bootstrap functions for Provinces.
 */

/**
 * ============================================================================
 * Creates a Province Repository from
 * generated Province Assets.
 * ============================================================================
 */

export function bootstrapProvinces() {
  return loadProvinceRepository();
}

/**
 * ============================================================================
 * Legacy Helper
 * ============================================================================
 *
 * Creates a Province Repository from an array
 * of Province Models.
 *
 * This helper is kept temporarily during the
 * Runtime migration.
 */

export function createProvinceRepositoryFromArray(
  provinces = []
) {
  let repository =
    createProvinceRepository();

  for (const province of provinces) {
    repository =
      addProvince(
        repository,
        province
      );
  }

  return repository;
}
import {
  createProvinceRepository,
  addProvince,
} from "./ProvinceRepository";

/**
 * ============================================================================
 * Province Bootstrap
 * ============================================================================
 *
 * Creates a repository from an array of Province models.
 */

export function createProvinceRepositoryFromArray(
  provinces = []
) {
  let repository = createProvinceRepository();

  for (const province of provinces) {
    repository = addProvince(
      repository,
      province
    );
  }

  return repository;
}
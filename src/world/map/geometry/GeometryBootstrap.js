import geometries from "./data";

import {
  createGeometryRepository,
  addGeometry,
} from "./GeometryRepository";

import {
  createGeometry,
} from "./GeometryFactory";

/**
 * ============================================================================
 * Geometry Bootstrap
 * ============================================================================
 */

export function bootstrapGeometry() {
  let repository =
    createGeometryRepository();

  for (const geometryData of geometries) {
    repository =
      addGeometry(
        repository,
        createGeometry(
          geometryData
        )
      );
  }

  return repository;
}
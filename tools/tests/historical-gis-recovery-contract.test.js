import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";
import {
  isAuthoritativePhysicalLandPoint,
  resolveGeometryAnchor,
} from "../historical-gis/AnatoliaPhase2DGeometryBuilderV15Adapter.js";

for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
  const source = refinement.anchor;
  const resolved = resolveGeometryAnchor(provinceId, source);

  assert.ok(Array.isArray(resolved) && resolved.length === 2, `${provinceId}: recovery must return [lon, lat]`);
  assert.ok(
    isAuthoritativePhysicalLandPoint(resolved),
    `${provinceId}: recovered geometry anchor must satisfy the production physical-land authority`,
  );

  if (!isAuthoritativePhysicalLandPoint(source)) {
    assert.notDeepEqual(
      resolved,
      source,
      `${provinceId}: an invalid historical anchor must resolve to a distinct geometry seed`,
    );
  }
}

console.log(`Historical GIS recovery contract passed for ${Object.keys(ANATOLIA_PROVINCE_REFINEMENTS).length} provinces.`);

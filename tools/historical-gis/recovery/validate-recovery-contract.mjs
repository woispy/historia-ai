import assert from "node:assert/strict";
import {
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  resolveGeometryAnchor,
} from "./physical-land-authority.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../../src/map/data/AnatoliaProvinceRefinement.js";

assert.ok(PHYSICAL_LAND_POLYGONS.length > 0, "physical-land authority must contain polygons");

for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
  assert.ok(refinement?.anchor, `missing historical anchor: ${provinceId}`);
  const source = [...refinement.anchor];
  const resolved = resolveGeometryAnchor(provinceId, source);
  assert.ok(isPhysicalLandPoint(resolved), `recovered anchor is not physical land: ${provinceId}`);
  assert.deepEqual(source, refinement.anchor, `historical anchor mutated: ${provinceId}`);
}

console.log(`Recovery contract OK: ${Object.keys(ANATOLIA_PROVINCE_REFINEMENTS).length} anchors validated against one physical-land authority.`);

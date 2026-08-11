import assert from "node:assert/strict";
import {
  ANATOLIA_ADJACENCY_HINTS,
  ANATOLIA_PROVINCE_REFINEMENTS,
  ANATOLIA_RIVER_CROSSINGS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_TERRAIN_PROFILES,
  getAnatoliaProvinceRefinement,
} from "../../src/map/data/AnatoliaProvinceRefinement.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const provinceIds = new Set(ANATOLIA_PROVINCE_METADATA.map((item) => item.id));
const refinementIds = new Set(Object.keys(ANATOLIA_PROVINCE_REFINEMENTS));

assert.equal(refinementIds.size, provinceIds.size, "Every Phase 2B province must receive Phase 2C refinement metadata");

for (const id of provinceIds) {
  const refinement = getAnatoliaProvinceRefinement(id);
  assert.ok(refinement, `${id} is missing Phase 2C refinement metadata`);
  assert.ok(Array.isArray(refinement.anchor) && refinement.anchor.length === 2, `${id} needs a WGS84 anchor`);
  assert.ok(refinement.anchor[0] >= -180 && refinement.anchor[0] <= 180, `${id} longitude out of range`);
  assert.ok(refinement.anchor[1] >= -90 && refinement.anchor[1] <= 90, `${id} latitude out of range`);
  assert.ok(ANATOLIA_TERRAIN_PROFILES[refinement.terrainClass], `${id} has an unknown terrain class`);
  assert.ok(new Set(["low", "medium", "high"]).has(refinement.settlementDensity), `${id} has invalid settlement density`);
  assert.equal(refinement.geometryMode, "source-derived-with-anchor-refinement");
  assert.ok(refinement.terrain.movementCost >= 1 && refinement.terrain.movementCost <= 4);
  assert.ok(refinement.terrain.defenseBonus >= 0 && refinement.terrain.defenseBonus <= 3);
  assert.ok(refinement.terrain.winterSeverity >= 1 && refinement.terrain.winterSeverity <= 4);
}

for (const [id, neighbors] of Object.entries(ANATOLIA_ADJACENCY_HINTS)) {
  assert.ok(provinceIds.has(id), `Adjacency hint references unknown province ${id}`);
  for (const neighbor of neighbors) {
    assert.ok(provinceIds.has(neighbor), `${id} references unknown neighbor ${neighbor}`);
    assert.ok(ANATOLIA_ADJACENCY_HINTS[neighbor]?.includes(id), `Adjacency hint must be symmetric: ${id} ↔ ${neighbor}`);
    assert.notEqual(id, neighbor, `${id} cannot be its own neighbor`);
  }
}

for (const feature of [...ANATOLIA_STRATEGIC_PASSES, ...ANATOLIA_RIVER_CROSSINGS]) {
  assert.ok(feature.id && feature.name, "Strategic feature needs a stable id and name");
  assert.ok(Array.isArray(feature.coordinate) && feature.coordinate.length === 2, `${feature.id} needs a WGS84 coordinate`);
  assert.ok(feature.coordinate[0] >= -180 && feature.coordinate[0] <= 180, `${feature.id} longitude out of range`);
  assert.ok(feature.coordinate[1] >= -90 && feature.coordinate[1] <= 90, `${feature.id} latitude out of range`);
  assert.equal(feature.provinces.length, 2, `${feature.id} must connect exactly two province anchors`);
  for (const provinceId of feature.provinces) {
    assert.ok(provinceIds.has(provinceId), `${feature.id} references unknown province ${provinceId}`);
  }
  assert.ok(new Set(["low", "medium", "high"]).has(feature.confidence), `${feature.id} has invalid confidence`);
}

assert.ok(ANATOLIA_STRATEGIC_PASSES.some((item) => item.id === "cilician-gates"), "Cilician Gates must be represented");
assert.ok(ANATOLIA_RIVER_CROSSINGS.some((item) => item.river === "Sakarya"), "Sakarya crossings must be represented");
assert.ok(ANATOLIA_RIVER_CROSSINGS.some((item) => item.river === "Kızılırmak"), "Kızılırmak crossings must be represented");

console.log(`Phase 2C Anatolia refinement tests passed: ${provinceIds.size} province refinements, ${ANATOLIA_STRATEGIC_PASSES.length} strategic passes/corridors, ${ANATOLIA_RIVER_CROSSINGS.length} river crossings.`);

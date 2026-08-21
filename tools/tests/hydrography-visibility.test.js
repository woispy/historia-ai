import assert from "node:assert/strict";
import {
  filterVisibleLakes,
  filterVisibleRivers,
  getHydrographyVisibilityProfile,
  HYDROGRAPHY_VISIBILITY_RULES,
  isImportantLake,
  isImportantRiver,
} from "../../src/map/rendering/physical/PhysicalFeatureVisibility.js";

assert.equal(getHydrographyVisibilityProfile(1.00), "world");
assert.equal(getHydrographyVisibilityProfile(1.20), "regional");
assert.equal(getHydrographyVisibilityProfile(1.85), "province");
assert.equal(getHydrographyVisibilityProfile(2.65), "city");
assert.equal(getHydrographyVisibilityProfile(3.50), "detailed");

const majorRiver = { canonicalId: "kizilirmak", rank: 99, bounds: [34, 38, 34.1, 38.1] };
const rankedMediumRiver = { canonicalId: "minor-a", rank: 2, bounds: [34, 38, 34.01, 38.01] };
const rankedMinorRiver = { canonicalId: "minor-b", rank: 4, bounds: [34, 38, 34.01, 38.01] };
const unrankedLongRiver = { canonicalId: null, bounds: [30, 36, 30.4, 36.4] };
const unrankedTinyRiver = { canonicalId: null, bounds: [30, 36, 30.01, 36.01] };

assert.equal(isImportantRiver(majorRiver, "regional"), true, "Major canonical rivers must survive every hydrography LOD.");
assert.equal(isImportantRiver(rankedMediumRiver, "regional"), false, "Rank-2 rivers must stay out of regional overview.");
assert.equal(isImportantRiver(rankedMediumRiver, "province"), true, "Rank-2 rivers should appear from province LOD.");
assert.equal(isImportantRiver(rankedMinorRiver, "city"), false, "Low-rank rivers must remain culled at city LOD.");
assert.equal(isImportantRiver(unrankedLongRiver, "regional"), true, "Large unranked river geometry may remain visible.");
assert.equal(isImportantRiver(unrankedTinyRiver, "regional"), false, "Tiny unranked drainage fragments must be culled.");
assert.equal(isImportantRiver(unrankedTinyRiver, "world"), false);

const majorLake = { name: "Van Gölü", bounds: [42.7, 37.8, 44.0, 38.8] };
const mediumLake = { name: "Small Named Lake", bounds: [30, 38, 30.2, 38.2] };
const tinyLake = { name: "Tiny Pond", bounds: [30, 38, 30.01, 38.01] };

assert.equal(isImportantLake(majorLake, "regional"), true, "Major named lakes must remain visible at regional LOD.");
assert.equal(isImportantLake(mediumLake, "regional"), true, "Medium lakes should survive regional filtering.");
assert.equal(isImportantLake(tinyLake, "regional"), false, "Tiny lakes must be culled at regional LOD.");
assert.equal(isImportantLake(tinyLake, "province"), false, "Tiny lakes must stay culled unless they become meaningful at a closer view.");
assert.equal(isImportantLake(tinyLake, "world"), false);

const rivers = [majorRiver, rankedMediumRiver, rankedMinorRiver, unrankedLongRiver, unrankedTinyRiver];
assert.equal(filterVisibleRivers(rivers, 1.30).length, 2, "Regional view must keep only major/meaningful rivers.");
assert.equal(filterVisibleRivers(rivers, 2.00).length, 3, "Province view must add rank-2 rivers without flooding the scene with tiny drainage.");
assert.equal(filterVisibleRivers(rivers, 3.00).length, 3, "City view must still omit low-rank tiny rivers.");

const lakes = [majorLake, mediumLake, tinyLake];
assert.equal(filterVisibleLakes(lakes, 1.30).length, 2, "Regional view must omit tiny lakes.");
assert.equal(filterVisibleLakes(lakes, 2.00).length, 2, "Province view must remain selective for tiny lakes.");

assert.deepEqual(HYDROGRAPHY_VISIBILITY_RULES.riverRankByLod, {
  regional: 1,
  province: 2,
  city: 3,
  detailed: 3,
});
assert.deepEqual(HYDROGRAPHY_VISIBILITY_RULES.lakeAreaByLod, {
  regional: 0.025,
  province: 0.008,
  city: 0.002,
  detailed: 0.002,
});

console.log("Hydrography visibility tests passed: LOD filtering preserves major water features while culling low-importance source geometry.");

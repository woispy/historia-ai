import assert from "node:assert/strict";

import {
  createP62RiverEvidenceAdapter,
  p62RiverEvidenceLines,
  P62_RIVER_EVIDENCE_CONTRACT,
} from "../historical-gis/P62RiverEvidenceAdapter.js";

const rivers = [
  {
    id: "river-sakarya-0",
    canonicalId: "sakarya",
    name: "Sakarya",
    nameEn: "Sakarya",
    rank: 1,
    coordinates: [[29.9, 40.2], [30.0, 40.4], [30.2, 40.6]],
    bounds: [29.9, 40.2, 30.2, 40.6],
    geometrySource: "natural-earth-10m",
  },
  {
    id: "river-firat-0",
    canonicalId: "firat",
    name: "Fırat",
    nameEn: "Euphrates",
    rank: 1,
    coordinates: [[38.0, 38.0], [38.5, 38.2], [39.0, 38.4]],
    bounds: [38.0, 38.0, 39.0, 38.4],
    geometrySource: "natural-earth-10m",
  },
];

const adapter = createP62RiverEvidenceAdapter({ rivers, toleranceKm: 15 });

assert.equal(adapter.phase, "P6.2-B");
assert.equal(adapter.authoritative, false);
assert.equal(adapter.source, "Natural Earth 10m river centerlines");
assert.equal(adapter.projection, "EPSG:4326");
assert.equal(adapter.riverCount, 2);
assert.deepEqual(adapter.canonicalRiverIds, ["firat", "sakarya"]);
assert.equal(p62RiverEvidenceLines(adapter).length, 2);
assert.equal(adapter.hasNearbyRiver([30.0, 40.4]), true);
assert.deepEqual(adapter.nearbyRiverIds([30.0, 40.4]), ["river-sakarya-0"]);
assert.equal(adapter.hasNearbyRiver([35, 35]), false);
assert.equal(adapter.nearbyRiverIds([35, 35]).length, 0);
assert.equal(P62_RIVER_EVIDENCE_CONTRACT.authoritative, false);

assert.throws(
  () => createP62RiverEvidenceAdapter({ rivers: [], toleranceKm: 15 }),
  /collection is empty/,
);
assert.throws(
  () => createP62RiverEvidenceAdapter({ rivers, projection: "EPSG:3857" }),
  /expected EPSG:4326/,
);
assert.throws(
  () => createP62RiverEvidenceAdapter({
    rivers: [{ ...rivers[0], geometrySource: "invented" }],
  }),
  /not Natural Earth 10m geometry/,
);
assert.throws(
  () => createP62RiverEvidenceAdapter({
    rivers: [{ ...rivers[0], coordinates: [[NaN, 40], [30, 40]] }],
  }),
  /non-finite coordinates/,
);

console.log("P6.2-B River Evidence Adapter: PASS");
console.log(`source=Natural Earth 10m; rivers=${adapter.riverCount}; canonical=${adapter.canonicalRiverIds.join(",")}`);
console.log("semantics=river centerlines are evidence only; province boundaries remain non-authoritative");

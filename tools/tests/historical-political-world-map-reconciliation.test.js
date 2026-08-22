import assert from "node:assert/strict";
import { createGeometryRepository, addGeometry } from "../../src/world/map/geometry/GeometryRepository.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildHistoricalWorldSourceProvinces } from "../../src/map/hooks/useWorldMap.js";

let geometryRepository = createGeometryRepository();

for (const metadata of ANATOLIA_PROVINCE_METADATA) {
  const geometryId = metadata.id === "bithynia-nicomedia"
    ? "phase2d-alias-bithynia-nicomedia"
    : metadata.id;

  geometryRepository = addGeometry(geometryRepository, {
    id: geometryId,
    identity: {
      id: geometryId,
      provinceId: metadata.id,
    },
    metadata: {
      sourceFeatureId: metadata.id,
      name: metadata.name,
      classification: "phase2d-anatolia-province-geometry",
    },
    polygons: [[
      [metadata.centroid[0], metadata.centroid[1]],
      [metadata.centroid[0] + 0.01, metadata.centroid[1]],
      [metadata.centroid[0], metadata.centroid[1] + 0.01],
    ]],
  });
}

const sourceProvinces = [{
  id: "bithynia-nicomedia",
  name: "stale source province",
  geometryId: "modern-bithynia-nicomedia",
  owner: "modern-country",
}];

const provinces = buildHistoricalWorldSourceProvinces(sourceProvinces, geometryRepository);
const byId = new Map(provinces.map((province) => [province.id, province]));

assert.equal(
  ANATOLIA_PROVINCE_METADATA.every((metadata) => byId.has(metadata.id)),
  true,
  "all 38 curated Anatolia identities must survive geometry-loader reconciliation",
);

assert.equal(
  byId.get("bithynia-nicomedia").geometryId,
  "phase2d-alias-bithynia-nicomedia",
  "curated identity must replace stale source geometry with the Phase 2D geometry",
);

assert.equal(
  byId.get("bithynia-nicomedia").owner,
  "modern-country",
  "reconciliation must not mutate gameplay ownership data while selecting geometry",
);

console.log(
  `Historical political world-map reconciliation passed: ${ANATOLIA_PROVINCE_METADATA.length} curated provinces retained and stale geometry replaced.`,
);

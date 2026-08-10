import assert from "node:assert/strict";

import { normalizeHistoricalFeature } from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
} from "../HistoricalProvinceAssetBuilder.js";

const duplicateNameFeatures = [
  {
    type: "Feature",
    properties: {
      NAME: "Thule",
      SUBJECTO: "Thule",
      PARTOF: "Thule",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[-80, 60], [-79, 60], [-79, 61], [-80, 60]]],
    },
  },
  {
    type: "Feature",
    properties: {
      NAME: "Thule",
      SUBJECTO: "Thule",
      PARTOF: "Thule",
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[-70, 60], [-69, 60], [-69, 61], [-70, 60]]],
    },
  },
];

const regions = duplicateNameFeatures.map((feature, index) =>
  normalizeHistoricalFeature(feature, index, 1300),
);

assert.equal(regions.length, 2);
assert.notEqual(regions[0].assetId, regions[1].assetId);
assert.equal(regions[0].sourceFeatureIndex, 0);
assert.equal(regions[1].sourceFeatureIndex, 1);

const province = buildHistoricalProvinceAsset(regions[0]);
const geometry = buildHistoricalGeometryAsset(regions[0]);

assert.equal(province.identity.id, geometry.identity.id);
assert.equal(province.references.geometryId, geometry.identity.id);
assert.equal(province.historical.sourceFeatureIndex, 0);
assert.equal(geometry.metadata.sourceFeatureIndex, 0);

console.log("Historical GIS 1300 identity tests passed.");

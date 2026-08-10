import assert from "node:assert/strict";
import { normalizeHistoricalFeature } from "../HistoricalGeometryImporter.js";
import { buildHistoricalGeometryAsset, buildHistoricalProvinceAsset } from "../HistoricalProvinceAssetBuilder.js";
import { normalizeHistoricalCountryName, resolveCanonicalHistoricalCountryId, resolveHistoricalCountryId } from "../../../src/world/historical/HistoricalCountryResolver.js";

const duplicateNameFeatures = [
  { type: "Feature", properties: { NAME: "Thule", SUBJECTO: "Thule", PARTOF: "Thule" }, geometry: { type: "Polygon", coordinates: [[[-80, 60], [-79, 60], [-79, 61], [-80, 60]]] } },
  { type: "Feature", properties: { NAME: "Thule", SUBJECTO: "Thule", PARTOF: "Thule" }, geometry: { type: "Polygon", coordinates: [[[-70, 60], [-69, 60], [-69, 61], [-70, 60]]] } },
];

const regions = duplicateNameFeatures.map((feature, index) => normalizeHistoricalFeature(feature, index, 1300));
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

assert.equal(normalizeHistoricalCountryName("Đại Việt"), "dai viet");
assert.equal(resolveCanonicalHistoricalCountryId("Byzantine Empire"), "byzantium");
assert.equal(resolveCanonicalHistoricalCountryId("Mamluke Sultanate"), "mamluks");
assert.equal(resolveCanonicalHistoricalCountryId("Great Khanate"), "yuan");
assert.equal(resolveCanonicalHistoricalCountryId("Unknown polity"), null);
assert.equal(resolveHistoricalCountryId("Test Realm", { test_kingdom: { id: "test_kingdom", name: "Test Kingdom", aliases: ["Test Realm"] } }), "test_kingdom");

const unsupported = normalizeHistoricalFeature({ type: "Feature", properties: { NAME: "Invalid" }, geometry: { type: "Point", coordinates: [0, 0] } }, 10, 1300);
assert.equal(unsupported, null);
console.log("Historical GIS 1300 identity and country resolver tests passed.");

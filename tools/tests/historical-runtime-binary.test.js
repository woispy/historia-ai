import assert from "node:assert/strict";
import {
  decodeHistoricalRuntimeRegion,
  encodeHistoricalRuntimeRegion,
  HISTORICAL_RUNTIME_BINARY,
} from "../../src/world/map/binary/HistoricalRuntimeBinary.js";

const fixture = {
  schemaVersion: 3,
  assetType: "historical-runtime-region",
  historicalDate: "1300-01-01",
  regionId: "test-region",
  source: { provider: "fixture", dataset: "test", projection: "EPSG:4326" },
  counts: { provinces: 1, geometries: 1, polygons: 2 },
  provinces: [{
    header: { assetType: "province", assetVersion: 4, historicalDate: "1300-01-01" },
    identity: { id: "province-1", name: "Test Province" },
    references: { geometryId: "province-1", countryId: null, capitalCityId: null },
    ownership: { countryId: "country-1", ownerId: "country-1" },
    historical: {
      sourceFeatureId: "source-1",
      sourceFeatureIndex: 4,
      sourceName: "Test Province",
      subject: "test-subject",
      partOf: "test-region",
      borderPrecision: 1,
      classification: "phase2d-anatolia-province-geometry",
      precision: "curated",
      anchor: { longitude: 29.1, latitude: 40.2 },
      inferenceNotice: "fixture",
    },
    administration: { governorId: null },
    population: { total: 123 },
    economy: { development: 4, wealth: 7 },
    military: { supplyLimit: 9 },
    culture: { primaryCulture: null },
    religion: { primaryReligion: null },
  }],
  geometries: [{
    header: { assetType: "geometry", assetVersion: 4, historicalDate: "1300-01-01" },
    identity: { id: "province-1", provinceId: "province-1" },
    metadata: {
      sourceFeatureId: "source-1",
      sourceFeatureIndex: 4,
      name: "Test Province",
      subject: "test-subject",
      partOf: "test-region",
      borderPrecision: 1,
    },
    polygons: [
      [[29, 40], [30, 40], [30, 41]],
      [[29, 40], [30, 41], [29, 41]],
    ],
  }],
};

const first = encodeHistoricalRuntimeRegion(fixture);
const second = encodeHistoricalRuntimeRegion(fixture);
assert.equal(first.byteLength, second.byteLength);
assert.deepEqual([...first], [...second], "Binary encoding must be deterministic.");
assert.equal(new TextDecoder().decode(first.slice(0, 4)), HISTORICAL_RUNTIME_BINARY.MAGIC);

const decoded = decodeHistoricalRuntimeRegion(first, { source: fixture.source });
assert.equal(decoded.regionId, fixture.regionId);
assert.equal(decoded.historicalDate, fixture.historicalDate);
assert.deepEqual(decoded.source, fixture.source);
assert.equal(decoded.counts.provinces, 1);
assert.equal(decoded.counts.geometries, 1);
assert.equal(decoded.counts.polygons, 2);
assert.deepEqual(decoded.provinces[0].identity, fixture.provinces[0].identity);
assert.deepEqual(decoded.provinces[0].historical.anchor, fixture.provinces[0].historical.anchor);
assert.deepEqual(decoded.geometries[0].polygons, fixture.geometries[0].polygons);
assert.equal(decoded.geometries[0].metadata.sourceFeatureIndex, 4);

assert.throws(
  () => decodeHistoricalRuntimeRegion(first.slice(0, first.length - 1)),
  /truncated|trailing bytes/,
);
assert.throws(
  () => decodeHistoricalRuntimeRegion(new Uint8Array([0, 1, 2, 3])),
  /Invalid historical binary map magic/,
);

console.log(`historical-runtime-binary.test.js: deterministic HMAP v${HISTORICAL_RUNTIME_BINARY.VERSION} encode/decode, metadata and corruption guards validated`);

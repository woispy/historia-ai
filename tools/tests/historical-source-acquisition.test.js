import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  acquireHistoricalSource,
  filterHistoricalFeatures,
  readTemporalInterval,
  sha256Text,
  writeHistoricalSourceEvidence,
} from "../historical-gis/HistoricalSourceAcquisition.js";

const square = (offset = 0) => [
  [offset, 0],
  [offset + 1, 0],
  [offset + 1, 1],
  [offset, 1],
  [offset, 0],
];

const source = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "active-1326",
      properties: { Name: "Active", FromYear: 1325, ToYear: 1327, custom: "kept" },
      geometry: { type: "Polygon", coordinates: [square()] },
    },
    {
      type: "Feature",
      id: "future",
      properties: { Name: "Future", FromYear: 1327, ToYear: 1330 },
      geometry: { type: "Polygon", coordinates: [square(2)] },
    },
    {
      type: "Feature",
      id: "past",
      properties: { Name: "Past", FromYear: 1300, ToYear: 1325 },
      geometry: { type: "Polygon", coordinates: [square(4)] },
    },
    {
      type: "Feature",
      id: "timeless",
      properties: { Name: "Timeless" },
      geometry: { type: "Polygon", coordinates: [square(6)] },
    },
    {
      type: "Feature",
      id: "invalid",
      properties: { Name: "Invalid", FromYear: 1330 },
      geometry: { type: "Polygon", coordinates: [square(8)] },
    },
  ],
};

const defaultFiltered = filterHistoricalFeatures(source, 1326);
assert.equal(defaultFiltered.retained.length, 1);
assert.equal(defaultFiltered.retained[0].feature.id, "active-1326");
assert.equal(defaultFiltered.excluded.length, 4);
assert.equal(defaultFiltered.warnings.length, 0);

const withTimeless = filterHistoricalFeatures(source, 1326, {
  allowTimeless: true,
});
assert.equal(withTimeless.retained.length, 2);
assert.equal(withTimeless.warnings.length, 1);
assert.equal(withTimeless.retained[1].feature.id, "timeless");

assert.deepEqual(readTemporalInterval(source.features[0]), {
  status: "dated",
  fromYear: 1325,
  toYear: 1327,
});
assert.deepEqual(readTemporalInterval(source.features[3]), {
  status: "timeless",
  fromYear: null,
  toYear: null,
});

const hashA = sha256Text(JSON.stringify(source));
const hashB = sha256Text(JSON.stringify(source));
assert.equal(hashA, hashB);
assert.equal(hashA.length, 64);

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "historia-source-acquisition-"));
const inputPath = path.join(tempDir, "source.geojson");
const outputPath = path.join(tempDir, "evidence.geojson");
const manifestPath = path.join(tempDir, "evidence.manifest.json");
const inputText = `${JSON.stringify(source)}\n`;
await fs.writeFile(inputPath, inputText, "utf8");

const result = await acquireHistoricalSource({
  inputPath,
  sourceId: "test-source-v1",
  provider: "Historia Test",
  dataset: "Synthetic Historical Source",
  version: "v1",
  targetYear: 1326,
  scenarioDate: "1326-04-07",
  projection: "EPSG:4326",
  license: "test-only",
  acquiredAt: "2026-09-15T00:00:00Z",
  expectedInputSha256: sha256Text(inputText),
});

assert.equal(result.report.source.sourceId, "test-source-v1");
assert.equal(result.report.source.inputSha256, sha256Text(inputText));
assert.equal(result.report.source.inputSha256Verification, "passed");
assert.equal(result.report.source.authorityStatus, "evidence-only");
assert.equal(result.report.counts.inputFeatures, 5);
assert.equal(result.report.counts.retainedFeatures, 1);
assert.equal(result.evidenceGeoJson.features.length, 1);
assert.equal(result.evidenceGeoJson.features[0].properties.custom, "kept");
assert.equal(result.report.promotion.status, "not-promoted");

assert.throws(
  () => acquireHistoricalSource({
    inputPath,
    sourceId: "test-source-v1",
    provider: "Historia Test",
    dataset: "Synthetic Historical Source",
    targetYear: 1326,
    expectedInputSha256: "0".repeat(64),
  }),
  /SHA-256 mismatch/,
);

assert.throws(
  () => acquireHistoricalSource({
    inputPath,
    sourceId: "test-source-v1",
    provider: "Historia Test",
    dataset: "Synthetic Historical Source",
    targetYear: 1326,
    expectedInputSha256: "not-a-sha256",
  }),
  /64-character hexadecimal SHA-256/,
);

await writeHistoricalSourceEvidence({
  outputPath,
  manifestPath,
  evidenceGeoJson: result.evidenceGeoJson,
  report: result.report,
});

assert.equal((await fs.stat(outputPath)).isFile(), true);
assert.equal((await fs.stat(manifestPath)).isFile(), true);

await fs.rm(tempDir, { recursive: true, force: true });

console.log("Historical source acquisition contract tests passed.");
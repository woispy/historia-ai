import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { collectWorldLandPolygons } from "../../src/map/physical/WorldLandMask.js";
import {
  auditHistoricalPoliticalCoverage,
  pointInPolygon,
} from "../../src/world/map/historical/HistoricalPoliticalCoverageInvariants.js";
import { decodeHistoricalRuntimeRegion } from "../../src/world/map/binary/HistoricalRuntimeBinary.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("historical political coverage detects land gaps", () => {
  const landPolygons = [
    [[0, 0], [10, 0], [10, 10], [0, 10]],
  ];
  const politicalEntries = [
    { geometry: { polygons: [[[0, 0], [5, 0], [5, 10], [0, 10]]] } },
  ];

  const audit = auditHistoricalPoliticalCoverage({ landPolygons, politicalEntries });
  assert.equal(audit.landCoveragePass, false);
  assert.equal(audit.pass, false);
  assert.ok(audit.uncoveredLandSamples.length > 0);
});

test("historical political coverage detects sea leaks", () => {
  const landPolygons = [
    [[0, 0], [10, 0], [10, 10], [0, 10]],
  ];
  const politicalEntries = [
    { geometry: { polygons: [[[-1, -1], [11, -1], [11, 11], [-1, 11]]] } },
  ];

  const audit = auditHistoricalPoliticalCoverage({ landPolygons, politicalEntries });
  assert.equal(audit.seaLeakPass, false);
  assert.equal(audit.pass, false);
  assert.ok(audit.politicalSamplesOutsideLand.length > 0);
});

test("historical political coverage passes when land and political extents coincide", () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const audit = auditHistoricalPoliticalCoverage({
    landPolygons: [square],
    politicalEntries: [{ geometry: { polygons: [square] } }],
  });

  assert.equal(audit.pass, true);
  assert.equal(audit.landCoveragePass, true);
  assert.equal(audit.seaLeakPass, true);
});

test("point-in-polygon treats coastline points as covered", () => {
  assert.equal(pointInPolygon([0, 5], [[0, 0], [10, 0], [10, 10], [0, 10]]), true);
});

test("generated 1300 political geometry is presented across all physical land and clipped at the coast", () => {
  const geometryDirectory = resolve(root, "src/world/map/assets/geometry");
  const geometryFiles = readdirSync(geometryDirectory)
    .filter((fileName) => /^geometry_country_.*\.json$/.test(fileName));
  const generatedGeometryModules = Object.fromEntries(
    geometryFiles.map((fileName) => [
      fileName,
      { default: JSON.parse(readFileSync(resolve(geometryDirectory, fileName), "utf8")) },
    ]),
  );
  const landPolygons = collectWorldLandPolygons(generatedGeometryModules);

  const manifestPath = resolve(root, "src/world/map/assets/historical/1300/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const politicalEntries = manifest.regions.flatMap((region) => {
    const bytes = readFileSync(resolve(root, "src/world/map/assets/historical/1300", region.file));
    return decodeHistoricalRuntimeRegion(bytes, { source: manifest.source }).geometries ?? [];
  });

  assert.ok(landPolygons.length > 0, "Generated physical land geometry must exist before the coverage audit.");
  assert.ok(politicalEntries.length > 0, "Generated 1300 political geometry must exist before the coverage audit.");

  const audit = auditHistoricalPoliticalCoverage({
    landPolygons,
    politicalEntries,
    neutralLandFallback: true,
    exactLandClip: true,
  });

  assert.equal(audit.pass, true, audit.pass
    ? ""
    : `1300 political presentation failed: ${audit.uncoveredLandSamples.length} uncovered land samples, `
      + `${audit.politicalSamplesOutsideLand.length} political samples outside physical land.`);
  assert.equal(audit.landCoveragePass, true);
  assert.equal(audit.seaLeakPass, true);
});

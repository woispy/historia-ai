import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

function runNode(script, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const root = path.resolve(import.meta.dirname, "../..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "historia-cliopatria-"));

try {
  const inputPath = path.join(tempRoot, "cliopatria.geojson");
  const rulesPath = path.join(tempRoot, "entity-reconciliation.json");
  const manifestPath = path.join(tempRoot, "acquisition-manifest.json");
  const outputPath = path.join(tempRoot, "candidates.json");

  await fs.writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "ottoman-1",
        properties: {
          Name: "Ottoman Beylik",
          FromYear: 1299,
          ToYear: 1330,
          Type: "POLITY",
          Wikidata: "Q12560",
          SeshatID: "ottoman",
          Area: 1234,
        },
        geometry: { type: "Polygon", coordinates: [[[29, 40], [30, 40], [30, 41], [29, 40]]] },
      },
      {
        type: "Feature",
        id: "future-1",
        properties: {
          Name: "Future State",
          FromYear: 1327,
          ToYear: 1330,
          Type: "POLITY",
        },
        geometry: null,
      },
      {
        type: "Feature",
        id: "relation-1",
        properties: {
          Name: "Ottoman Relation",
          FromYear: 1299,
          ToYear: 1330,
          Type: "RELATION",
        },
        geometry: null,
      },
    ],
  }), "utf8");

  await fs.writeFile(rulesPath, JSON.stringify({
    schemaVersion: 1,
    scenarioDate: "1326-04-07",
    records: [
      {
        entityId: "ottoman-beylik",
        sourceMatches: [{
          sourceId: "cliopatria-v0.2.0",
          wikidataId: "Q12560",
          names: ["Ottoman Beylik"],
          matchStatus: "reviewed",
        }],
        confidence: 0.95,
      },
    ],
  }), "utf8");

  await fs.writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    id: "historical_gis_1326_acquisition_manifest",
    scenarioDate: "1326-04-07",
    sources: [{
      id: "cliopatria-v0.2.0",
      provider: "Seshat Global History Databank",
      dataset: "Cliopatria",
      version: "v0.2.0",
      releaseDate: "2026-05-16",
      archive: { filename: "cliopatria-v0.2.0.zip" },
      url: "https://github.com/Seshat-Global-History-Databank/cliopatria/releases/tag/v0.2.0",
      role: "global-political-entity-candidate-evidence",
      projection: "EPSG:4326",
      licenseReview: "required-before-redistribution-or-embedding",
    }],
  }), "utf8");

  const cliArgs = [
    "--year", "1326",
    "--date", "1326-04-07",
    "--input", inputPath,
    "--rules", rulesPath,
    "--manifest", manifestPath,
    "--output", outputPath,
  ];

  const result = await runNode(
    "tools/historical-gis/cli/extract-cliopatria-candidates.js",
    cliArgs,
    root,
  );

  assert.equal(result.code, 0, result.stderr || result.stdout);
  const artifact = JSON.parse(await fs.readFile(outputPath, "utf8"));

  assert.equal(artifact.authorityStatus, "evidence-only");
  assert.equal(artifact.summary.candidateCount, 1);
  assert.equal(artifact.summary.reconciledCount, 1);
  assert.equal(artifact.summary.unresolvedCount, 0);
  assert.equal(artifact.summary.ambiguousCount, 0);
  assert.equal(artifact.candidates[0].sourceFeatureId, "ottoman-1");
  assert.equal(artifact.candidates[0].geometry.type, "Polygon");
  assert.equal(artifact.entityReconciliation.reconciled[0].canonicalEntityId, "ottoman-beylik");
  assert.equal(artifact.promotion.status, "not-promoted");

  const originalManifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  await fs.writeFile(manifestPath, JSON.stringify({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], id: "wrong-source-id" }],
  }), "utf8");
  const wrongSource = await runNode(
    "tools/historical-gis/cli/extract-cliopatria-candidates.js",
    cliArgs,
    root,
  );
  assert.notEqual(wrongSource.code, 0);
  assert.match(wrongSource.stderr, /cliopatria-v0\.2\.0/);

  await fs.writeFile(manifestPath, JSON.stringify(originalManifest), "utf8");
  await fs.writeFile(rulesPath, JSON.stringify({
    schemaVersion: 1,
    scenarioDate: "1326-04-08",
    records: originalManifest.sources.map(() => ({ entityId: "unused", sourceMatches: [] })),
  }), "utf8");
  const mismatchedRulesDate = await runNode(
    "tools/historical-gis/cli/extract-cliopatria-candidates.js",
    cliArgs,
    root,
  );
  assert.notEqual(mismatchedRulesDate.code, 0);
  assert.match(mismatchedRulesDate.stderr, /Entity reconciliation scenarioDate/);

  await fs.writeFile(rulesPath, JSON.stringify({
    schemaVersion: 1,
    scenarioDate: "1326-04-07",
  }), "utf8");
  const missingRecords = await runNode(
    "tools/historical-gis/cli/extract-cliopatria-candidates.js",
    cliArgs,
    root,
  );
  assert.notEqual(missingRecords.code, 0);
  assert.match(missingRecords.stderr, /records array/);

  await fs.writeFile(rulesPath, JSON.stringify({
    schemaVersion: 1,
    scenarioDate: "1326-04-07",
    records: [],
  }), "utf8");
  const unresolved = await runNode(
    "tools/historical-gis/cli/extract-cliopatria-candidates.js",
    cliArgs,
    root,
  );
  assert.equal(unresolved.code, 0, unresolved.stderr || unresolved.stdout);
  const unresolvedArtifact = JSON.parse(await fs.readFile(outputPath, "utf8"));
  assert.equal(unresolvedArtifact.summary.reconciledCount, 0);
  assert.equal(unresolvedArtifact.summary.unresolvedCount, 1);
  assert.equal(unresolvedArtifact.promotion.status, "not-promoted");

  console.log("Cliopatria candidate pipeline tests passed.");
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

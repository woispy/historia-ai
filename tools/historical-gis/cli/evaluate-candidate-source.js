/**
 * Historia AI — Candidate Source Evaluation CLI
 *
 * Evidence-based evaluation of a candidate historical GIS source for the
 * anatolia-1300 province boundary authority.
 *
 * Usage:
 *   node tools/historical-gis/cli/evaluate-candidate-source.js <fixtureDir> <urlOrLocalPath> <sourceId> [licenseReview] [--update-provenance]
 *
 *  - Downloads the source (http/https) or reads a local file.
 *  - Filters features to the Anatolia bbox and reports granularity evidence.
 *  - Writes an evaluation report to <fixtureDir>/../candidate-reports/<sourceId>.json
 *    (outside the fixture, documentation only).
 *  - With --update-provenance, registers the candidate in the fixture's
 *    provenance.json WITHOUT changing requiredSource or promotion gates.
 *
 * Fail-closed: usableAsProvinceBoundary stays false until human review.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateCandidateSource, updateProvenanceCandidate } from "../province/CandidateSourceEvaluator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const args = process.argv.slice(2).filter((arg) => arg !== "--update-provenance");
const updateProvenance = process.argv.includes("--update-provenance");

const fixtureDirectory = args[0] ? path.resolve(root, args[0]) : path.join(root, "tools/tests/fixtures/political-geography/anatolia-1300");
const location = args[1] ?? null;
const sourceId = args[2] ?? null;
const licenseReview = args[3] ?? "pending";

if (!location || !sourceId) {
  console.error("Usage: node tools/historical-gis/cli/evaluate-candidate-source.js [fixtureDirectory] <urlOrLocalPath> <sourceId> [licenseReview] [--update-provenance]");
  process.exitCode = 1;
} else {
  const isUrl = /^https?:\/\//i.test(location);
  let text;
  if (isUrl) {
    console.log(`Downloading candidate source: ${location}`);
    const response = await fetch(location);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    text = await response.text();
  } else {
    const localPath = path.resolve(root, location);
    console.log(`Reading local candidate source: ${localPath}`);
    text = await fs.readFile(localPath, "utf8");
  }

  const geojson = JSON.parse(text);
  const evaluation = evaluateCandidateSource({ geojson });

  console.log(`\nCandidate evaluation [${sourceId}] (licenseReview: ${licenseReview}):`);
  console.log(`  Total features in source: ${evaluation.featureCount}`);
  console.log(`  Anatolia bbox candidates: ${evaluation.anatoliaCandidateCount}`);
  console.log(`  Vertices in bbox: ${evaluation.hints.totalVerticesInBbox}`);
  console.log(`  Avg vertices/candidate: ${evaluation.hints.averageVerticesPerCandidate}`);
  console.log(`  Named candidates: ${evaluation.hints.namedCandidateCount}`);
  console.log(`  Geometry types: ${evaluation.hints.geometryTypes.join(", ") || "none"}`);
  for (const candidate of evaluation.candidates.slice(0, 10)) {
    console.log(`  - ${candidate.name ?? "(unnamed)"}: ${candidate.geometryType}, ${candidate.coordinateCount} coords`);
  }
  console.log(`  Verdict: ${evaluation.verdict.usableAsProvinceBoundary} — ${evaluation.verdict.reason}`);

  const reportDirectory = path.join(root, "data", "gis", "candidate-reports");
  await fs.mkdir(reportDirectory, { recursive: true });
  const reportPath = path.join(reportDirectory, `${sourceId}.json`);
  await fs.writeFile(reportPath, JSON.stringify({ sourceId, evaluatedAt: new Date().toISOString(), licenseReview, ...evaluation }, null, 2), "utf8");
  console.log(`\nEvaluation report written: ${reportPath}`);

  if (updateProvenance) {
    const provenancePath = path.join(fixtureDirectory, "provenance.json");
    const provenance = JSON.parse(await fs.readFile(provenancePath, "utf8"));
    const updated = updateProvenanceCandidate({ provenance, sourceId, url: isUrl ? location : null, licenseReview, evaluation });
    await fs.writeFile(provenancePath, JSON.stringify(updated, null, 2), "utf8");
    console.log(`Provenance candidate registered: ${sourceId} (requiredSource status untouched: ${updated.requiredSource?.status}).`);
  } else {
    console.log("Provenance NOT updated (pass --update-provenance to register the candidate — a deliberate, reviewed step).");
  }
}

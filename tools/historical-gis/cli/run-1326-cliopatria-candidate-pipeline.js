import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const SCENARIO_DATE = "1326-04-07";

function readArg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}

function requireArg(name) {
  const value = readArg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}.`));
    });
  });
}

const input = readArg("--input") ? path.resolve(process.cwd(), readArg("--input")) : null;
const extractionInput = readArg("--extraction-input") ? path.resolve(process.cwd(), readArg("--extraction-input")) : null;
const anchors = requireArg("--anchors");
if (!input && !extractionInput) throw new Error("--input <geojson> or --extraction-input <record> is required.");
const outputDir = path.resolve(
  process.cwd(),
  readArg("--output-dir", "data/build/gis/1326"),
);

await fs.mkdir(outputDir, { recursive: true });

const candidateOutput = path.join(outputDir, "cliopatria-1326-candidates.json");
const reconciliationOutput = path.join(outputDir, "cliopatria-entity-reconciliation.json");
const screeningOutput = path.join(outputDir, "cliopatria-candidate-surface-screening.json");

await run("tools/historical-gis/cli/extract-1326-cliopatria-candidates.js", [
  ...(extractionInput ? ["--extraction-input", extractionInput] : ["--input", input]),
  "--output", candidateOutput,
]);

await run("tools/historical-gis/cli/validate-1326-cliopatria-candidates.js", [
  "--input", candidateOutput,
]);

await run("tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js", [
  "--input", candidateOutput,
  "--output", reconciliationOutput,
]);

await run("tools/historical-gis/cli/screen-1326-political-candidate-surface.js", [
  "--input", candidateOutput,
  "--anchors", anchors,
  "--output", screeningOutput,
]);

const [candidates, reconciliation, screening] = await Promise.all([
  fs.readFile(candidateOutput, "utf8").then(JSON.parse),
  fs.readFile(reconciliationOutput, "utf8").then(JSON.parse),
  fs.readFile(screeningOutput, "utf8").then(JSON.parse),
]);

if (candidates.scenarioDate !== SCENARIO_DATE) throw new Error("Candidate report date drifted.");
if (reconciliation.scenarioDate !== SCENARIO_DATE) throw new Error("Reconciliation report date drifted.");
if (screening.scenarioDate !== SCENARIO_DATE) throw new Error("Screening report date drifted.");
if (screening.promotion !== "BLOCKED") throw new Error("Candidate surface must remain blocked from promotion.");
if (candidates.source.extractedGeojsonSha256 !== reconciliation.sourceProvenance?.extractedGeojsonSha256) throw new Error("Candidate/reconciliation extraction provenance mismatch.");
if (candidates.source.extractedGeojsonSha256 !== screening.provenance?.extractedGeojsonSha256) throw new Error("Candidate/screening extraction provenance mismatch.");
if (screening.screening?.notGeometryAuthority !== true) {
  throw new Error("Candidate surface must remain explicitly non-authoritative.");
}

console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  stages: {
    extraction: {
      candidates: candidates.counts.candidates,
      output: candidateOutput.replace(/\\/g, "/"),
    },
    reconciliation: {
      matched: reconciliation.counts.matched,
      unmatched: reconciliation.counts.unmatched,
      ambiguous: reconciliation.counts.ambiguous,
      output: reconciliationOutput.replace(/\\/g, "/"),
    },
    candidateSurface: {
      screenedCandidates: screening.counts.screenedCandidates,
      rejectedCandidates: screening.counts.rejectedCandidates,
      output: screeningOutput.replace(/\\/g, "/"),
    },
  },
  promotion: "BLOCKED",
}, null, 2));

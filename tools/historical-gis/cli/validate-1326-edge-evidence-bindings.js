import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const EDGE_ID = /^[A-Za-z0-9._:-]+$/;

const input = process.argv.indexOf("--input");
if (input < 0 || !process.argv[input + 1]) throw new Error("--input <edge-evidence-bindings.json> is required.");
const report = JSON.parse(await fs.readFile(path.resolve(process.cwd(), process.argv[input + 1]), "utf8"));

if (report.schemaVersion !== 1) throw new Error("Binding schemaVersion must be 1.");
if (report.scenarioDate !== SCENARIO_DATE) throw new Error("Binding scenario date mismatch.");
if (report.authorityStatus !== "bridge-reference-only") throw new Error("Binding authority status must be bridge-reference-only.");
if (report.promotion !== "BLOCKED") throw new Error("Binding promotion must remain BLOCKED.");
for (const key of ["automaticReviewMatching","geometryGeneration","controllerInference","canonicalPromotion"]) {
  if (report.policy?.[key] !== false) throw new Error(`Binding policy ${key} must be false.`);
}
if (!Array.isArray(report.reviewBindings)) throw new Error("reviewBindings[] is required.");

const reviews = new Set();
for (const binding of report.reviewBindings) {
  if (!binding?.reviewId || reviews.has(binding.reviewId)) throw new Error(`Duplicate/missing reviewId: ${binding?.reviewId}`);
  reviews.add(binding.reviewId);
  if (!Array.isArray(binding.edgeEvidenceIds) || binding.edgeEvidenceIds.length === 0) throw new Error(`Empty edgeEvidenceIds: ${binding.reviewId}`);
  const edges = new Set();
  for (const id of binding.edgeEvidenceIds) {
    if (!EDGE_ID.test(id) || edges.has(id)) throw new Error(`Invalid/duplicate edge evidence ID: ${id}`);
    edges.add(id);
  }
}
console.log(JSON.stringify({
  scenarioDate: report.scenarioDate,
  bindingRecords: report.reviewBindings.length,
  boundEdgeReferences: report.reviewBindings.reduce((n, x) => n + x.edgeEvidenceIds.length, 0),
  authorityStatus: report.authorityStatus,
  promotion: report.promotion,
  status: "PASS"
}, null, 2));

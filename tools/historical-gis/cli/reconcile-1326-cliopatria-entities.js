import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";
const REQUIRED_ENTITIES = [
  { entityId: "ottoman-beylik", aliases: ["ottoman", "ottoman beylik", "osmanli", "osmanlı"] },
  { entityId: "byzantine-empire", aliases: ["byzantine", "byzantine empire", "bizans", "bizans imparatorluğu"] },
  { entityId: "esrefogullari", aliases: ["esrefogullari", "eşrefoğulları", "eşref"] },
  { entityId: "ilkhanate", aliases: ["ilkhanate", "il-khanate", "ilhanate", "ilhanlı", "ilhanlilar", "ilhanlılar"] },
  { entityId: "karasi", aliases: ["karasi", "karasi beylik", "karesi", "karesi beyligi", "karesi beyliği"] },
  { entityId: "saruhan", aliases: ["saruhan", "saruhan beylik", "saruhan beyliği"] },
  { entityId: "aydin", aliases: ["aydin", "aydın", "aydinoğulları", "aydinoğullari"] },
  { entityId: "alaye", aliases: ["alaye", "alâiye", "alâiye beyliği", "ala iye"] },
];

function readArg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1] ?? null;
}
const input = readArg("--input");
if (!input) throw new Error("--input <1326 candidate JSON> is required.");
const matrixPath = path.resolve("data/gis/1326/evidence-matrix.json");
const candidates = JSON.parse(await fs.readFile(path.resolve(process.cwd(), input), "utf8"));
const matrix = JSON.parse(await fs.readFile(matrixPath, "utf8"));

if (candidates.scenarioDate !== SCENARIO_DATE) throw new Error("Candidate scenario date mismatch.");
if (candidates.source?.sourceId !== SOURCE_ID) throw new Error("Candidate source identity mismatch.");
if (candidates.source?.extractedGeojsonSha256 !== candidates.source?.inputSha256) throw new Error("Candidate extracted/input SHA-256 provenance drifted.");
if (!/^[0-9a-f]{64}$/.test(candidates.candidatePacketSha256 ?? "")) throw new Error("Candidate packet SHA-256 is required.");
if (!Array.isArray(candidates.candidates)) throw new Error("Candidate report must contain candidates[].");
const recomputedCandidatePacketSha256 = crypto.createHash("sha256").update(JSON.stringify(candidates.candidates)).digest("hex");
if (recomputedCandidatePacketSha256 !== candidates.candidatePacketSha256) {
  throw new Error("Candidate packet SHA-256 does not match candidates[].");
}
const seenFeatureIndexes = new Set();
for (const candidate of candidates.candidates) {
  if (!Number.isInteger(candidate.sourceFeatureIndex) || candidate.sourceFeatureIndex < 0) {
    throw new Error("Candidate sourceFeatureIndex must be a non-negative integer.");
  }
  if (seenFeatureIndexes.has(candidate.sourceFeatureIndex)) {
    throw new Error("Duplicate candidate sourceFeatureIndex detected.");
  }
  seenFeatureIndexes.add(candidate.sourceFeatureIndex);
}
if (!/^[0-9a-f]{64}$/.test(candidates.source?.extractedGeojsonSha256 ?? "")) {
  throw new Error("Candidate report must carry the verified extracted GeoJSON SHA-256.");
}
if (matrix.scenarioDate !== SCENARIO_DATE || matrix.authorityStatus !== "evidence-only") {
  throw new Error("1326 evidence matrix is not in the expected evidence-only state.");
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const byName = new Map();
for (const candidate of candidates.candidates ?? []) {
  const key = normalize(candidate.name);
  if (!key) continue;
  const bucket = byName.get(key) ?? [];
  bucket.push(candidate);
  byName.set(key, bucket);
}

const results = REQUIRED_ENTITIES.map((entity) => {
  const matches = [];
  for (const alias of entity.aliases) {
    const bucket = byName.get(normalize(alias)) ?? [];
    for (const candidate of bucket) if (!matches.some(x => x.sourceFeatureIndex === candidate.sourceFeatureIndex)) matches.push(candidate);
  }
  return {
    entityId: entity.entityId,
    status: matches.length === 0 ? "unmatched" : matches.length === 1 ? "single-candidate" : "ambiguous",
    candidateCount: matches.length,
    candidates: matches.map(candidate => ({
      sourceFeatureIndex: candidate.sourceFeatureIndex,
      sourceFeatureId: candidate.sourceFeatureId,
      name: candidate.name,
      wikidataId: candidate.wikidataId,
      seshatId: candidate.seshatId,
      fromYear: candidate.fromYear,
      toYear: candidate.toYear,
      geometryAuthorityStatus: candidate.geometryAuthorityStatus,
      candidateRecordSha256: crypto.createHash("sha256").update(JSON.stringify(candidate)).digest("hex"),
    })),
    autoPromotion: false,
  };
});

const report = {
  schemaVersion: 1,
  scenarioDate: SCENARIO_DATE,
  sourceId: SOURCE_ID,
  candidatePacketSha256: candidates.candidatePacketSha256,
  sourceProvenance: {
    sourceTag: candidates.source.sourceTag,
    immutableReference: candidates.source.immutableReference,
    extractedGeojsonSha256: candidates.source.extractedGeojsonSha256,
    inputSha256: candidates.source.inputSha256
  },
  reconciliationPolicy: {
    exactExternalId: "candidate-only",
    exactName: "candidate-only",
    aliasMatch: "candidate-only",
    ambiguity: "manual-review-required",
    geometryAuthority: "never-derived-from-name-match-alone",
  },
  counts: {
    requiredEntities: results.length,
    matched: results.filter(x => x.candidateCount > 0).length,
    unmatched: results.filter(x => x.status === "unmatched").length,
    ambiguous: results.filter(x => x.status === "ambiguous").length,
  },
  results,
  promotion: "BLOCKED",
};
const output = path.resolve(process.cwd(), readArg("--output") ?? "data/build/gis/1326/cliopatria-entity-reconciliation.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\\n`);
console.log(JSON.stringify({ scenarioDate: SCENARIO_DATE, ...report.counts, output, promotion: "BLOCKED" }, null, 2));

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_DATE = "1326-04-07";
const SCENARIO_YEAR = 1326;

function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1] ?? fallback;
}

function requireInput() {
  const value = readArg("--input");
  if (!value) throw new Error("--input <geojson> is required.");
  return path.resolve(process.cwd(), value);
}

function firstValue(properties, names) {
  for (const name of names) {
    if (properties?.[name] !== undefined && properties?.[name] !== null && properties?.[name] !== "") {
      return properties[name];
    }
  }
  return null;
}

function integerValue(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`Cliopatria ${label} must be an integer; got ${value}.`);
  return number;
}

function assertFeatureCollection(input) {
  if (input?.type !== "FeatureCollection" || !Array.isArray(input.features)) {
    throw new Error("Cliopatria input must be a GeoJSON FeatureCollection.");
  }
}

function geometryHasCoordinates(geometry) {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const inputPath = requireInput();
const outputPath = path.resolve(
  process.cwd(),
  readArg("--output", "data/build/gis/1326/cliopatria-1326-candidates.json"),
);

const raw = await fs.readFile(inputPath, "utf8");
const geojson = JSON.parse(raw);
assertFeatureCollection(geojson);

const candidates = [];
const excluded = { outsideTemporalRange: 0, nonPolity: 0, missingGeometry: 0 };

for (let index = 0; index < geojson.features.length; index += 1) {
  const feature = geojson.features[index];
  const properties = feature?.properties ?? {};
  const fromYear = integerValue(firstValue(properties, ["FromYear", "fromYear"]), "FromYear");
  const toYear = integerValue(firstValue(properties, ["ToYear", "toYear"]), "ToYear");
  const type = String(firstValue(properties, ["Type", "type"]) ?? "").trim().toUpperCase();

  if (!(fromYear <= SCENARIO_YEAR && SCENARIO_YEAR <= toYear)) {
    excluded.outsideTemporalRange += 1;
    continue;
  }
  if (type && type !== "POLITY") {
    excluded.nonPolity += 1;
    continue;
  }
  if (!geometryHasCoordinates(feature.geometry)) {
    excluded.missingGeometry += 1;
    continue;
  }

  const name = firstValue(properties, ["Name", "NAME", "name"]);
  const wikidataId = firstValue(properties, ["WikidataID", "WikidataId", "wikidataId", "Wikidata"]);
  const seshatId = firstValue(properties, ["SeshatID", "SeshatId", "seshatId"]);
  const sourceFeatureId = feature.id ?? firstValue(properties, ["ID", "id"]) ?? null;

  candidates.push({
    sourceFeatureIndex: index,
    sourceFeatureId: sourceFeatureId === null ? null : String(sourceFeatureId),
    name: name === null ? null : String(name),
    fromYear,
    toYear,
    type: type || "POLITY",
    wikidataId: wikidataId === null ? null : String(wikidataId),
    seshatId: seshatId === null ? null : String(seshatId),
    geometry: feature.geometry,
    reconciliationStatus: "pending",
    geometryAuthorityStatus: "candidate-evidence-only",
  });
}

const report = {
  schemaVersion: 1,
  source: {
    sourceId: "cliopatria-v0.2.0",
    sourceTag: "v0.2.0",
    immutableReference: {
      type: "git-commit",
      sha: "ad28a69",
      sourceBlobSha: "cefab0f4b622e2e7fb3daf68d4f461f83991204c",
    },
    inputPath: inputPath.replace(/\\/g, "/"),
    inputSha256: sha256Text(raw),
  },
  scenarioDate: SCENARIO_DATE,
  temporalRule: "FromYear <= 1326 <= ToYear",
  candidatePolicy: "Temporal match is necessary but not sufficient for historical entity or geometry authority.",
  counts: {
    inputFeatures: geojson.features.length,
    candidates: candidates.length,
    excluded,
  },
  candidates,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  inputFeatures: geojson.features.length,
  candidates: candidates.length,
  excluded,
  outputPath,
  authorityStatus: "candidate-evidence-only",
}, null, 2));

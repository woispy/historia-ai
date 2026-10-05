import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_YEAR = 1326;
const TEMPORAL_RULE = "FromYear <= 1326 <= ToYear";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1] ?? null;
}

const baseInput = arg("--base");
const headInput = arg("--head");
const outputInput = arg("--output");

if (!baseInput || !headInput) {
  throw new Error("--base <v0.2.0-geojson> and --head <v0.2.1-geojson> are required.");
}

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

async function readGeoJson(input) {
  const filePath = path.resolve(process.cwd(), input);
  const text = await fs.readFile(filePath, "utf8");
  const json = JSON.parse(text);
  if (json.type !== "FeatureCollection" || !Array.isArray(json.features)) {
    throw new Error(`Invalid GeoJSON FeatureCollection: ${input}`);
  }
  return { filePath, text, json };
}

function isPolity(feature) {
  return feature?.properties?.Type === "POLITY";
}

function is1326(feature) {
  const from = feature?.properties?.FromYear;
  const to = feature?.properties?.ToYear;
  return isPolity(feature) && Number.isFinite(from) && Number.isFinite(to)
    && from <= SCENARIO_YEAR && SCENARIO_YEAR <= to;
}

function identityFor(feature) {
  const p = feature.properties ?? {};
  const wikidata = typeof p.Wikidata === "string" && p.Wikidata.trim() ? p.Wikidata.trim() : null;
  const name = typeof p.Name === "string" && p.Name.trim() ? p.Name.trim() : null;
  if (!wikidata && !name) throw new Error("POLITY feature is missing both Wikidata and Name.");
  return wikidata ? `wikidata:${wikidata}|name:${name ?? ""}` : `name:${name}`;
}

function geometryFingerprint(feature) {
  return sha256(JSON.stringify(feature.geometry));
}

function normalizeProperties(feature) {
  const p = { ...(feature.properties ?? {}) };
  delete p.FromYear;
  delete p.ToYear;
  return p;
}

function sortedRecordSignature(feature) {
  const p = feature.properties ?? {};
  return JSON.stringify({
    fromYear: p.FromYear,
    toYear: p.ToYear,
    properties: normalizeProperties(feature),
    geometryFingerprint: geometryFingerprint(feature)
  });
}

function indexFeatures(features) {
  const map = new Map();
  for (const feature of features) {
    const key = identityFor(feature);
    const bucket = map.get(key) ?? [];
    bucket.push(feature);
    map.set(key, bucket);
  }
  return map;
}

function sliceIndex(features) {
  const map = new Map();
  for (const feature of features.filter(is1326)) {
    const key = identityFor(feature);
    const bucket = map.get(key) ?? [];
    bucket.push(feature);
    map.set(key, bucket);
  }
  return map;
}

function requireUnique1326(index, label) {
  for (const [key, bucket] of index) {
    if (bucket.length !== 1) {
      throw new Error(`${label} has ${bucket.length} 1326 records for identity ${key}; comparison requires a deterministic one-record identity.`);
    }
  }
}

const base = await readGeoJson(baseInput);
const head = await readGeoJson(headInput);

const basePolities = base.json.features.filter(isPolity);
const headPolities = head.json.features.filter(isPolity);
const base1326 = sliceIndex(base.json.features);
const head1326 = sliceIndex(head.json.features);

requireUnique1326(base1326, "Base v0.2.0");
requireUnique1326(head1326, "Head v0.2.1");

const baseKeys = [...base1326.keys()].sort();
const headKeys = [...head1326.keys()].sort();
const baseSet = new Set(baseKeys);
const headSet = new Set(headKeys);

const added = headKeys.filter(key => !baseSet.has(key));
const removed = baseKeys.filter(key => !headSet.has(key));
const common = baseKeys.filter(key => headSet.has(key));

const temporalChanges = [];
const geometryChanges = [];
const metadataChanges = [];
const unchanged = [];

for (const key of common) {
  const b = base1326.get(key)[0];
  const h = head1326.get(key)[0];
  const bp = b.properties ?? {};
  const hp = h.properties ?? {};

  const temporalChanged = bp.FromYear !== hp.FromYear || bp.ToYear !== hp.ToYear;
  const geometryChanged = geometryFingerprint(b) !== geometryFingerprint(h);
  const metadataChanged = JSON.stringify(normalizeProperties(b)) !== JSON.stringify(normalizeProperties(h));

  const entry = {
    identity: key,
    nameBase: bp.Name ?? null,
    nameHead: hp.Name ?? null,
    base: {
      fromYear: bp.FromYear,
      toYear: bp.ToYear,
      geometryType: b.geometry?.type ?? null,
      geometryFingerprint: geometryFingerprint(b)
    },
    head: {
      fromYear: hp.FromYear,
      toYear: hp.ToYear,
      geometryType: h.geometry?.type ?? null,
      geometryFingerprint: geometryFingerprint(h)
    }
  };

  if (temporalChanged) temporalChanges.push(entry);
  if (geometryChanged) geometryChanges.push(entry);
  if (metadataChanged) metadataChanges.push(entry);
  if (!temporalChanged && !geometryChanged && !metadataChanged) unchanged.push(entry);
}

const baseAll = indexFeatures(basePolities);
const headAll = indexFeatures(headPolities);
const non1326TemporalChanges = [];
for (const key of new Set([...baseAll.keys(), ...headAll.keys()])) {
  const baseRanges = (baseAll.get(key) ?? [])
    .map(f => [f.properties?.FromYear, f.properties?.ToYear])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const headRanges = (headAll.get(key) ?? [])
    .map(f => [f.properties?.FromYear, f.properties?.ToYear])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const baseNon1326Ranges = baseRanges.filter(([from, to]) => !(from <= SCENARIO_YEAR && SCENARIO_YEAR <= to));
  const headNon1326Ranges = headRanges.filter(([from, to]) => !(from <= SCENARIO_YEAR && SCENARIO_YEAR <= to));
  if (JSON.stringify(baseNon1326Ranges) !== JSON.stringify(headNon1326Ranges)) {
    non1326TemporalChanges.push({
      identity: key,
      baseRanges: baseNon1326Ranges,
      headRanges: headNon1326Ranges
    });
  }
}

const report = {
  schemaVersion: 1,
  scenarioYear: SCENARIO_YEAR,
  temporalRule: TEMPORAL_RULE,
  comparison: {
    base: {
      path: base.filePath,
      featureCount: base.json.features.length,
      polityCount: basePolities.length,
      inputSha256: sha256(base.text)
    },
    head: {
      path: head.filePath,
      featureCount: head.json.features.length,
      polityCount: headPolities.length,
      inputSha256: sha256(head.text)
    }
  },
  counts: {
    base1326: baseKeys.length,
    head1326: headKeys.length,
    added1326: added.length,
    removed1326: removed.length,
    common1326: common.length,
    temporalChanges1326: temporalChanges.length,
    geometryChanges1326: geometryChanges.length,
    metadataChanges1326: metadataChanges.length,
    unchanged1326: unchanged.length,
    non1326TemporalChanges: non1326TemporalChanges.length
  },
  classification: {
    identityChange: added.length > 0 || removed.length > 0,
    temporalChange1326: temporalChanges.length > 0,
    geometryChange1326: geometryChanges.length > 0,
    non1326TemporalCorrection: non1326TemporalChanges.length > 0,
    sourceMetadataOrOtherChange: false
  },
  added1326: added,
  removed1326: removed,
  temporalChanges1326: temporalChanges,
  geometryChanges1326: geometryChanges,
  metadataChanges1326: metadataChanges,
  non1326TemporalChanges
};

report.reportSha256 = sha256(JSON.stringify(report));

if (outputInput) {
  const outputPath = path.resolve(process.cwd(), outputInput);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n");
}

console.log(JSON.stringify({
  scenarioYear: SCENARIO_YEAR,
  base1326: baseKeys.length,
  head1326: headKeys.length,
  added1326: added.length,
  removed1326: removed.length,
  temporalChanges1326: temporalChanges.length,
  geometryChanges1326: geometryChanges.length,
  metadataChanges1326: metadataChanges.length,
  non1326TemporalChanges: non1326TemporalChanges.length,
  reportSha256: report.reportSha256,
  status: "PASS",
  promotion: "BLOCKED_UNTIL_REVIEWED"
}, null, 2));

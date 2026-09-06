const CANONICAL_LON_MIN = -180;
const CANONICAL_LON_MAX = 180;
const LAT_MIN = -90;
const LAT_MAX = 90;
const CONFIDENCE_KEYS = ["existence", "location", "extent", "boundary", "ownership"];
const HISTORICAL_EVIDENCE = new Set([
  "primary",
  "secondary",
  "archaeological",
  "cartographic",
  "inferred",
  "procedural",
]);
const SEED_METHODS = new Set([
  "historical-anchor",
  "historical-reconstruction",
  "procedural",
  "fallback",
]);
const HIERARCHY_LEVELS = new Set(["region", "duchy", "province"]);

export function normalizeProvinceSeed(input) {
  const seed = structuredClone(input ?? {});
  seed.id = Number(seed.id);
  seed.position = {
    lon: Number(seed.position?.lon),
    lat: Number(seed.position?.lat),
  };
  seed.historical = {
    validFrom: Number(seed.historical?.validFrom),
    validTo: seed.historical?.validTo == null ? null : Number(seed.historical.validTo),
    sourceIds: [...new Set(seed.historical?.sourceIds ?? [])].map(String).sort(),
    confidence: normalizeConfidence(seed.historical?.confidence),
    evidence: String(seed.historical?.evidence ?? "procedural"),
  };
  seed.hierarchy = {
    parentId: seed.hierarchy?.parentId == null ? null : Number(seed.hierarchy.parentId),
    level: String(seed.hierarchy?.level ?? "province"),
    ancestry: (seed.hierarchy?.ancestry ?? []).map(Number),
  };
  seed.generation = {
    weight: Number(seed.generation?.weight ?? 1),
    source: String(seed.generation?.source ?? "procedural"),
    method: String(seed.generation?.method ?? "procedural"),
  };
  return seed;
}

export function normalizeConfidence(confidence) {
  if (typeof confidence === "number") {
    const value = Number(confidence);
    return Object.fromEntries(CONFIDENCE_KEYS.map((key) => [key, value]));
  }
  return Object.fromEntries(
    CONFIDENCE_KEYS.map((key) => [key, Number(confidence?.[key] ?? 0)]),
  );
}

export function validateProvinceSeed(input) {
  const seed = normalizeProvinceSeed(input);
  const errors = [];

  if (!Number.isSafeInteger(seed.id) || seed.id < 0) errors.push("id must be a non-negative safe integer");
  if (!Number.isFinite(seed.position.lon) || seed.position.lon < CANONICAL_LON_MIN || seed.position.lon >= CANONICAL_LON_MAX) {
    errors.push("position.lon must be in [-180, 180)");
  }
  if (!Number.isFinite(seed.position.lat) || seed.position.lat < LAT_MIN || seed.position.lat > LAT_MAX) {
    errors.push("position.lat must be in [-90, 90]");
  }
  if (!Number.isInteger(seed.historical.validFrom)) errors.push("historical.validFrom must be an integer year");
  if (seed.historical.validTo != null && (!Number.isInteger(seed.historical.validTo) || seed.historical.validTo < seed.historical.validFrom)) {
    errors.push("historical.validTo must be null or an integer >= validFrom");
  }
  if (!HISTORICAL_EVIDENCE.has(seed.historical.evidence)) errors.push("historical.evidence is invalid");
  if (!seed.historical.sourceIds.length && seed.historical.evidence !== "procedural") errors.push("historical.sourceIds required for non-procedural evidence");
  for (const key of CONFIDENCE_KEYS) {
    const value = seed.historical.confidence[key];
    if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`historical.confidence.${key} must be in [0, 1]`);
  }
  if (!HIERARCHY_LEVELS.has(seed.hierarchy.level)) errors.push("hierarchy.level is invalid");
  if (seed.hierarchy.ancestry.some((id) => !Number.isSafeInteger(id) || id < 0)) errors.push("hierarchy.ancestry contains an invalid id");
  if (seed.hierarchy.parentId != null && !Number.isSafeInteger(seed.hierarchy.parentId)) errors.push("hierarchy.parentId must be a safe integer or null");
  if (!Number.isFinite(seed.generation.weight) || seed.generation.weight <= 0) errors.push("generation.weight must be > 0");
  if (!SEED_METHODS.has(seed.generation.method)) errors.push("generation.method is invalid");

  return { valid: errors.length === 0, errors, seed };
}

export function assertProvinceSeed(input) {
  const result = validateProvinceSeed(input);
  if (!result.valid) throw new TypeError(`Invalid province seed: ${result.errors.join("; ")}`);
  return result.seed;
}

export const PROVINCE_SEED_CONTRACT = Object.freeze({
  canonicalLongitude: "[-180,180)",
  latitude: "[-90,90]",
  confidence: CONFIDENCE_KEYS,
  historicalEvidence: [...HISTORICAL_EVIDENCE],
  hierarchyLevels: [...HIERARCHY_LEVELS],
  seedMethods: [...SEED_METHODS],
});

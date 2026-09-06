/**
 * Historia AI — Province Seed Model
 *
 * Build-time authoritative input contract for the production province
 * generation engine. A seed is historical/geographical evidence, not a
 * province polygon. Province geometry is produced later by tessellation.
 */

export const SEED_EVIDENCE_LEVELS = Object.freeze([
  "primary", "secondary", "archaeological", "cartographic", "inferred", "procedural",
]);
export const SEED_LEVELS = Object.freeze(["region", "duchy", "province"]);
export const BOUNDARY_MODES = Object.freeze(["hard", "soft", "inferred", "procedural"]);
export const TERRAIN_TYPES = Object.freeze(["land", "lowland", "valley", "highland", "mountain", "desert", "deep_water"]);

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function unitInterval(value, name) {
  const number = finite(value, name);
  if (number < 0 || number > 1) throw new Error(`${name} must be in [0, 1]`);
  return number;
}

function integer(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`${name} must be an integer`);
  return number;
}

function assertString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} must be a non-empty string`);
  return value;
}

function normalizeLongitude(value) {
  const lon = finite(value, "longitude");
  return ((lon + 180) % 360 + 360) % 360 - 180;
}

function validateConfidence(confidence) {
  const result = {
    existence: unitInterval(confidence?.existence ?? 0, "confidence.existence"),
    location: unitInterval(confidence?.location ?? 0, "confidence.location"),
    extent: unitInterval(confidence?.extent ?? 0, "confidence.extent"),
    boundary: unitInterval(confidence?.boundary ?? 0, "confidence.boundary"),
    ownership: unitInterval(confidence?.ownership ?? 0, "confidence.ownership"),
  };
  result.overall = unitInterval(
    confidence?.overall ?? (
      result.existence * 0.25 + result.location * 0.25 + result.extent * 0.15
      + result.boundary * 0.2 + result.ownership * 0.15
    ),
    "confidence.overall",
  );
  return result;
}

export function validateProvinceSeed(seed) {
  if (!seed || typeof seed !== "object") throw new Error("seed must be an object");
  assertString(seed.id, "seed.id");
  assertString(seed.identity?.key, "seed.identity.key");
  assertString(seed.identity?.name, "seed.identity.name");

  const level = seed.identity?.type ?? "province";
  if (!SEED_LEVELS.includes(level)) throw new Error(`Unsupported seed level: ${level}`);

  const lat = finite(seed.position?.lat, "seed.position.lat");
  if (lat < -90 || lat > 90) throw new Error("seed.position.lat must be in [-90, 90]");
  const lon = normalizeLongitude(seed.position?.lon);
  const historical = seed.historical ?? {};
  const confidence = validateConfidence(historical.confidence ?? historical);

  const sourceIds = historical.sourceIds ?? [];
  if (!Array.isArray(sourceIds) || sourceIds.some((id) => typeof id !== "string" || !id)) {
    throw new Error("historical.sourceIds must be an array of non-empty strings");
  }

  const parentId = seed.hierarchy?.parentId ?? null;
  const boundaryMode = seed.constraints?.boundaryMode ?? "procedural";
  if (!BOUNDARY_MODES.includes(boundaryMode)) throw new Error(`Unsupported boundary mode: ${boundaryMode}`);

  return {
    ...seed,
    id: String(seed.id),
    identity: { ...seed.identity, type: level },
    position: { lat, lon },
    historical: {
      ...historical,
      validFrom: historical.validFrom == null ? null : integer(historical.validFrom, "historical.validFrom"),
      validTo: historical.validTo == null ? null : integer(historical.validTo, "historical.validTo"),
      sourceIds: [...sourceIds].sort(),
      confidence,
    },
    hierarchy: {
      ...seed.hierarchy,
      parentId: parentId == null ? null : String(parentId),
      ancestry: Array.isArray(seed.hierarchy?.ancestry) ? seed.hierarchy.ancestry.map(String) : [],
    },
    constraints: {
      ...seed.constraints,
      boundaryMode,
      physical: {
        landOnly: seed.constraints?.physical?.landOnly ?? true,
        avoidWater: seed.constraints?.physical?.avoidWater ?? true,
        riverCrossingCost: finite(seed.constraints?.physical?.riverCrossingCost ?? 3.5, "riverCrossingCost"),
        mountainCrossingCost: finite(seed.constraints?.physical?.mountainCrossingCost ?? 5, "mountainCrossingCost"),
        ridgeAffinity: finite(seed.constraints?.physical?.ridgeAffinity ?? 8, "ridgeAffinity"),
        coastAffinity: finite(seed.constraints?.physical?.coastAffinity ?? 2, "coastAffinity"),
      },
    },
  };
}

export function validateProvinceSeedSet(seeds = []) {
  if (!Array.isArray(seeds)) throw new Error("seeds must be an array");
  const ids = new Set();
  const keys = new Set();
  const normalized = [];
  for (const seed of seeds) {
    const item = validateProvinceSeed(seed);
    if (ids.has(item.id)) throw new Error(`Duplicate seed id: ${item.id}`);
    if (keys.has(item.identity.key)) throw new Error(`Duplicate seed key: ${item.identity.key}`);
    ids.add(item.id);
    keys.add(item.identity.key);
    normalized.push(item);
  }
  return normalized.sort((a, b) => a.id.localeCompare(b.id));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function serializeProvinceSeeds(seeds) {
  return JSON.stringify(canonicalize(validateProvinceSeedSet(seeds)));
}

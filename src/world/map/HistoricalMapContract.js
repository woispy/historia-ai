/**
 * Historia AI — historical map contract.
 *
 * Political identity and physical geography are intentionally separate.
 * Modern Admin-0 country geometry is never a historical political source.
 */

export const HISTORICAL_MAP_ENTITY_TYPES = Object.freeze({
  polity: "polity",
  territory: "territory",
  region: "region",
  province: "province",
  city: "city",
  settlement: "settlement",
});

export const HISTORICAL_MAP_POLICY = Object.freeze({
  politicalSource: "historical-runtime",
  physicalSource: "physical-atlas",
  modernCountryFallback: false,
  cityIsProvince: false,
  cityClickChangesZoomOnly: false,
});

const MODERN_ADMIN0_PROVENANCE = Object.freeze([
  "modern-admin0",
  "admin-0-countries",
  "natural-earth-admin-0",
]);

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Returns true only when an entity explicitly identifies itself as coming
 * from the modern Admin-0 country layer. Historical names are deliberately
 * not hard-coded here: provenance is the firewall, not a country blacklist.
 */
export function isModernAdmin0Identity(entity = {}) {
  const provenance = [
    entity.sourceType,
    entity.source,
    entity.dataset,
    entity.geometrySource,
    entity.provider,
  ].map(normalize);

  if (provenance.some((value) => MODERN_ADMIN0_PROVENANCE.includes(value))) return true;
  if (normalize(entity.adminLevel) === "0" && normalize(entity.timeModel) !== "historical") return true;
  return false;
}

export function assertHistoricalPoliticalIdentity(entity = {}) {
  if (!entity || typeof entity !== "object") {
    throw new TypeError("Historical political entity must be an object.");
  }

  if (isModernAdmin0Identity(entity)) {
    throw new Error(`Modern Admin-0 identity cannot enter historical political runtime: ${entity.id ?? "<unknown>"}`);
  }

  const type = normalize(entity.type);
  if (type && !["polity", "territory", "province"].includes(type)) {
    throw new Error(`Historical political runtime does not accept entity type: ${entity.type}`);
  }

  if (!normalize(entity.id)) {
    throw new Error("Historical political entity requires a stable id.");
  }

  return true;
}

export function assertHistoricalPoliticalIdentities(entities = []) {
  if (!Array.isArray(entities)) throw new TypeError("Historical political entities must be an array.");
  entities.forEach(assertHistoricalPoliticalIdentity);
  return true;
}

export function createHistoricalMapDescriptor({ date, polities = [] } = {}) {
  assertHistoricalPoliticalIdentities(polities);

  return Object.freeze({
    date: date ?? null,
    entityTypes: HISTORICAL_MAP_ENTITY_TYPES,
    policy: HISTORICAL_MAP_POLICY,
    polities: Object.freeze([...polities]),
  });
}

export function isHistoricalMapDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

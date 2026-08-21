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

const HISTORICAL_POLITICAL_TYPES = Object.freeze(["polity", "territory", "province"]);
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
  if (type && !HISTORICAL_POLITICAL_TYPES.includes(type)) {
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

export function assertHistoricalProvinceRecord(province = {}) {
  if (!province || typeof province !== "object") {
    throw new TypeError("Historical province must be an object.");
  }
  if (!normalize(province.id)) throw new Error("Historical province requires a stable id.");
  if (isModernAdmin0Identity(province)) {
    throw new Error(`Modern Admin-0 identity cannot enter historical province runtime: ${province.id}`);
  }
  if (province.type && normalize(province.type) !== "province") {
    throw new Error(`Historical province has invalid entity type: ${province.type}`);
  }
  if (province.polityId !== null && province.polityId !== undefined && !normalize(province.polityId)) {
    throw new Error(`Historical province ${province.id} has an invalid polityId.`);
  }
  return true;
}

export function assertHistoricalPoliticalIdentitiesAndProvinces({ polities = [], provinces = [] } = {}) {
  assertHistoricalPoliticalIdentities(polities);
  if (!Array.isArray(provinces)) throw new TypeError("Historical provinces must be an array.");
  provinces.forEach(assertHistoricalProvinceRecord);
  return true;
}

export function createHistoricalMapDescriptor({ date, polities = [], provinces = [] } = {}) {
  assertHistoricalPoliticalIdentitiesAndProvinces({ polities, provinces });

  return Object.freeze({
    date: date ?? null,
    entityTypes: HISTORICAL_MAP_ENTITY_TYPES,
    policy: HISTORICAL_MAP_POLICY,
    polities: Object.freeze([...polities]),
    provinces: Object.freeze([...provinces]),
  });
}

export function isHistoricalMapDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""));
}

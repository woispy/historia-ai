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

export function createHistoricalMapDescriptor({ date, polities = [] } = {}) {
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

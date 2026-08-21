import {
  assertHistoricalPoliticalIdentitiesAndProvinces,
  assertHistoricalProvinceRecord,
  createHistoricalMapDescriptor,
} from "../HistoricalMapContract.js";

const POLITY_DEFINITIONS = Object.freeze([
  ["byzantium", "Byzantine Empire", "empire"],
  ["ottomans", "Ottoman Beylik", "beylik"],
  ["karasi", "Karasi Beylik", "beylik"],
  ["saruhan", "Saruhan Beylik", "beylik"],
  ["mentese", "Menteşe Beylik", "beylik"],
  ["esref", "Eşrefoğlu Beylik", "beylik"],
  ["germiyan", "Germiyan Beylik", "beylik"],
  ["karaman", "Karaman Beylik", "beylik"],
  ["pervane", "Pervâneoğlu Beylik", "local-polity"],
  ["candar", "Candar Beylik", "local-polity"],
]);

const POLITY_BY_ID = new Map(
  POLITY_DEFINITIONS.map(([id, name, kind]) => [
    id,
    Object.freeze({ id, name, kind, type: "polity", timeModel: "historical" }),
  ]),
);

function normalizeDate(date) {
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  const value = String(date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Historical runtime requires an ISO date: ${date ?? "<missing>"}`);
  }
  return value;
}

function clonePolity(id) {
  const polity = POLITY_BY_ID.get(id);
  return polity ? { ...polity } : null;
}

function controllerForDate(metadata, date) {
  const control = metadata?.historicalControl;
  if (!control) return null;

  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(year)) return null;

  const startYear = Number.isFinite(Number(control.startYear)) ? Number(control.startYear) : null;
  if (startYear !== null && year < startYear) return null;
  return control.controllerAt1300 ?? null;
}

function toHistoricalProvince(metadata, date) {
  const polityId = controllerForDate(metadata, date);

  return {
    id: metadata.id,
    type: "province",
    name: metadata.name,
    cityId: metadata.cityId,
    regionId: metadata.regionId,
    centroid: metadata.centroid,
    polityId,
    controlStatus: metadata.historicalControl?.statusAt1300 ?? "unknown",
    controlConfidence: metadata.historicalControl?.confidence ?? "low",
    controlNote: metadata.historicalControl?.note ?? null,
    timeModel: "historical",
    sourceType: "historical-runtime",
  };
}

/**
 * Builds the historical political layer without using Admin-0 country data.
 *
 * The presentation metadata remains responsible for persistent geography and
 * historical interpretation. This runtime owns the dated political identity.
 */
export function createHistoricalPoliticalRuntime({ date, provinceMetadata = [] } = {}) {
  const normalizedDate = normalizeDate(date);
  if (!Array.isArray(provinceMetadata)) {
    throw new TypeError("provinceMetadata must be an array.");
  }

  // Validate the source boundary before converting records. This is important:
  // once a modern Admin-0 record is projected into a historical shape it would
  // otherwise look historical and the provenance firewall could be bypassed.
  provinceMetadata.forEach(assertHistoricalProvinceRecord);

  const provinces = provinceMetadata.map((metadata) => toHistoricalProvince(metadata, normalizedDate));
  const polityIds = new Set(provinces.map((province) => province.polityId).filter(Boolean));
  const polities = [...polityIds].map(clonePolity).filter(Boolean);

  assertHistoricalPoliticalIdentitiesAndProvinces({ polities, provinces });

  return createHistoricalMapDescriptor({
    date: normalizedDate,
    polities,
    provinces,
  });
}

export function getHistoricalPolity(id) {
  return clonePolity(id);
}

export function getHistoricalPolityIds() {
  return [...POLITY_BY_ID.keys()];
}

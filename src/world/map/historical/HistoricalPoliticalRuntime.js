import {
  assertHistoricalPoliticalIdentitiesAndProvinces,
  assertHistoricalProvinceRecord,
  createHistoricalMapDescriptor,
} from "../HistoricalMapContract.js";
import { createHistoricalProvincePoliticalStates } from "./HistoricalProvincePoliticalState.js";
import { getVerified1300Control } from "./Historical1300ControlOverrides.js";

const POLITY_DEFINITIONS = Object.freeze([
  ["byzantium", "Byzantine Empire", "empire", "#6A1B9A"],
  ["ottomans", "Ottoman Beylik", "beylik", "#0F7A32"],
  ["karasi", "Karasi Beylik", "beylik", "#B87333"],
  ["saruhan", "Saruhan Beylik", "beylik", "#786A9D"],
  ["mentese", "Menteşe Beylik", "beylik", "#3E7C59"],
  ["esref", "Eşrefoğlu Beylik", "beylik", "#7B6840"],
  ["germiyan", "Germiyan Beylik", "beylik", "#8C5A2B"],
  ["inanc", "İnanç Beyliği", "local-polity", "#5E8C61"],
  ["hamid", "Hamid Beyliği", "beylik", "#4F8065"],
  ["sahibata", "Sâhib Ata Beyliği", "local-polity", "#806A4A"],
  ["karaman", "Karaman Beylik", "beylik", "#A33F3F"],
  ["pervane", "Pervâneoğlu Beylik", "local-polity", "#6B7280"],
  ["candar", "Candar Beylik", "local-polity", "#7A6A3A"],
  ["trebizond", "Empire of Trebizond", "empire", "#4A7896"],
  ["ilkhanate", "Ilkhanate Suzerainty", "suzerain", "#3D73B9"],
  ["cilicia", "Kingdom of Cilicia", "kingdom", "#8B4A62"],
]);

const POLITY_BY_ID = new Map(
  POLITY_DEFINITIONS.map(([id, name, kind, color]) => [
    id,
    Object.freeze({
      id,
      name,
      kind,
      type: "polity",
      timeModel: "historical",
      sourceType: "historical-runtime",
      color,
      terrainColor: color,
    }),
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
  const override = date === "1300-01-01" ? getVerified1300Control(metadata.id) : null;
  const control = override ?? metadata?.historicalControl;
  if (!control) return null;
  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(year)) return null;
  const startYear = Number.isFinite(Number(control.startYear)) ? Number(control.startYear) : null;
  if (startYear !== null && year < startYear) return null;
  return control.controllerAt1300 ?? null;
}

function toHistoricalProvince(metadata, date) {
  const override = date === "1300-01-01" ? getVerified1300Control(metadata.id) : null;
  const control = override ?? metadata.historicalControl;
  const polityId = controllerForDate(metadata, date);
  return {
    id: metadata.id,
    type: "province",
    name: metadata.name,
    cityId: metadata.cityId,
    regionId: metadata.regionId,
    centroid: metadata.centroid,
    polityId,
    controlStatus: control?.statusAt1300 ?? "unknown",
    controlConfidence: control?.confidence ?? "low",
    controlNote: control?.note ?? null,
    timeModel: "historical",
    sourceType: "historical-runtime",
  };
}

export function createHistoricalPoliticalRuntime({ date, provinceMetadata = [] } = {}) {
  const normalizedDate = normalizeDate(date);
  if (!Array.isArray(provinceMetadata)) {
    throw new TypeError("provinceMetadata must be an array.");
  }

  provinceMetadata.forEach(assertHistoricalProvinceRecord);
  const provinces = provinceMetadata.map((metadata) => toHistoricalProvince(metadata, normalizedDate));
  const polityIds = new Set(provinces.map((province) => province.polityId).filter(Boolean));
  const polities = [...polityIds].map(clonePolity);

  const unknownPolityIds = [...polityIds].filter((id) => !POLITY_BY_ID.has(id));
  if (unknownPolityIds.length) {
    throw new Error(
      `Historical runtime contains unregistered polity identities: ${unknownPolityIds.join(", ")}`,
    );
  }

  assertHistoricalPoliticalIdentitiesAndProvinces({ polities, provinces });

  const descriptor = createHistoricalMapDescriptor({
    date: normalizedDate,
    polities,
    provinces,
  });

  return Object.freeze({
    ...descriptor,
    provincePoliticalStates: createHistoricalProvincePoliticalStates({
      date: normalizedDate,
      provinces,
    }),
  });
}

export function getHistoricalPolity(id) {
  return clonePolity(id);
}

export function getHistoricalPolityIds() {
  return [...POLITY_BY_ID.keys()];
}

import { getCountry } from "../../../countries/index.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../map/data/AnatoliaProvinceMetadata.js";
import {
  createHistoricalPoliticalRuntime,
  getHistoricalPolity,
} from "./HistoricalPoliticalRuntime.js";
import { createHistoricalPoliticalPresentation } from "./HistoricalPoliticalPresentation.js";

const HISTORICAL_1300_DATE = "1300-01-01";

function create1300ProvinceIndex() {
  const runtime = createHistoricalPoliticalRuntime({
    date: HISTORICAL_1300_DATE,
    provinceMetadata: ANATOLIA_PROVINCE_METADATA,
  });
  return new Map(runtime.provinces.map((province) => [province.id, province]));
}

export function isHistorical1300Date(date) {
  return date === HISTORICAL_1300_DATE;
}

export function createHistoricalPoliticalMapModel({
  date,
  provinces = [],
  countryRepository,
} = {}) {
  if (!isHistorical1300Date(date)) return null;

  const metadataByProvinceId = create1300ProvinceIndex();

  return provinces.map((province) => {
    const sourceCountry = province.owner
      ? getCountry(countryRepository, province.owner)
      : null;
    const historicalProvince = metadataByProvinceId.get(province.id) ?? null;

    // Historical control is authoritative for the historical political layer.
    // A null direct polity is meaningful: it represents intentionally neutral,
    // contested, or layered authority. Never leak the simulation owner into
    // the 1300 presentation layer.
    const polityId = historicalProvince
      ? historicalProvince.polityId
      : null;
    const suzerainPolityId = historicalProvince
      ? historicalProvince.suzerainPolityId
      : null;

    // Historical land must never become visually blank merely because the
    // exact direct sovereign is unresolved. Suzerainty keeps its dedicated
    // presentation polity; other unresolved land uses the neutral polity.
    const presentationPolityId = polityId
      ?? suzerainPolityId
      ?? "local_polities";

    // Presentation comes from the historical runtime registry, never from the
    // modern country repository. The repository remains available only as the
    // source/simulation identity for diagnostics and compatibility.
    const historicalPolity = getHistoricalPolity(presentationPolityId);
    const historicalPolitical = createHistoricalPoliticalPresentation({
      polityId: presentationPolityId,
      country: historicalPolity,
    });

    return Object.freeze({
      province,
      country: historicalPolitical,
      sourceCountry,
      historicalPolitical,
      historicalProvince,
    });
  });
}
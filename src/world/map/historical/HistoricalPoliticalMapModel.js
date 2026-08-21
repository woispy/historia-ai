import { getCountry } from "../../../countries/index.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../../map/data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalRuntime } from "./HistoricalPoliticalRuntime.js";
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
    const polityId = historicalProvince?.polityId ?? province.owner ?? null;
    const historicalCountry = polityId
      ? getCountry(countryRepository, polityId)
      : null;
    const historicalPolitical = createHistoricalPoliticalPresentation({
      polityId,
      country: historicalCountry,
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

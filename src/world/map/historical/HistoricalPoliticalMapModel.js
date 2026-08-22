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
    // A null controller is meaningful: it represents an intentionally neutral,
    // contested, layered, or not-yet-resolved locality. Falling back to the
    // simulation province owner here would leak a non-historical identity into
    // the 1300 presentation and would erase the distinction between geography
    // and dated political control.
    const polityId = historicalProvince
      ? historicalProvince.polityId
      : null;
    const isIlkhanidSuzerainty = historicalProvince?.controlStatus?.toLowerCase() === "ilkhanid-suzerainty";
    const presentationPolityId = polityId ?? (isIlkhanidSuzerainty ? "ilkhanate" : null);

    // Presentation comes from the historical runtime registry, never from the
    // modern country repository. The repository remains available only as the
    // source/simulation identity for diagnostics and compatibility.
    const historicalPolity = presentationPolityId
      ? getHistoricalPolity(presentationPolityId)
      : null;
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

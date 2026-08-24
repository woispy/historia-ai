import "./MapView.css";

import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import { getProvinceMetadata } from "../../../map/data/AnatoliaProvinceMetadata.js";
import { getAnatolia1300Hydrography } from "../../../map/data/Anatolia1300Hydrography.js";
import { getHistoricalPolity } from "../../../world/map/historical/HistoricalPoliticalRuntime.js";
import { WorldMap } from "../../../map";
import ProvinceInspector from "./ProvinceInspector";

const HISTORICAL_1300_DATE = "1300-01-01";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

function createHistoricalInspectorProvince(metadata) {
  if (!metadata) return null;

  const hydrography = getAnatolia1300Hydrography(metadata.id);

  return {
    id: metadata.id,
    name: metadata.name,
    owner: metadata.countryId ?? null,
    controller: metadata.historicalControl?.controllerAt1300 ?? null,
    terrain: metadata.terrain ?? null,
    port: metadata.port === true,
    strategic: metadata.strategic === true,
    culture: null,
    religion: null,
    governor: null,
    fortLevel: null,
    population: null,
    development: null,
    river: Boolean(hydrography),
    riverName: hydrography?.name ?? null,
    riverDetail: hydrography?.detail ?? null,
    historicalControl: metadata.historicalControl ?? null,
  };
}

function mergeHistoricalHydrography(province, historicalMetadata) {
  if (!province || !historicalMetadata) return province;

  const hydrography = getAnatolia1300Hydrography(historicalMetadata.id);
  if (!hydrography) return province;

  return {
    ...province,
    river: true,
    riverName: hydrography.name,
    riverDetail: hydrography.detail,
  };
}

function MapView({
  gameSession,
  settings,
  selectedProvinceId = null,
  onProvinceClick,
  onProvinceClose,
}) {
  const provinceRepository = gameSession?.world?.repositories?.provinces;
  const countryRepository = gameSession?.world?.repositories?.countries;
  const scenarioDate = getScenarioStartDate(gameSession);
  const historicalMetadata = scenarioDate === HISTORICAL_1300_DATE && selectedProvinceId
    ? getProvinceMetadata(selectedProvinceId)
    : null;
  const repositoryProvince = provinceRepository && selectedProvinceId
    ? getProvince(provinceRepository, selectedProvinceId)
    : null;
  const selectedProvince = mergeHistoricalHydrography(
    repositoryProvince ?? createHistoricalInspectorProvince(historicalMetadata),
    historicalMetadata,
  );
  const selectedCountry = repositoryProvince?.owner && countryRepository
    ? getCountry(countryRepository, repositoryProvince.owner)
    : null;
  const historicalControllerId = historicalMetadata?.historicalControl?.controllerAt1300 ?? null;
  const historicalPolity = historicalControllerId
    ? getHistoricalPolity(historicalControllerId)
    : null;

  return (
    <main
      className="map-view"
      title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
      aria-label="Dünya haritası"
    >
      <WorldMap
        runtime={gameSession}
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={onProvinceClick}
        settings={settings}
      />
      {selectedProvince && (
        <ProvinceInspector
          province={selectedProvince}
          country={selectedCountry}
          historicalMetadata={historicalMetadata}
          historicalPolity={historicalPolity}
          onClose={onProvinceClose}
        />
      )}
    </main>
  );
}

export default MapView;

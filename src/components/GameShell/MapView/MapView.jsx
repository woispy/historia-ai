import "./MapView.css";

import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import { getProvinceMetadata } from "../../../map/data/AnatoliaProvinceMetadata.js";
import { getHistoricalPolity } from "../../../world/map/historical/HistoricalPoliticalRuntime.js";
import { WorldMap } from "../../../map";
import ProvinceInspector from "./ProvinceInspector";

const HISTORICAL_1300_DATE = "1300-01-01";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
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
  const selectedProvince = provinceRepository && selectedProvinceId
    ? getProvince(provinceRepository, selectedProvinceId)
    : null;
  const selectedCountry = selectedProvince?.owner && countryRepository
    ? getCountry(countryRepository, selectedProvince.owner)
    : null;
  const scenarioDate = getScenarioStartDate(gameSession);
  const historicalMetadata = scenarioDate === HISTORICAL_1300_DATE && selectedProvinceId
    ? getProvinceMetadata(selectedProvinceId)
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

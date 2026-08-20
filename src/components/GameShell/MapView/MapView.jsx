import "./MapView.css";

import { getCity } from "../../../cities";
import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import { getAnatoliaCityMapMetadata } from "../../../map/data/AnatoliaCityAtlas.js";
import { WorldMap } from "../../../map";
import ProvinceInspector from "./ProvinceInspector";
import CityInspector from "./CityInspector";

function MapView({
  gameSession,
  settings,
  selectedProvinceId = null,
  selectedCityId = null,
  onProvinceClick,
  onProvinceClose,
  onCityClick,
  onCityClose,
}) {
  const provinceRepository = gameSession?.world?.repositories?.provinces;
  const countryRepository = gameSession?.world?.repositories?.countries;
  const cityRepository = gameSession?.world?.repositories?.cities;
  const selectedProvince = provinceRepository && selectedProvinceId
    ? getProvince(provinceRepository, selectedProvinceId)
    : null;
  const selectedCountry = selectedProvince?.owner && countryRepository
    ? getCountry(countryRepository, selectedProvince.owner)
    : null;
  const selectedCity = cityRepository && selectedCityId
    ? getCity(cityRepository, selectedCityId)
    : null;
  const selectedCityCountry = selectedCity?.owner && countryRepository
    ? getCountry(countryRepository, selectedCity.owner)
    : null;
  const selectedCityMetadata = selectedCityId
    ? getAnatoliaCityMapMetadata(selectedCityId)
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
        onCityClick={onCityClick}
        settings={settings}
      />
      {selectedProvince && !selectedCity && (
        <ProvinceInspector
          province={selectedProvince}
          country={selectedCountry}
          onClose={onProvinceClose}
        />
      )}
      {selectedCity && (
        <CityInspector
          city={selectedCity}
          country={selectedCityCountry}
          mapMetadata={selectedCityMetadata}
          onClose={onCityClose}
        />
      )}
    </main>
  );
}

export default MapView;

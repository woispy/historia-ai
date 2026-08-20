import "./MapView.css";

import { useState } from "react";
import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import { getCity } from "../../../cities";
import { WorldMap } from "../../../map";
import { getAnatoliaCityMapMetadata } from "../../../map/data/AnatoliaCityAtlas.js";
import ProvinceInspector from "./ProvinceInspector";
import CityInspector from "./CityInspector";

function MapView({
  gameSession,
  settings,
  selectedProvinceId = null,
  onProvinceClick,
  onProvinceClose,
}) {
  const [selectedCityId, setSelectedCityId] = useState(null);
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
  const selectedCityProvince = selectedCity?.province && provinceRepository
    ? getProvince(provinceRepository, selectedCity.province)
    : null;
  const selectedCityMapMetadata = selectedCityId
    ? getAnatoliaCityMapMetadata(selectedCityId)
    : null;

  function handleCityClick(cityId) {
    setSelectedCityId((currentId) => (currentId === cityId ? null : cityId));
    onProvinceClose?.();
  }

  function handleProvinceClick(provinceId) {
    setSelectedCityId(null);
    onProvinceClick?.(provinceId);
  }

  function handleCityClose() {
    setSelectedCityId(null);
  }

  return (
    <main
      className="map-view"
      title={settings.tips ? "Haritayı sürükleyerek gezinebilir, tekerlek ile yakınlaşıp uzaklaşabilirsiniz." : undefined}
      aria-label="Dünya haritası"
    >
      <WorldMap
        runtime={gameSession}
        selectedProvinceId={selectedProvinceId}
        onProvinceClick={handleProvinceClick}
        onCityClick={handleCityClick}
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
          province={selectedCityProvince}
          onClose={handleCityClose}
          mapMetadata={selectedCityMapMetadata}
        />
      )}
    </main>
  );
}

export default MapView;

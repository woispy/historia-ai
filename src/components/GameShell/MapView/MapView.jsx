import "./MapView.css";

import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import { WorldMap } from "../../../map";
import ProvinceInspector from "./ProvinceInspector";

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
          onClose={onProvinceClose}
        />
      )}
    </main>
  );
}

export default MapView;

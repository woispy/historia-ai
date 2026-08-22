import { lazy, Suspense } from "react";
import "./MapView.css";

import { getCountry } from "../../../countries";
import { getProvince } from "../../../provinces";
import ProvinceInspector from "./ProvinceInspector";

const WorldMap = lazy(() => import("../../../map/components/WorldMap"));

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
      <Suspense fallback={<div className="map-loading" role="status" aria-live="polite">Loading map…</div>}>
        <WorldMap
          runtime={gameSession}
          selectedProvinceId={selectedProvinceId}
          onProvinceClick={onProvinceClick}
          settings={settings}
        />
      </Suspense>
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

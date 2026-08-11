import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import { ProvinceBoundaryLayer } from "./ProvinceBoundaryLayer";

function isCuratedCountryOverlay(province) {
  return province?.historical?.classification === "curated-regional-gameplay-overlay";
}

function ProvinceLayer({
  provinces,
  selectedProvinceId,
  onProvinceClick,
  mapStyle,
  mapShadows,
  zoom = 1,
}) {
  // Phase 2 separates historical country-regional overlays from runtime
  // province simulation units. The source-derived 1300 features are the
  // province layer; the curated 16-region overlay remains metadata only.
  const runtimeProvinces = provinces.filter(
    ({ province }) => !isCuratedCountryOverlay(province),
  );

  return (
    <ProvinceSvg>
      {runtimeProvinces.map(({ province, country, geometry }) => (
        <ProvincePolygon
          key={province.id}
          province={province}
          country={country}
          geometry={geometry}
          selected={province.id === selectedProvinceId}
          onClick={onProvinceClick}
          mapStyle={mapStyle}
          mapShadows={mapShadows}
          zoom={zoom}
        />
      ))}
      <ProvinceBoundaryLayer provinces={runtimeProvinces} zoom={zoom} />
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

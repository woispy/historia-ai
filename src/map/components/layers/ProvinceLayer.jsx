import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import ProvinceBoundaryLayer from "./ProvinceBoundaryLayer";

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

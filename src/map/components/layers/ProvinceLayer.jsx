import { useMemo } from "react";
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
  renderFill = true,
}) {
  const runtimeProvinces = useMemo(
    () => provinces.filter(({ province }) => !isCuratedCountryOverlay(province)),
    [provinces],
  );
  const showTopology = zoom >= 2.25;

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
          renderFill={renderFill}
        />
      ))}
      {showTopology && <ProvinceBoundaryLayer provinces={runtimeProvinces} zoom={zoom} />}
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

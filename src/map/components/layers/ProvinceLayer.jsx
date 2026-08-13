import { useMemo } from "react";
import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import ProvinceBoundaryLayer from "./ProvinceBoundaryLayer";
import { getGeometryBounds, getViewportBounds, isGeometryVisible } from "../../rendering/MapViewportCulling";

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
  camera = {},
  renderFill = true,
}) {
  const runtimeProvinces = useMemo(
    () => provinces.filter(({ province }) => !isCuratedCountryOverlay(province)),
    [provinces],
  );

  const indexedProvinces = useMemo(
    () => runtimeProvinces.map((item) => ({
      ...item,
      bounds: getGeometryBounds(item.geometry),
    })),
    [runtimeProvinces],
  );

  const viewportBounds = useMemo(
    () => getViewportBounds(camera, 0.12),
    [camera],
  );

  const visibleProvinces = useMemo(
    () => indexedProvinces.filter((item) => isGeometryVisible(item.bounds, viewportBounds)),
    [indexedProvinces, viewportBounds],
  );

  return (
    <ProvinceSvg>
      {visibleProvinces.map(({ province, country, geometry }) => (
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
      <ProvinceBoundaryLayer
        provinces={runtimeProvinces}
        camera={camera}
      />
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

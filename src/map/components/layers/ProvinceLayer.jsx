import { useMemo } from "react";
import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import ProvinceBoundaryLayer from "./ProvinceBoundaryLayer";
import { getGeometryBounds, getViewportBounds, isGeometryVisible } from "../../rendering/MapViewportCulling";
import { MAP_LOD } from "../../rendering/CartographyModel";

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

  // At world/regional LOD the GPU owns the political surface. Keeping every
  // province as an SVG hit path still forces the browser to layout, retain and
  // hit-test hundreds/thousands of complex paths during camera movement.
  const interactionActive = zoom >= MAP_LOD.province.min || Boolean(selectedProvinceId);

  const visibleProvinces = useMemo(() => {
    if (!interactionActive) return [];
    return indexedProvinces.filter((item) => isGeometryVisible(item.bounds, viewportBounds));
  }, [indexedProvinces, viewportBounds, interactionActive]);

  return (
    <ProvinceSvg>
      <g clipPath="url(#world-land-mask)">
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
        <ProvinceBoundaryLayer provinces={runtimeProvinces} camera={camera} zoom={zoom} />
      </g>
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

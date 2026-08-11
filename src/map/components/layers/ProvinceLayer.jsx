import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas";

function buildPathData(polygons = []) {
  return polygons
    .filter((polygon) => Array.isArray(polygon) && polygon.length >= 3)
    .map((polygon) => {
      const [first, ...rest] = polygon;
      return [
        `M ${first[0]} ${first[1]}`,
        ...rest.map(([x, y]) => `L ${x} ${y}`),
        "Z",
      ].join(" ");
    })
    .join(" ");
}

function ProvinceLayer({ provinces, selectedProvinceId, onProvinceClick, mapStyle, mapShadows }) {
  const landPath = buildPathData(ANATOLIA_PHYSICAL_ATLAS.landPolygons);
  const waterHolesPath = buildPathData(
    ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => sea.coordinates),
  );

  return (
    <ProvinceSvg>
      <defs>
        <clipPath id="anatolia-landmask" clipPathUnits="userSpaceOnUse">
          <path d={`${landPath} ${waterHolesPath}`} fillRule="evenodd" />
        </clipPath>
      </defs>
      {provinces.map(({ province, country, geometry }) => (
        <ProvincePolygon
          key={province.id}
          province={province}
          country={country}
          geometry={geometry}
          selected={province.id === selectedProvinceId}
          onClick={onProvinceClick}
          mapStyle={mapStyle}
          mapShadows={mapShadows}
        />
      ))}
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

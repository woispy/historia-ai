import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";
import { ANATOLIA_LAND_MASK } from "../../data/AnatoliaLandMask";

function buildMaskPath(polygons) {
  return polygons
    .map((polygon) => {
      const [first, ...rest] = polygon;
      return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
    })
    .join(" ");
}

function ProvinceLayer({ provinces, selectedProvinceId, onProvinceClick, mapStyle, mapShadows }) {
  const landMaskPath = buildMaskPath(ANATOLIA_LAND_MASK);

  return (
    <ProvinceSvg>
      <defs>
        <clipPath id="anatolia-landmask" clipPathUnits="userSpaceOnUse">
          <path d={landMaskPath} fillRule="evenodd" />
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

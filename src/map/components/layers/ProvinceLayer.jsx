import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";

function ProvinceLayer({ provinces, selectedProvinceId, onProvinceClick, mapStyle, mapShadows }) {
  return (
    <ProvinceSvg>
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

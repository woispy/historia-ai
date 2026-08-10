import ProvinceSvg from "../ProvinceSvg";
import ProvincePolygon from "../ProvincePolygon";

function ProvinceLayer({ provinces, selectedProvinceId, onProvinceClick }) {
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
        />
      ))}
    </ProvinceSvg>
  );
}

export default ProvinceLayer;

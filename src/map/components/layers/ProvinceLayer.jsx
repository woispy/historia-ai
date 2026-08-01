import MapProvince from "../MapProvince";

import MapProvinceLabel from "../MapProvinceLabel";

/**
 * ============================================================================
 * Historia AI
 * Province Layer
 * ============================================================================
 */

function ProvinceLayer({
  provinces,

  selectedProvinceId,

  onProvinceClick,
}) {
  return (
    <>
      {provinces.map((province) => (
        <MapProvince
          key={province.id}
          id={province.id}
          selected={
            province.id ===
            selectedProvinceId
          }
          onClick={
            onProvinceClick
          }
        >
          <MapProvinceLabel
            name={province.name}
          />
        </MapProvince>
      ))}
    </>
  );
}

export default ProvinceLayer;
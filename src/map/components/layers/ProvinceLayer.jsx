import Province from "../Province";
import ProvinceLabel from "../ProvinceLabel";

function ProvinceLayer({
  provinces,
  selectedProvince,
  onSelectProvince,
}) {
  return (
    <>
      {provinces.map((province) => (
        <Province
          key={province.id}
          id={province.id}
          selected={province.id === selectedProvince}
          onSelect={onSelectProvince}
        >
          <ProvinceLabel
            name={province.name}
          />
        </Province>
      ))}
    </>
  );
}

export default ProvinceLayer;
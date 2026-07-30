import Province from "./Province";
import ProvinceLabel from "./ProvinceLabel";

import {
  useProvinceSelection,
  useWorldMap,
} from "../hooks";

function WorldMap({ gameState }) {
  const { provinces } = useWorldMap(gameState);

  const {
    selectedProvince,
    selectProvince,
  } = useProvinceSelection();

  return (
    <div className="world-map">
      {provinces.map((province) => (
        <Province
          key={province.id}
          id={province.id}
          selected={
            province.id === selectedProvince
          }
          onSelect={selectProvince}
        >
          <ProvinceLabel
            name={province.name}
          />
        </Province>
      ))}
    </div>
  );
}

export default WorldMap;
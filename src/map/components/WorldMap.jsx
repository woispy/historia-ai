import {
  useProvinceSelection,
  useWorldMap,
} from "../hooks";

import { ProvinceLayer } from "./layers";

function WorldMap({ gameState }) {
  const { provinces } = useWorldMap(gameState);

  const {
    selectedProvince,
    selectProvince,
  } = useProvinceSelection();

  return (
    <div className="world-map">
      <ProvinceLayer
        provinces={provinces}
        selectedProvince={selectedProvince}
        onSelectProvince={selectProvince}
      />
    </div>
  );
}

export default WorldMap;
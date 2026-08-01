import {
  useWorldMap,
} from "../hooks";

import {
  ProvinceLayer,
} from "./layers";

/**
 * ============================================================================
 * Historia AI
 * World Map
 * ============================================================================
 *
 * Renders the current world map.
 *
 * Selection is managed by GameShell.
 */

function WorldMap({
  runtime,

  selectedProvinceId,

  onProvinceClick,
}) {
  const {
    provinces,
  } = useWorldMap(runtime);

  return (
    <div className="world-map">
      <ProvinceLayer
        provinces={provinces}
        selectedProvinceId={
          selectedProvinceId
        }
        onProvinceClick={
          onProvinceClick
        }
      />
    </div>
  );
}

export default WorldMap;
import {
  WORLD_LAND_PATH,
  WORLD_PHYSICAL_ATLAS,
} from "../../physical/WorldPhysicalAtlas";

function WorldPhysicalLayer() {
  return (
    <g aria-label="Global coastline authority" pointerEvents="none">
      <path
        d={WORLD_LAND_PATH}
        fill="none"
        stroke={WORLD_PHYSICAL_ATLAS.water.coastline}
        strokeWidth="0.10"
        strokeOpacity="0.72"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

import {
  WORLD_LAND_PATH,
  WORLD_PHYSICAL_ATLAS,
} from "../../physical/WorldPhysicalAtlas";

function WorldPhysicalLayer() {
  return (
    <g aria-label="Global physical geography">
      <defs>
        <clipPath id="world-landmask" clipPathUnits="userSpaceOnUse">
          <path d={WORLD_LAND_PATH} fillRule="nonzero" />
        </clipPath>
      </defs>

      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.water.fill}
        pointerEvents="none"
      />

      <path
        d={WORLD_LAND_PATH}
        fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
        stroke="none"
        fillRule="nonzero"
        pointerEvents="none"
      />

      <path
        d={WORLD_LAND_PATH}
        fill="none"
        stroke={WORLD_PHYSICAL_ATLAS.water.coastline}
        strokeWidth="0.10"
        strokeOpacity="0.70"
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

import { WORLD_LAND_PATH, WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

/**
 * A single authoritative land silhouette remains underneath every political
 * LOD. Political ownership may disappear during a vector/GPU transition, but
 * physical land must never disappear with it.
 */
function WorldPhysicalLayer() {
  return (
    <g aria-label="Global physical geography" pointerEvents="none">
      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.water.fill}
      />
      <path
        d={WORLD_LAND_PATH}
        fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
        fillRule="evenodd"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

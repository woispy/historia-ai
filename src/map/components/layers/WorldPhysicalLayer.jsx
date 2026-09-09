import { WORLD_LAND_PATH, WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

/**
 * Pass 1 — physical land.
 *
 * Water is no longer painted here. Pass 0 and passes 5–7 belong to the GPU
 * WaterRenderer and consume the same physical mask texture.
 */
function WorldPhysicalLayer() {
  return (
    <g aria-label="Global physical land" pointerEvents="none">
      <path
        d={WORLD_LAND_PATH}
        fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
        fillRule="evenodd"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

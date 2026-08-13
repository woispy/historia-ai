import { WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

function WorldPhysicalLayer() {
  return (
    <g aria-label="Global physical geography">
      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.water.fill}
        pointerEvents="none"
      />
      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
        pointerEvents="none"
        opacity="0.02"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

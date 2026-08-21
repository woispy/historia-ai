import { WORLD_LAND_PATH, WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

/**
 * Physical geography authority.
 *
 * The SVG land silhouette is deliberately retained at every LOD. The GPU
 * political compositor is an ownership layer, not a physical-land authority;
 * a missing or intentionally unowned province must never turn a real landmass
 * into ocean. This is especially important at world zoom where the political
 * raster is sparse relative to the full physical map.
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
        stroke={WORLD_PHYSICAL_ATLAS.water.coastline}
        strokeWidth="0.16"
        strokeOpacity="0.56"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

export default WorldPhysicalLayer;

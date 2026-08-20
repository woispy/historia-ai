import { getMapLod } from "../../rendering/CartographyModel";
import { WORLD_LAND_PATH, WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

/**
 * Physical geography authority.
 *
 * At world/regional LOD the WebGL political compositor already clips its
 * country-scale fill against the same 50m physical land mask. Keeping the SVG
 * land silhouette underneath it would duplicate that edge and make tiny
 * raster/vector differences look like a second map. The SVG land silhouette
 * therefore returns only when vector detail becomes active.
 */
function WorldPhysicalLayer({ zoom = 1 }) {
  const lod = getMapLod(zoom);
  const gpuOwnsLandSilhouette = lod === "world" || lod === "regional";

  return (
    <g aria-label="Global physical geography" pointerEvents="none">
      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.water.fill}
      />
      {!gpuOwnsLandSilhouette && (
        <path
          d={WORLD_LAND_PATH}
          fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
          fillRule="evenodd"
        />
      )}
    </g>
  );
}

export default WorldPhysicalLayer;

import { useEffect, useState } from "react";
import { WORLD_PHYSICAL_ATLAS } from "../../physical/WorldPhysicalAtlas";

/**
 * Physical geography authority.
 *
 * The heavy Natural Earth land geometry is a map-time resource. It is loaded
 * through an explicit dynamic import so the global geometry dataset cannot
 * enter the application bootstrap bundle. The physical layer remains the
 * single coastline/land authority once that resource is ready.
 */
function WorldPhysicalLayer() {
  const [landPath, setLandPath] = useState("");

  useEffect(() => {
    let cancelled = false;

    import("../../physical/WorldPhysicalAtlasRuntime.js")
      .then(({ WORLD_LAND_PATH }) => {
        if (!cancelled) setLandPath(WORLD_LAND_PATH);
      })
      .catch((error) => {
        console.error("[WorldPhysicalLayer] Failed to load world land geometry:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <g aria-label="Global physical geography" pointerEvents="none" aria-busy={!landPath}>
      <rect
        x={WORLD_PHYSICAL_ATLAS.bounds.minX}
        y={WORLD_PHYSICAL_ATLAS.bounds.minY}
        width={360}
        height={180}
        fill={WORLD_PHYSICAL_ATLAS.water.fill}
      />
      {landPath && (
        <path
          d={landPath}
          fill={WORLD_PHYSICAL_ATLAS.land.baseFill}
          fillRule="evenodd"
          stroke={WORLD_PHYSICAL_ATLAS.water.coastline}
          strokeWidth="0.16"
          strokeOpacity="0.56"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}

export default WorldPhysicalLayer;

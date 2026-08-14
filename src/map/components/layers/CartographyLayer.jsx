import { ANATOLIA_REGION_LABELS } from "../../data/CartographyAtlas.js";
import { shouldShowRegionLabels } from "../../rendering/CartographyModel.js";

function RegionLabels({ zoom }) {
  if (!shouldShowRegionLabels(zoom)) return null;

  return (
    <g aria-label="Historical regional labels" pointerEvents="none">
      {ANATOLIA_REGION_LABELS.map((region) => (
        <text
          key={region.id}
          x={region.x}
          y={region.y}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize={region.size}
          fontWeight="700"
          letterSpacing="0.06em"
          fill="#d4cbb2"
          fillOpacity="0.36"
          stroke="#121714"
          strokeWidth="0.035"
          paintOrder="stroke"
          vectorEffect="non-scaling-stroke"
        >
          {region.name}
        </text>
      ))}
    </g>
  );
}

/**
 * Strategic corridors, passes and crossings remain data-level simulation
 * anchors in CartographyAtlas, but are intentionally not drawn in the base
 * map. This keeps the strategic map clean and prevents decorative coloured
 * lines, dots and crossing symbols from being mistaken for geography.
 */
function CartographyLayer({ zoom = 1 }) {
  return (
    <g aria-label="Cartographic presentation">
      <RegionLabels zoom={zoom} />
    </g>
  );
}

export default CartographyLayer;

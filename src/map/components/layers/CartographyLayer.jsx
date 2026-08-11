import {
  ANATOLIA_REGION_LABELS,
  ANATOLIA_STRATEGIC_CORRIDORS,
  ANATOLIA_STRATEGIC_PASSES,
  ANATOLIA_STRATEGIC_CROSSINGS,
} from "../../data/CartographyAtlas.js";
import {
  shouldShowRegionLabels,
  shouldShowStrategicCorridors,
  shouldShowStrategicPasses,
} from "../../rendering/CartographyModel.js";

function pathFromPoints(points) {
  if (!Array.isArray(points) || points.length < 2) return "";
  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`)].join(" ");
}

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

function StrategicCorridors({ zoom }) {
  if (!shouldShowStrategicCorridors(zoom)) return null;

  return (
    <g aria-label="Strategic corridors" pointerEvents="none">
      {ANATOLIA_STRATEGIC_CORRIDORS.map((corridor) => {
        const opacity = Math.min(0.42, 0.16 + corridor.importance * 0.045);
        return (
          <path
            key={corridor.id}
            d={pathFromPoints(corridor.points)}
            fill="none"
            stroke={corridor.className === "coast" ? "#8aaeb7" : "#bda866"}
            strokeOpacity={opacity}
            strokeWidth={corridor.importance >= 5 ? 0.075 : 0.055}
            strokeDasharray={corridor.className === "pass" ? "0.18 0.12" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}

function StrategicPasses({ zoom }) {
  if (!shouldShowStrategicPasses(zoom)) return null;

  return (
    <g aria-label="Strategic passes and crossings" pointerEvents="none">
      {ANATOLIA_STRATEGIC_PASSES.map((pass) => (
        <g key={pass.id}>
          <circle cx={pass.x} cy={pass.y} r="0.085" fill="#cbb56c" fillOpacity="0.78" />
          <circle cx={pass.x} cy={pass.y} r="0.145" fill="none" stroke="#cbb56c" strokeOpacity="0.42" strokeWidth="0.035" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      {ANATOLIA_STRATEGIC_CROSSINGS.map((crossing) => (
        <g key={crossing.id}>
          <path
            d={`M ${crossing.x - 0.09} ${crossing.y - 0.09} L ${crossing.x + 0.09} ${crossing.y + 0.09} M ${crossing.x + 0.09} ${crossing.y - 0.09} L ${crossing.x - 0.09} ${crossing.y + 0.09}`}
            stroke="#78a5ae"
            strokeOpacity="0.62"
            strokeWidth="0.045"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </g>
  );
}

function CartographyLayer({ zoom = 1 }) {
  return (
    <g aria-label="Cartographic presentation">
      <RegionLabels zoom={zoom} />
      <StrategicCorridors zoom={zoom} />
      <StrategicPasses zoom={zoom} />
    </g>
  );
}

export default CartographyLayer;

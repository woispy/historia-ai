import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas";

const TIER_WEIGHT = Object.freeze({ capital: 3, major: 2, town: 1 });
const LABEL_CONFIG = Object.freeze({
  capital: { minZoom: 1.45, size: 0.42, widthFactor: 0.56 },
  major: { minZoom: 1.95, size: 0.31, widthFactor: 0.54 },
  town: { minZoom: 2.75, size: 0.25, widthFactor: 0.52 },
});

function mergeCityMetadata(city) {
  const atlas = getAnatoliaCityMapMetadata(city.id);
  if (!atlas) return null;

  return {
    ...city,
    map: atlas,
  };
}

function getVisibleCities(cities, zoom) {
  return cities
    .map(mergeCityMetadata)
    .filter(Boolean)
    .filter((city) => {
      if (zoom >= 3.1) return true;
      if (zoom >= 2.15) return city.map.tier !== "town";
      if (zoom >= 1.55) return city.map.tier === "capital" || city.map.tier === "major";
      return city.map.tier === "capital" || (city.map.tier === "major" && city.map.port);
    })
    .sort((a, b) => (TIER_WEIGHT[b.map.tier] ?? 0) - (TIER_WEIGHT[a.map.tier] ?? 0));
}

function getLabelCandidates(city) {
  const { x, y, tier } = city.map;
  const gap = tier === "capital" ? 0.16 : 0.12;
  const dx = city.map.labelDx ?? 0;
  const dy = city.map.labelDy ?? 0;

  return [
    { x: x + dx + 0.18 + gap, y: y + dy + 0.07, anchor: "start" },
    { x: x + dx, y: y + dy - 0.24 - gap, anchor: "middle" },
    { x: x + dx - 0.18 - gap, y: y + dy + 0.07, anchor: "end" },
    { x: x + dx, y: y + dy + 0.34 + gap, anchor: "middle" },
  ];
}

function estimateLabelBox(city, candidate, config) {
  const textWidth = Math.max(0.55, city.map.name.length * config.size * config.widthFactor);
  const halfWidth = textWidth / 2;
  const left = candidate.anchor === "start" ? candidate.x : candidate.x - halfWidth;
  const right = candidate.anchor === "end" ? candidate.x : candidate.x + halfWidth;
  const top = candidate.y - config.size * 0.72;
  const bottom = candidate.y + config.size * 0.22;

  return { left, right, top, bottom };
}

function boxesOverlap(a, b, padding = 0.08) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function placeLabels(cities, zoom) {
  const placed = [];
  const labels = [];

  for (const city of cities) {
    const config = LABEL_CONFIG[city.map.tier] ?? LABEL_CONFIG.town;
    if (zoom < config.minZoom) continue;

    const candidates = getLabelCandidates(city);
    let selected = null;

    for (const candidate of candidates) {
      const box = estimateLabelBox(city, candidate, config);
      const overlaps = placed.some((item) => boxesOverlap(box, item.box));
      if (!overlaps) {
        selected = { ...candidate, box };
        break;
      }
    }

    if (!selected) continue;
    placed.push(selected);
    labels.push({ city, config, ...selected });
  }

  return labels;
}

function CityMarker({ city, zoom, onClick }) {
  const { x, y, tier, port, fortified } = city.map;
  const radius = tier === "capital" ? 0.22 : tier === "major" ? 0.14 : 0.09;

  return (
    <g
      key={city.id}
      onClick={() => onClick?.(city.id)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={tier === "capital" ? "#f3d77c" : "#e9e2c8"}
        stroke="#171b18"
        strokeWidth="0.08"
        vectorEffect="non-scaling-stroke"
      />
      {fortified && zoom >= 2.5 && (
        <circle
          cx={x}
          cy={y}
          r={radius + 0.09}
          fill="none"
          stroke="#d5bd72"
          strokeWidth="0.05"
          strokeDasharray="0.14 0.12"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {port && zoom >= 2.3 && (
        <path
          d={`M ${x - 0.22} ${y - 0.22} L ${x + 0.22} ${y - 0.22}`}
          stroke="#79aeb9"
          strokeWidth="0.07"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}

function CityLabel({ city, config, x, y, anchor }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1,-1)`} pointerEvents="none">
      <text
        x="0"
        y="0"
        textAnchor={anchor}
        fontSize={config.size}
        fontFamily="Georgia, serif"
        fontWeight={city.map.tier === "capital" ? "700" : "600"}
        fill="#f3ecd8"
        stroke="#121613"
        strokeWidth="0.09"
        paintOrder="stroke"
        vectorEffect="non-scaling-stroke"
      >
        {city.map.name}
      </text>
    </g>
  );
}

function CityLayer({ cities = [], zoom = 1, onCityClick }) {
  const visibleCities = getVisibleCities(cities, zoom);
  const labels = placeLabels(visibleCities, zoom);

  return (
    <g aria-label="Historical cities">
      {visibleCities.map((city) => (
        <CityMarker key={city.id} city={city} zoom={zoom} onClick={onCityClick} />
      ))}
      {labels.map(({ city, config, x, y, anchor }) => (
        <CityLabel
          key={`${city.id}-label`}
          city={city}
          config={config}
          x={x}
          y={y}
          anchor={anchor}
        />
      ))}
    </g>
  );
}

export default CityLayer;

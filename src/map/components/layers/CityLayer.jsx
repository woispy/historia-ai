import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas.js";
import { getCityLabelPolicy, getMapLod } from "../../rendering/CartographyModel.js";

const TIER_WEIGHT = Object.freeze({ capital: 4, major: 3, town: 2, village: 1 });
const LABEL_CONFIG = Object.freeze({
  capital: { minZoom: 1.15, size: 0.30, widthFactor: 0.48 },
  major: { minZoom: 1.55, size: 0.22, widthFactor: 0.46 },
  town: { minZoom: 2.15, size: 0.17, widthFactor: 0.44 },
  village: { minZoom: 3.35, size: 0.13, widthFactor: 0.42 },
});

function mergeCityMetadata(city) {
  const atlas = getAnatoliaCityMapMetadata(city.id);
  if (!atlas) return null;
  return { ...city, map: atlas };
}

function getVisibleCities(cities, zoom) {
  const lod = getMapLod(zoom);
  const policy = getCityLabelPolicy(zoom);
  const visible = cities
    .map(mergeCityMetadata)
    .filter(Boolean)
    .filter((city) => {
      const tier = city.map.tier ?? "town";
      if (lod === "world") return tier === "capital" || (tier === "major" && city.map.port);
      if (lod === "regional") return tier === "capital" || tier === "major";
      if (lod === "province") return tier !== "village";
      return true;
    })
    .sort((a, b) => (TIER_WEIGHT[b.map.tier] ?? 0) - (TIER_WEIGHT[a.map.tier] ?? 0));

  return visible.slice(0, policy.maxLabels);
}

function getLabelCandidates(city) {
  const { x, y, tier } = city.map;
  const gap = tier === "capital" ? 0.12 : 0.09;
  const dx = city.map.labelDx ?? 0;
  const dy = city.map.labelDy ?? 0;

  return [
    { x: x + dx + 0.14 + gap, y: y + dy + 0.05, anchor: "start" },
    { x: x + dx, y: y + dy - 0.18 - gap, anchor: "middle" },
    { x: x + dx - 0.14 - gap, y: y + dy + 0.05, anchor: "end" },
    { x: x + dx, y: y + dy + 0.24 + gap, anchor: "middle" },
  ];
}

function estimateLabelBox(city, candidate, config) {
  const textWidth = Math.max(0.42, city.map.name.length * config.size * config.widthFactor);
  const halfWidth = textWidth / 2;
  const left = candidate.anchor === "start" ? candidate.x : candidate.x - halfWidth;
  const right = candidate.anchor === "end" ? candidate.x : candidate.x + halfWidth;
  const top = candidate.y - config.size * 0.72;
  const bottom = candidate.y + config.size * 0.22;
  return { left, right, top, bottom };
}

function boxesOverlap(a, b, padding = 0.055) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

function placeLabels(cities, zoom) {
  const policy = getCityLabelPolicy(zoom);
  const placed = [];
  const labels = [];

  for (const city of cities) {
    if (labels.length >= policy.maxLabels) break;
    const config = LABEL_CONFIG[city.map.tier] ?? LABEL_CONFIG.town;
    if (zoom < config.minZoom) continue;
    if (city.map.tier === "town" && !policy.showTowns) continue;
    if (city.map.tier === "village" && !policy.showVillages) continue;

    for (const candidate of getLabelCandidates(city)) {
      const box = estimateLabelBox(city, candidate, config);
      if (placed.some((item) => boxesOverlap(box, item.box))) continue;
      placed.push({ box });
      labels.push({ city, config, ...candidate });
      break;
    }
  }

  return labels;
}

function CityMarker({ city, zoom, onClick }) {
  const { x, y, tier, port, fortified } = city.map;
  const radius = tier === "capital" ? 0.14 : tier === "major" ? 0.095 : tier === "town" ? 0.065 : 0.045;
  const isCapital = tier === "capital";
  const detailed = zoom >= 2.55;

  return (
    <g key={city.id} onClick={() => onClick?.(city.id, city.map)} style={{ cursor: onClick ? "pointer" : "default" }}>
      {isCapital && <circle cx={x} cy={y} r={radius + 0.055} fill="none" stroke="#d9bf68" strokeOpacity="0.75" strokeWidth="0.045" vectorEffect="non-scaling-stroke" />}
      <circle cx={x} cy={y} r={radius} fill={isCapital ? "#f0d276" : "#e8e1c9"} stroke="#151916" strokeWidth="0.045" vectorEffect="non-scaling-stroke" />
      {fortified && detailed && <circle cx={x} cy={y} r={radius + 0.075} fill="none" stroke="#cbb76f" strokeOpacity="0.72" strokeWidth="0.035" strokeDasharray="0.12 0.10" vectorEffect="non-scaling-stroke" />}
      {port && zoom >= 2.0 && <path d={`M ${x - 0.15} ${y - 0.15} L ${x + 0.15} ${y - 0.15}`} stroke="#6f9fa9" strokeWidth="0.045" vectorEffect="non-scaling-stroke" />}
    </g>
  );
}

function CityLabel({ city, config, x, y, anchor }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1,-1)`} pointerEvents="none">
      <text x="0" y="0" textAnchor={anchor} fontSize={config.size} fontFamily="Georgia, serif" fontWeight={city.map.tier === "capital" ? "700" : "600"} fill="#eee7d1" stroke="#151916" strokeWidth="0.055" paintOrder="stroke" vectorEffect="non-scaling-stroke">
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
      {visibleCities.map((city) => <CityMarker key={city.id} city={city} zoom={zoom} onClick={onCityClick} />)}
      {labels.map(({ city, config, x, y, anchor }) => <CityLabel key={`${city.id}-label`} city={city} config={config} x={x} y={y} anchor={anchor} />)}
    </g>
  );
}

export default CityLayer;

import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas";

const TIER_WEIGHT = Object.freeze({ capital: 3, major: 2, town: 1 });

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
      if (zoom >= 3) return true;
      if (zoom >= 1.8) return city.map.tier !== "town";
      return city.map.tier === "capital" || city.map.tier === "major" && city.map.port;
    })
    .sort((a, b) => (TIER_WEIGHT[b.map.tier] ?? 0) - (TIER_WEIGHT[a.map.tier] ?? 0));
}

function CityMarker({ city, zoom, onClick }) {
  const { x, y, tier, port, fortified } = city.map;
  const radius = tier === "capital" ? 0.24 : tier === "major" ? 0.17 : 0.11;
  const labelSize = tier === "capital" ? 0.82 : tier === "major" ? 0.66 : 0.54;

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
        strokeWidth="0.09"
        vectorEffect="non-scaling-stroke"
      />
      {fortified && zoom >= 2.4 && (
        <circle
          cx={x}
          cy={y}
          r={radius + 0.10}
          fill="none"
          stroke="#f3d77c"
          strokeWidth="0.06"
          strokeDasharray="0.15 0.12"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {port && zoom >= 2.1 && (
        <path
          d={`M ${x - 0.28} ${y - 0.28} L ${x + 0.28} ${y - 0.28}`}
          stroke="#8cc8d9"
          strokeWidth="0.09"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <g transform={`translate(${x + radius + 0.14} ${y + 0.08}) scale(1,-1)`} pointerEvents="none">
        <text
          x="0"
          y="0"
          fontSize={labelSize}
          fontFamily="Georgia, serif"
          fontWeight={tier === "capital" ? "700" : "600"}
          fill="#f5ecd1"
          stroke="#121613"
          strokeWidth="0.16"
          paintOrder="stroke"
          vectorEffect="non-scaling-stroke"
        >
          {city.map.name}
        </text>
      </g>
    </g>
  );
}

function CityLayer({ cities = [], zoom = 1, onCityClick }) {
  const visibleCities = getVisibleCities(cities, zoom);

  return (
    <g aria-label="Historical cities">
      {visibleCities.map((city) => (
        <CityMarker key={city.id} city={city} zoom={zoom} onClick={onCityClick} />
      ))}
    </g>
  );
}

export default CityLayer;

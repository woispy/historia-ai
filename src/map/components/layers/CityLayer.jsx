import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas.js";
import { getMapLod } from "../../rendering/CartographyModel.js";
import {
  getCityVisualStyle,
  layoutCityLabels,
  selectVisibleCities,
} from "../../rendering/city/CityLabelLayout.js";

function mergeCityMetadata(city) {
  const atlas = getAnatoliaCityMapMetadata(city.id);
  if (!atlas) return null;
  return { ...city, map: atlas };
}

function getVisibleCities(cities, zoom) {
  const mapped = cities.map(mergeCityMetadata).filter(Boolean);
  return selectVisibleCities(mapped, zoom);
}

function CityMarker({ city, zoom, onClick }) {
  const { x, y, tier, port, fortified } = city.map;
  const { radius } = getCityVisualStyle(city, zoom);
  const isCapital = tier === "capital";
  const detailed = zoom >= 2.55;

  return (
    <g key={city.id} onClick={() => onClick?.(city.id, city.map)} style={{ cursor: onClick ? "pointer" : "default" }}>
      {isCapital && (
        <circle
          cx={x}
          cy={y}
          r={radius + 0.055}
          fill="none"
          stroke="#d9bf68"
          strokeOpacity="0.72"
          strokeWidth="0.90"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={isCapital ? "#f0d276" : "#e8e1c9"}
        stroke="#151916"
        strokeWidth="0.80"
        vectorEffect="non-scaling-stroke"
      />
      {fortified && detailed && (
        <circle
          cx={x}
          cy={y}
          r={radius + 0.055}
          fill="none"
          stroke="#cbb76f"
          strokeOpacity="0.62"
          strokeWidth="0.70"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {port && zoom >= 2.0 && (
        <path
          d={`M ${x - 0.12} ${y - 0.12} L ${x + 0.12} ${y - 0.12}`}
          stroke="#6f9fa9"
          strokeWidth="0.80"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}

function CityLabel({ city, fontSize, x, y, anchor }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1,-1)`} pointerEvents="none">
      <text
        x="0"
        y="0"
        textAnchor={anchor}
        fontSize={fontSize}
        fontFamily="Georgia, serif"
        fontWeight={city.map.tier === "capital" ? "700" : "600"}
        fill="#eee7d1"
        stroke="#151916"
        strokeWidth="0.65"
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
  const labels = layoutCityLabels(visibleCities, zoom);
  const lod = getMapLod(zoom);

  return (
    <g aria-label={`Historical cities (${lod} LOD)`}>
      {visibleCities.map((city) => (
        <CityMarker key={city.id} city={city} zoom={zoom} onClick={onCityClick} />
      ))}
      {labels.map(({ city, fontSize, x, y, anchor }) => (
        <CityLabel
          key={`${city.id}-label`}
          city={city}
          fontSize={fontSize}
          x={x}
          y={y}
          anchor={anchor}
        />
      ))}
    </g>
  );
}

export default CityLayer;

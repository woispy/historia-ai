import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas.js";
import { getMapLod } from "../../rendering/CartographyModel.js";
import {
  getCityVisualStyle,
  layoutCityLabels,
  selectVisibleCities,
} from "../../rendering/city/CityLabelLayout.js";

const WORLD_WIDTH = 360;

function mergeCityMetadata(city) {
  const atlas = getAnatoliaCityMapMetadata(city.id);
  if (!atlas) return null;
  return { ...city, map: atlas };
}

function longitudeDelta(a, b) {
  let delta = Number(a) - Number(b);
  while (delta > 180) delta -= WORLD_WIDTH;
  while (delta < -180) delta += WORLD_WIDTH;
  return delta;
}

function isCityInViewport(city, camera, padding = 0.18) {
  if (!camera) return true;
  const zoom = Math.max(0.001, Number(camera.zoom) || 1);
  const viewWidth = WORLD_WIDTH / zoom;
  const viewHeight = 180 / zoom;
  const horizontalPadding = viewWidth * padding;
  const verticalPadding = viewHeight * padding;
  return (
    Math.abs(longitudeDelta(city.map.x, camera.x ?? 0)) <= viewWidth / 2 + horizontalPadding
    && Math.abs(city.map.y - Number(camera.y ?? 0)) <= viewHeight / 2 + verticalPadding
  );
}

function getVisibleCities(cities, zoom, camera) {
  const mapped = cities.map(mergeCityMetadata).filter(Boolean);
  const viewportCities = mapped.filter((city) => isCityInViewport(city, camera));
  return selectVisibleCities(viewportCities, zoom);
}

function CityMarker({ city, zoom, onClick }) {
  const { x, y, tier } = city.map;
  const { radius } = getCityVisualStyle(city, zoom);
  const isCapital = tier === "capital";

  return (
    <g
      key={city.id}
      onClick={() => onClick?.(city.id, city.map)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {isCapital && (
        <circle
          cx={x}
          cy={y}
          r={radius + 0.055}
          fill="none"
          stroke="#d9bf68"
          strokeOpacity="0.72"
          strokeWidth="1.15"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={isCapital ? "#f0d276" : "#e8e1c9"}
        stroke="#151916"
        strokeWidth="1.00"
        vectorEffect="non-scaling-stroke"
      />
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
        fillOpacity="0.96"
        stroke="#071011"
        strokeOpacity="0.82"
        strokeWidth="0.035"
        paintOrder="stroke"
      >
        {city.map.name}
      </text>
    </g>
  );
}

function CityLayer({ cities = [], zoom = 1, camera, onCityClick }) {
  const visibleCities = getVisibleCities(cities, zoom, camera);
  const labels = layoutCityLabels(visibleCities, zoom, camera);
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

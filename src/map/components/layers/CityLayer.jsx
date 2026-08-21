import { getAnatoliaCityMapMetadata } from "../../data/AnatoliaCityAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas.js";
import { WORLD_LAND_POLYGONS } from "../../physical/WorldPhysicalAtlas.js";
import { getMapLod } from "../../rendering/CartographyModel.js";
import { validateCityPhysicalPosition } from "../../rendering/physical/PhysicalGeometryValidation.js";
import {
  getCityVisualStyle,
  layoutCityLabels,
  selectVisibleCities,
} from "../../rendering/city/CityLabelLayout.js";

const WORLD_WIDTH = 360;

function mergeCityMetadata(city) {
  const atlas = getAnatoliaCityMapMetadata(city.id);
  if (!atlas) return null;

  const physical = validateCityPhysicalPosition(
    atlas,
    WORLD_LAND_POLYGONS,
    ANATOLIA_PHYSICAL_ATLAS.lakes,
  );

  if (!physical.valid) return null;
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
  return Math.abs(longitudeDelta(city.map.x, camera.x ?? 0)) <= viewWidth / 2 + viewWidth * padding
    && Math.abs(city.map.y - Number(camera.y ?? 0)) <= viewHeight / 2 + viewHeight * padding;
}

function getVisibleCities(cities, zoom, camera) {
  const mapped = cities.map(mergeCityMetadata).filter(Boolean);
  return selectVisibleCities(mapped.filter((city) => isCityInViewport(city, camera)), zoom);
}

function CityMarker({ city, zoom, selected, onClick }) {
  const { x, y, tier } = city.map;
  const { radius, markerScreenScale } = getCityVisualStyle(city, zoom);
  const isCapital = tier === "capital";
  const selectedRadius = radius + (selected ? 0.06 : 0);

  return (
    <g
      key={city.id}
      transform={`translate(${x} ${y}) scale(${markerScreenScale})`}
      onClick={() => onClick?.(city.id, city.map)}
      style={{ cursor: onClick ? "pointer" : "default" }}
      aria-label={`${city.map.name}${selected ? " selected" : ""}`}
      aria-selected={selected}
    >
      {(isCapital || selected) && (
        <circle
          cx="0"
          cy="0"
          r={selectedRadius + 0.055}
          fill="none"
          stroke={selected ? "#f4e5a8" : "#d9bf68"}
          strokeOpacity={selected ? "0.96" : "0.72"}
          strokeWidth={selected ? "1.35" : "1.15"}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx="0"
        cy="0"
        r={selectedRadius}
        fill={selected ? "#fff0a6" : isCapital ? "#f0d276" : "#e8e1c9"}
        stroke="#151916"
        strokeWidth="1.00"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function CityLabel({ city, fontSize, screenScale, x, y, anchor }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${screenScale} ${-screenScale})`} pointerEvents="none">
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

function CityLayer({ cities = [], zoom = 1, camera, selectedCityId = null, onCityClick }) {
  const visibleCities = getVisibleCities(cities, zoom, camera);
  const labels = layoutCityLabels(visibleCities, zoom, camera);
  const lod = getMapLod(zoom);

  return (
    <g aria-label={`Historical cities (${lod} LOD)`}>
      {visibleCities.map((city) => (
        <CityMarker
          key={city.id}
          city={city}
          zoom={zoom}
          selected={city.id === selectedCityId}
          onClick={onCityClick}
        />
      ))}
      {labels.map(({ city, fontSize, screenScale, x, y, anchor }) => (
        <CityLabel key={`${city.id}-label`} city={city} fontSize={fontSize} screenScale={screenScale} x={x} y={y} anchor={anchor} />
      ))}
    </g>
  );
}

export default CityLayer;

export { getVisibleCities, mergeCityMetadata };

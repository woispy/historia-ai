/**
 * Historia AI — Province Polygon
 *
 * The SVG path remains the interaction and selection surface. Visual province
 * fills can be supplied by the texture compositor so coastline clipping does
 * not require thousands of vector fragments during camera movement.
 */

import { useMemo } from "react";

function buildPathData(polygons) {
  if (!Array.isArray(polygons)) return "";

  return polygons
    .map((polygon) => {
      if (!Array.isArray(polygon) || polygon.length < 3) return "";
      const [first, ...rest] = polygon;
      return [
        `M ${first[0]} ${first[1]}`,
        ...rest.map(([x, y]) => `L ${x} ${y}`),
        "Z",
      ].join(" ");
    })
    .filter(Boolean)
    .join(" ");
}

function ProvincePolygon({
  province,
  country,
  geometry,
  selected,
  onClick,
  mapStyle = "detailed",
  zoom = 1,
  renderFill = true,
}) {
  const d = useMemo(
    () => buildPathData(geometry?.polygons),
    [geometry?.polygons],
  );

  if (!d) return null;

  const isTerrain = mapStyle === "terrain";
  const fill = selected
    ? "#d6b04d"
    : isTerrain
      ? country?.terrainColor ?? country?.color ?? "#6f765f"
      : country?.color ?? "#6f765f";

  const fillOpacity = zoom < 1.35 ? 0.88 : zoom < 1.9 ? 0.94 : 1;
  const visualFill = renderFill || selected ? fill : "rgba(0,0,0,0)";
  const visualOpacity = renderFill || selected ? fillOpacity : 0;

  return (
    <path
      d={d}
      fill={visualFill}
      fillOpacity={visualOpacity}
      stroke="none"
      pointerEvents="all"
      style={{ cursor: "pointer", pointerEvents: "all" }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(province.id);
      }}
    />
  );
}

export default ProvincePolygon;

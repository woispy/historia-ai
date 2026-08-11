/**
 * Historia AI — Province Polygon
 *
 * Province fills are deliberately rendered without their own border stroke.
 * Phase 2D can represent one province with many cartographic sub-polygons;
 * the dedicated ProvinceBoundaryLayer owns the shared border topology so
 * internal geometry fragments never create fake province borders.
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

  const fillOpacity = zoom < 1.35
    ? 0.88
    : zoom < 1.9
      ? 0.94
      : 1;

  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={selected ? "#f3d77c" : "none"}
      strokeWidth={selected ? 0.28 : 0}
      vectorEffect="non-scaling-stroke"
      style={{ cursor: "pointer" }}
      onClick={() => onClick?.(province.id)}
    />
  );
}

export default ProvincePolygon;

/**
 * Historia AI — Province Polygon
 *
 * The SVG path remains the interaction and selection surface. Visual province
 * fills can be supplied by the texture compositor so coastline clipping does
 * not require thousands of vector fragments during camera movement.
 *
 * P3: geometry/path generation is stable data. React should not reconcile
 * unchanged province paths merely because the camera is moving.
 */

import { memo, useMemo } from "react";

function ringPath(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return "";
  const [first, ...rest] = ring;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
}

function buildPathData(polygons, holes = []) {
  if (!Array.isArray(polygons)) return "";
  return [...polygons, ...(Array.isArray(holes) ? holes : [])]
    .map(ringPath)
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
    () => buildPathData(geometry?.polygons, geometry?.holes),
    [geometry?.polygons, geometry?.holes],
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
      fillRule="evenodd"
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

export default memo(ProvincePolygon);

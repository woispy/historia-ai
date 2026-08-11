/**
 * Historia AI — Province Polygon
 *
 * Phase 2 presentation rules follow a grand-strategy hierarchy:
 * country color first, province borders second, physical geography above it.
 * Political geometry is still clipped by the global physical land mask in
 * WorldMap, so no historical province can paint the sea.
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
  mapShadows = true,
  zoom = 1,
}) {
  const d = useMemo(
    () => buildPathData(geometry?.polygons),
    [geometry?.polygons],
  );

  if (!d) return null;

  const isPolitical = mapStyle === "political";
  const isTerrain = mapStyle === "terrain";
  const borderPrecision = Number(province.historical?.borderPrecision ?? 2);
  const approximateBorder = borderPrecision <= 1;
  const sourceDerived = province.historical?.classification !== "curated-regional-gameplay-overlay";

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

  const stroke = selected
    ? "#f3d77c"
    : isPolitical
      ? "#1b1e1a"
      : "#30342e";

  const strokeWidth = selected
    ? 0.28
    : zoom >= 2.2
      ? 0.08
      : zoom >= 1.45
        ? 0.06
        : 0.04;

  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={approximateBorder ? "0.42 0.28" : undefined}
      strokeOpacity={approximateBorder && mapShadows ? 0.58 : sourceDerived ? 0.84 : 1}
      vectorEffect="non-scaling-stroke"
      style={{ cursor: "pointer" }}
      onClick={() => onClick?.(province.id)}
    />
  );
}

export default ProvincePolygon;

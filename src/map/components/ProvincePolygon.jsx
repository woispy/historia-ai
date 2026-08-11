/**
 * Historia AI — Province Polygon
 *
 * Curated Anatolia regions are clipped to a physical land mask so the political
 * overlay cannot paint the Marmara, Aegean or Mediterranean as land.
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
}) {
  const d = useMemo(
    () => buildPathData(geometry?.polygons),
    [geometry?.polygons],
  );

  if (!d) return null;

  const isPolitical = mapStyle === "political";
  const isTerrain = mapStyle === "terrain";
  const borderPrecision = Number(province.historical?.borderPrecision ?? 3);
  const approximateBorder = borderPrecision <= 1;
  const isCuratedRegional = province.historical?.classification === "curated-regional-gameplay-overlay";

  const fill = selected
    ? "#d6b04d"
    : isTerrain
      ? country?.terrainColor ?? country?.color ?? "#6f765f"
      : country?.color ?? "#6f765f";

  const stroke = selected
    ? "#f3d77c"
    : isPolitical
      ? "#191d19"
      : "#30352e";

  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={selected ? "0.28" : isPolitical ? "0.11" : "0.15"}
      strokeDasharray={approximateBorder ? "0.55 0.35" : undefined}
      strokeOpacity={approximateBorder && mapShadows ? "0.78" : "1"}
      vectorEffect="non-scaling-stroke"
      clipPath={isCuratedRegional ? "url(#anatolia-landmask)" : undefined}
      style={{ cursor: "pointer" }}
      onClick={() => onClick?.(province.id)}
    />
  );
}

export default ProvincePolygon;

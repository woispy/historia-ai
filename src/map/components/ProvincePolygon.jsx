/**
 * Historia AI — Province Polygon
 *
 * Rendering is intentionally filter-free. Thousands of SVG paths can be on
 * screen at once, so visual separation is achieved with vector strokes rather
 * than per-path CSS filters.
 */
function ProvincePolygon({
  province,
  country,
  geometry,
  selected,
  onClick,
  mapStyle = "detailed",
  mapShadows = true,
}) {
  if (!geometry || !geometry.polygons) return null;

  const d = geometry.polygons
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

  if (!d) return null;

  const isPolitical = mapStyle === "political";
  const isTerrain = mapStyle === "terrain";
  const borderPrecision = Number(province.historical?.borderPrecision ?? 3);
  const approximateBorder = borderPrecision <= 1;

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
      style={{ cursor: "pointer" }}
      onClick={() => onClick?.(province.id)}
    />
  );
}

export default ProvincePolygon;

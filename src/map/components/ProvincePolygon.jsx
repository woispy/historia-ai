/**
 * Historia AI — Province Polygon
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

  // Antarctica is intentionally omitted from the political layer at far zoom.
  if (province.geometryId === "geometry_country_ata" || province.geometryId === "geometry_country_atf") {
    return null;
  }

  const d = geometry.polygons.map((polygon) => {
    if (polygon.length === 0) return "";
    const [first, ...rest] = polygon;
    return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
  }).join(" ");

  const isPolitical = mapStyle === "political";
  const isTerrain = mapStyle === "terrain";
  const fill = selected
    ? "#d6b04d"
    : isTerrain
      ? country?.terrainColor ?? country?.color ?? "#6f765f"
      : country?.color ?? "#6f765f";

  return (
    <path
      d={d}
      fill={fill}
      stroke={isPolitical ? "#191d19" : "#30352e"}
      strokeWidth={selected ? "0.28" : isPolitical ? "0.11" : "0.15"}
      vectorEffect="non-scaling-stroke"
      style={{
        cursor: "pointer",
        filter: mapShadows ? "drop-shadow(0 0 0.15px rgba(0,0,0,.35))" : "none",
      }}
      onClick={() => onClick?.(province.id)}
    />
  );
}

export default ProvincePolygon;

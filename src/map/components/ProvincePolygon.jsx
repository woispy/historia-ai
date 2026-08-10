/**
 * ============================================================================
 * Historia AI
 * Province Polygon
 * ============================================================================
 */

function ProvincePolygon({
  province,
  country,
  geometry,
  selected,
  onClick,
}) {
  if (
    !geometry ||
    !geometry.polygons
  ) {
    return null;
  }

  const d =
    geometry.polygons
      .map((polygon) => {
        if (
          polygon.length === 0
        ) {
          return "";
        }

        const [
          first,
          ...rest
        ] = polygon;

        return [
          `M ${first[0]} ${first[1]}`,

          ...rest.map(
            ([x, y]) =>
              `L ${x} ${y}`
          ),

          "Z",
        ].join(" ");
      })
      .join(" ");

  const countryColor =
    country?.color ??
    "#6f765f";

  return (
    <path
      d={d}
      fill={
        selected
          ? "#d6b04d"
          : countryColor
      }
      stroke="#20251f"
      strokeWidth="0.15"
      vectorEffect="non-scaling-stroke"
      onClick={() =>
        onClick?.(
          province.id
        )
      }
      style={{
        cursor: "pointer",
      }}
    />
  );
}

export default ProvincePolygon;

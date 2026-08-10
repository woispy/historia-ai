/**
 * ============================================================================
 * Historia AI
 * Province Polygon
 * ============================================================================
 */

function ProvincePolygon({
  province,
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

  return (
    <path
      d={d}
      fill={
        selected
          ? "#d6b04d"
          : "#5d7c4f"
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
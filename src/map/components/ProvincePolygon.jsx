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
  if (!geometry) {
    return null;
  }

  const points =
    geometry.polygon
      .map(
        ([x, y]) =>
          `${x},${y}`
      )
      .join(" ");

  return (
    <g
      transform={`
        translate(
          ${geometry.position.x},
          ${geometry.position.y}
        )
      `}
    >
      <polygon
        points={points}
        fill={
          selected
            ? "#d6b04d"
            : "#5d7c4f"
        }
        stroke="#20251f"
        strokeWidth="2"
        onClick={() =>
          onClick?.(
            province.id
          )
        }
        style={{
          cursor: "pointer",
        }}
      />
    </g>
  );
}

export default ProvincePolygon;
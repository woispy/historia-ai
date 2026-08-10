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

  // The current Phase 1 source is Natural Earth admin-0. Antarctica and the
  // French Southern Lands are not useful political provinces for the 1300
  // gameplay layer and otherwise dominate the far-zoom composition.
  if (
    province.geometryId === "geometry_country_ata" ||
    province.geometryId === "geometry_country_atf"
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

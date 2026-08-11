import { buildProvinceTopology } from "../../rendering/province/ProvinceTopology";

function borderPath(border) {
  return `M ${border.start[0]} ${border.start[1]} L ${border.end[0]} ${border.end[1]}`;
}

function ProvinceBoundaryLayer({ provinces = [], zoom = 1 }) {
  const topology = buildProvinceTopology(provinces);
  const countryBorders = topology.borderSegments.filter((border) => border.kind === "country");
  const provinceBorders = topology.borderSegments.filter((border) => border.kind === "province");

  return (
    <g aria-label="Historical province topology" pointerEvents="none">
      {zoom >= 1.25 && provinceBorders.map((border) => (
        <path
          key={`province-${border.key}`}
          d={borderPath(border)}
          fill="none"
          stroke="#2a2d28"
          strokeOpacity={zoom >= 2.25 ? 0.72 : 0.42}
          strokeWidth={zoom >= 2.25 ? 0.075 : 0.055}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {countryBorders.map((border) => (
        <path
          key={`country-${border.key}`}
          d={borderPath(border)}
          fill="none"
          stroke="#171b18"
          strokeOpacity={zoom >= 1.7 ? 0.92 : 0.76}
          strokeWidth={zoom >= 2.25 ? 0.15 : 0.12}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

export default ProvinceBoundaryLayer;

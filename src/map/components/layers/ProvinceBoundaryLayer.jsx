import { memo, useMemo } from "react";
import { buildProvinceTopology } from "../../rendering/province/ProvinceTopology";
import { getProvincePresentation } from "../../rendering/CartographyModel";

function borderPath(border) {
  return `M ${border.start[0]} ${border.start[1]} L ${border.end[0]} ${border.end[1]}`;
}

function ProvinceBoundaryLayer({ provinces = [], zoom = 1 }) {
  const topology = useMemo(() => buildProvinceTopology(provinces), [provinces]);
  const presentation = getProvincePresentation(zoom);
  const countryBorders = topology.borderSegments.filter((border) => border.kind === "country");
  const provinceBorders = topology.borderSegments.filter((border) => border.kind === "province");
  const provinceStroke = presentation.lod === "regional" ? 0.72 : presentation.lod === "province" ? 0.82 : 0.95;
  const countryStroke = presentation.lod === "detailed" ? 1.25 : presentation.lod === "city" ? 1.15 : 1.00;

  return (
    <g aria-label="Historical province topology" pointerEvents="none">
      {presentation.showProvinceBoundaries && provinceBorders.map((border, index) => (
        <path
          key={`province-${border.key}-${index}`}
          d={borderPath(border)}
          fill="none"
          stroke="#2a2d28"
          strokeOpacity={presentation.boundaryOpacity}
          strokeWidth={provinceStroke}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {countryBorders.map((border, index) => (
        <path
          key={`country-${border.key}-${index}`}
          d={borderPath(border)}
          fill="none"
          stroke="#171b18"
          strokeOpacity={presentation.lod === "world" ? 0.70 : 0.92}
          strokeWidth={countryStroke}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

export default memo(ProvinceBoundaryLayer, (previous, next) => (
  previous.provinces === next.provinces
  && previous.zoom === next.zoom
));

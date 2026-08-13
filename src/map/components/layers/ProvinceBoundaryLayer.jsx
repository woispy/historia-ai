import { useMemo } from "react";
import { buildProvinceTopology } from "../../rendering/province/ProvinceTopology";
import { getProvincePresentation } from "../../rendering/CartographyModel";

function borderPath(border) {
  return `M ${border.start[0]} ${border.start[1]} L ${border.end[0]} ${border.end[1]}`;
}

function isRuntimeProvince(entry) {
  return entry?.province?.historical?.classification !== "curated-regional-gameplay-overlay";
}

function ProvinceBoundaryLayer({ provinces = [], zoom = 1 }) {
  const runtimeProvinces = useMemo(
    () => provinces.filter(isRuntimeProvince),
    [provinces],
  );
  const topology = useMemo(
    () => buildProvinceTopology(runtimeProvinces),
    [runtimeProvinces],
  );
  const countryBorders = topology.borderSegments.filter((border) => border.kind === "country");
  const provinceBorders = topology.borderSegments.filter((border) => border.kind === "province");
  const presentation = getProvincePresentation(zoom);

  return (
    <g aria-label="Historical province topology" pointerEvents="none">
      {presentation.showProvinceBoundaries && provinceBorders.map((border) => (
        <path
          key={`province-${border.key}`}
          d={borderPath(border)}
          fill="none"
          stroke="#2a2d28"
          strokeOpacity={presentation.boundaryOpacity}
          strokeWidth={presentation.lod === "regional" ? 0.055 : 0.075}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {countryBorders.map((border) => (
        <path
          key={`country-${border.key}`}
          d={borderPath(border)}
          fill="none"
          stroke="#171b18"
          strokeOpacity={presentation.lod === "world" ? 0.70 : 0.92}
          strokeWidth={presentation.lod === "detailed" ? 0.15 : 0.12}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

export default ProvinceBoundaryLayer;

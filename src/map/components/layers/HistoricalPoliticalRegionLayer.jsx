import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { getHistoricalPoliticalOverlayMode } from "./HistoricalPoliticalOverlayModel";

const HISTORICAL_1300_DATE = "1300-01-01";
const DEFAULT_POLITICAL_COLOR = "#6f765f";
const HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID = "historical-anatolia-political-land-clip";
const HISTORICAL_POLITICAL_CARTOGRAPHIC_FILTER_ID = "historical-political-cartographic-border";
const COASTAL_POLITICAL_EXPANSION = 0.08;
const BORDER_KEY_PRECISION = 5;
const CARTOGRAPHIC_BOW = 0.008;

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

function pointKey(point) {
  return `${Number(point[0]).toFixed(BORDER_KEY_PRECISION)}:${Number(point[1]).toFixed(BORDER_KEY_PRECISION)}`;
}

function edgeKey(start, end) {
  const a = pointKey(start);
  const b = pointKey(end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function deterministicBoundaryBow(key) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) / 4294967295;
  return (normalized - 0.5) * 2;
}

function buildCartographicInternalBoundaryPath(provinces) {
  const edges = new Map();

  for (const entry of provinces) {
    for (const polygon of entry?.geometry?.polygons ?? []) {
      if (!Array.isArray(polygon) || polygon.length < 3) continue;
      for (let index = 0; index < polygon.length; index += 1) {
        const start = polygon[index];
        const end = polygon[(index + 1) % polygon.length];
        if (!Array.isArray(start) || !Array.isArray(end)) continue;
        const key = edgeKey(start, end);
        const current = edges.get(key);
        if (current) {
          current.count += 1;
        } else {
          edges.set(key, { key, start, end, count: 1 });
        }
      }
    }
  }

  return [...edges.values()]
    .filter((edge) => edge.count >= 2)
    .map(({ key, start, end }) => {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const normal = [-dy / length, dx / length];
      const bow = deterministicBoundaryBow(key) * CARTOGRAPHIC_BOW;
      const oneThird = [
        start[0] + dx / 3 + normal[0] * bow,
        start[1] + dy / 3 + normal[1] * bow,
      ];
      const twoThirds = [
        start[0] + (dx * 2) / 3 + normal[0] * bow,
        start[1] + (dy * 2) / 3 + normal[1] * bow,
      ];
      return `M ${start[0]} ${start[1]} C ${oneThird[0]} ${oneThird[1]} ${twoThirds[0]} ${twoThirds[1]} ${end[0]} ${end[1]}`;
    })
    .join(" ");
}

function PoliticalOverlayDefs() {
  const anatoliaLandPath = polygonPath(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.landPolygons);

  return (
    <defs>
      <clipPath id={HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={anatoliaLandPath} fillRule="evenodd" />
      </clipPath>
      <filter
        id={HISTORICAL_POLITICAL_CARTOGRAPHIC_FILTER_ID}
        x="-8%"
        y="-8%"
        width="116%"
        height="116%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.035 0.09"
          numOctaves="1"
          seed="1300"
          result="cartographicNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="cartographicNoise"
          scale="0.012"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <pattern id="historical-suzerainty-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.30)" strokeWidth="2.5" />
      </pattern>
      <pattern id="historical-contested-hatch" width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M -2 2 L 2 -2 M 0 9 L 9 0 M 7 11 L 11 7" stroke="rgba(255,255,255,0.26)" strokeWidth="1.4" />
      </pattern>
      <pattern id="historical-neutral-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 0 0 L 8 8 M 8 0 L 0 8" stroke="rgba(20,24,20,0.18)" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

function getPoliticalColor(entry) {
  return entry?.historicalPolitical?.color
    ?? entry?.country?.color
    ?? DEFAULT_POLITICAL_COLOR;
}

function getPoliticalFillOpacity(mode) {
  if (mode === "neutral") return 0.72;
  if (mode === "contested") return 0.82;
  if (mode === "suzerainty") return 0.88;
  return 0.90;
}

function getPoliticalClipPath(entry) {
  if (entry?.historicalProvince?.geometryAuthority === "anatolia-curated") {
    return `url(#${HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID})`;
  }
  return "url(#world-land-mask)";
}

function isCoastalCuratedProvince(entry) {
  return entry?.historicalProvince?.geometryAuthority === "anatolia-curated"
    && (entry?.historicalProvince?.coastal === true || entry?.historicalProvince?.port === true);
}

function HistoricalPoliticalRegionLayer({ date = HISTORICAL_1300_DATE, provinces = [] }) {
  if (date !== HISTORICAL_1300_DATE) return null;

  const cartographicInternalBoundaryPath = buildCartographicInternalBoundaryPath(provinces);

  return (
    <g pointerEvents="none">
      <PoliticalOverlayDefs />
      <g clipPath="url(#world-land-mask)">
        <rect
          x="-180"
          y="-90"
          width="360"
          height="180"
          fill={DEFAULT_POLITICAL_COLOR}
          fillOpacity="0.24"
          aria-label="Historical unassigned land presentation"
        />
      </g>
      {provinces.map((entry) => {
        const d = buildPathData(entry?.geometry?.polygons);
        if (!d) return null;

        const mode = getHistoricalPoliticalOverlayMode(entry);
        const color = getPoliticalColor(entry);
        const pattern = mode === "suzerainty"
          ? "url(#historical-suzerainty-hatch)"
          : mode === "contested"
            ? "url(#historical-contested-hatch)"
            : mode === "neutral"
              ? "url(#historical-neutral-hatch)"
              : null;
        const clipPath = getPoliticalClipPath(entry);
        const coastal = isCoastalCuratedProvince(entry);

        return (
          <g key={entry?.province?.id ?? entry?.historicalProvince?.id} clipPath={clipPath}>
            {coastal && (
              <path
                d={d}
                fill={color}
                fillOpacity={getPoliticalFillOpacity(mode)}
                stroke={color}
                strokeWidth={COASTAL_POLITICAL_EXPANSION}
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden="true"
              />
            )}
            <path
              d={d}
              fill={color}
              fillOpacity={getPoliticalFillOpacity(mode)}
              stroke="none"
              vectorEffect="non-scaling-stroke"
              pointerEvents="all"
              style={{ pointerEvents: "all" }}
            />
            {pattern && (
              <path
                d={d}
                fill={pattern}
                fillOpacity={mode === "neutral" ? 0.42 : 0.55}
                stroke="none"
              />
            )}
          </g>
        );
      })}
      {cartographicInternalBoundaryPath && (
        <path
          d={cartographicInternalBoundaryPath}
          fill="none"
          stroke="rgba(24,30,24,0.42)"
          strokeWidth="0.42"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${HISTORICAL_POLITICAL_CARTOGRAPHIC_FILTER_ID})`}
          pointerEvents="none"
          aria-label="Cartographic historical province boundaries"
        />
      )}
    </g>
  );
}

export { buildCartographicInternalBoundaryPath };
export default HistoricalPoliticalRegionLayer;

import { getHistoricalPoliticalOverlayMode } from "./HistoricalPoliticalOverlayModel";

const HISTORICAL_1300_DATE = "1300-01-01";
const DEFAULT_POLITICAL_COLOR = "#6f765f";

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

function PoliticalOverlayDefs() {
  return (
    <defs>
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

function HistoricalPoliticalRegionLayer({ date = HISTORICAL_1300_DATE, provinces = [] }) {
  if (date !== HISTORICAL_1300_DATE) return null;

  return (
    <g clipPath="url(#world-land-mask)" pointerEvents="none">
      <PoliticalOverlayDefs />
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

        return (
          <g key={entry?.province?.id ?? entry?.historicalProvince?.id}>
            <path
              d={d}
              fill={color}
              fillOpacity={getPoliticalFillOpacity(mode)}
              stroke="none"
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
    </g>
  );
}

export default HistoricalPoliticalRegionLayer;

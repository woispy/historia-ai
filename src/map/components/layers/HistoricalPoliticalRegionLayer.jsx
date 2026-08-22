import historicalAtlas from "../../../../data/gis/1300/regional/anatolia-byzantium.json";
import { getHistoricalPolity } from "../../../world/map/historical/HistoricalPoliticalRuntime";

const POLITY_OVERRIDE_BY_REGION = Object.freeze({
  // The source overlay predates the verified 1 Jan 1300 control review and
  // labels this western area as Aydinid. Aydinid control begins in 1308, so
  // the 1300 visual uses the Byzantine/pre-Aydinid frontier identity instead.
  anatolia_aydin: "byzantium",
});

const CONTESTED_REGION_IDS = new Set([
  "anatolia_ottomans",
  "anatolia_aydin",
  "anatolia_sahibata",
  "anatolia_candar",
]);

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

function RegionStyleDefs() {
  return (
    <defs>
      <pattern id="historical-suzerainty-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.28)" strokeWidth="3" />
      </pattern>
      <pattern id="historical-contested-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M -2 2 L 2 -2 M 0 8 L 8 0 M 6 10 L 10 6" stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
}

function HistoricalPoliticalRegionLayer({ date = "1300-01-01" }) {
  if (date !== "1300-01-01") return null;

  const regions = Array.isArray(historicalAtlas?.regions) ? historicalAtlas.regions : [];

  return (
    <g clipPath="url(#world-land-mask)" pointerEvents="none">
      <RegionStyleDefs />
      {regions.map((region) => {
        const polityId = POLITY_OVERRIDE_BY_REGION[region.id] ?? region.countryId;
        const polity = getHistoricalPolity(polityId);
        if (!polity) return null;

        const d = buildPathData(region.polygons);
        if (!d) return null;

        const contested = CONTESTED_REGION_IDS.has(region.id);
        const suzerainty = polityId === "ilkhanate";

        return (
          <g key={region.id}>
            <path
              d={d}
              fill={polity.color}
              fillOpacity={0.88}
              stroke={contested ? "rgba(255,255,255,0.82)" : "rgba(20,24,20,0.82)"}
              strokeWidth={contested ? 0.11 : 0.08}
              vectorEffect="non-scaling-stroke"
            />
            {suzerainty && (
              <path d={d} fill="url(#historical-suzerainty-hatch)" fillOpacity={0.78} />
            )}
            {contested && (
              <path d={d} fill="url(#historical-contested-hatch)" fillOpacity={0.58} />
            )}
          </g>
        );
      })}
    </g>
  );
}

export default HistoricalPoliticalRegionLayer;

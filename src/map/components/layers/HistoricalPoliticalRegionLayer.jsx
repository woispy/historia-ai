import { ANATOLIA_PHYSICAL_ATLAS } from "../../data/AnatoliaPhysicalAtlas.js";
import { WORLD_LAND_PATH } from "../../physical/WorldPhysicalAtlas.js";
import { getHistoricalPoliticalOverlayMode } from "./HistoricalPoliticalOverlayModel";

const HISTORICAL_1300_DATE = "1300-01-01";
const DEFAULT_POLITICAL_COLOR = "#6f765f";
const HISTORICAL_WORLD_POLITICAL_CLIP_ID = "historical-world-political-land-clip";
const HISTORICAL_WORLD_SOURCE_MASK_ID = "historical-world-source-outside-anatolia-mask";
const COASTAL_POLITICAL_EXPANSION = 0.08;

const SOURCE_POLITICAL_PALETTE = [
  "#6A1B9A", "#0F7A32", "#B87333", "#786A9D",
  "#3E7C59", "#7B6840", "#8C5A2B", "#A33F3F",
  "#4A7896", "#8B4A62", "#8A6F3D", "#477A68",
  "#7C5C8F", "#9A5A42", "#5E7891", "#6F7B45",
];

const SOURCE_POLITICAL_ALIASES = new Map([
  ["byzantine empire", "#6A1B9A"], ["byzantium", "#6A1B9A"],
  ["ottomans", "#0F7A32"], ["osmanoğulları", "#0F7A32"],
  ["karasi", "#B87333"], ["karesi", "#B87333"],
  ["saruhan", "#786A9D"], ["menteşe", "#3E7C59"], ["mentese", "#3E7C59"],
  ["eşref", "#7B6840"], ["esref", "#7B6840"], ["germiyan", "#8C5A2B"],
  ["karaman", "#A33F3F"], ["pervâneoğlu", "#6B7280"], ["pervane", "#6B7280"],
  ["candar", "#7A6A3A"], ["trebizond", "#4A7896"], ["cilicia", "#8B4A62"],
]);

// Historical GIS regions are used only as coarse parent envelopes for the
// province tessellation. They are never allowed to paint directly inside the
// Anatolia override; that responsibility belongs exclusively to the curated
// province layer below. This prevents the old large legacy colour blocks from
// returning while still preserving the historical source as a boundary hint.
const HISTORICAL_REGION_BY_PROVINCE = Object.freeze({
  "bithynia-nicomedia": "anatolia_byzantium_bithynia",
  "bithynia-nicaea": "anatolia_byzantium_bithynia",
  "bithynia-prusa": "anatolia_byzantium_bithynia",

  "bithynia-sangarios": "anatolia_ottomans",
  "phrygia-sogut": "anatolia_ottomans",
  "phrygia-bilecik": "anatolia_ottomans",
  "phrygia-eskisehir": "anatolia_ottomans",

  "mysia-balikesir": "anatolia_karasi",
  "mysia-pergamon": "anatolia_karasi",

  "lydia-magnesia": "anatolia_saruhan",
  "lydia-smyrna": "anatolia_saruhan",

  // Aydinid ownership is deliberately NOT assigned at 1300. The TDV entry
  // dates the foundation/control expansion to 1308, so these two provinces
  // remain historical-neutral rather than receiving an anachronistic fill.
  "ionia-ayasuluk": null,
  "lydia-birgi": null,

  "caria-tralleis": "anatolia_mentese",
  "caria-mylasa": "anatolia_mentese",
  "caria-pecin": "anatolia_mentese",
  "caria-halikarnassos": "anatolia_mentese",

  "phrygia-denizli": "anatolia_germiyan",
  "phrygia-kutahya": "anatolia_germiyan",
  "phrygia-afyon": "anatolia_sahibata",
  "phrygia-uluborlu": "anatolia_hamid",
  "pisidia-egirdir": "anatolia_hamid",
  "pisidia-beysehir": "anatolia_esref",

  "galatia-ankara": "anatolia_ilkhanate",
  "cappadocia-kayseri": "anatolia_ilkhanate",
  "cappadocia-sivas": "anatolia_ilkhanate",
  "lycaonia-konya": "anatolia_karaman",
  "lycaonia-larende": "anatolia_karaman",

  "pontus-sinop": null,
  "pontus-amisos": null,
  "pontus-amasya": "anatolia_ilkhanate",
  "pontus-kastamon": "anatolia_candar",
  "pontus-trebizond": "anatolia_trebizond",
  "eastern-anatolia-erzincan": "anatolia_ilkhanate",
  "eastern-anatolia-erzurum": "anatolia_ilkhanate",

  "cilicia-sis": "anatolia_cilicia",
  "cilicia-tarsos": "anatolia_cilicia",
  "cilicia-alaiye": "anatolia_cilicia",
});

function buildPathData(polygons) {
  if (!Array.isArray(polygons)) return "";
  return polygons.map((polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return "";
    const [first, ...rest] = polygon;
    return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`), "Z"].join(" ");
  }).filter(Boolean).join(" ");
}

const ANATOLIA_LAND_PATH = buildPathData(ANATOLIA_PHYSICAL_ATLAS.landPolygons);

function PoliticalOverlayDefs({ regions }) {
  return (
    <defs>
      <clipPath id={HISTORICAL_WORLD_POLITICAL_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={WORLD_LAND_PATH} fillRule="evenodd" />
      </clipPath>

      <mask
        id={HISTORICAL_WORLD_SOURCE_MASK_ID}
        maskUnits="userSpaceOnUse"
        x="-180"
        y="-90"
        width="360"
        height="180"
      >
        <rect x="-180" y="-90" width="360" height="180" fill="black" />
        <path d={WORLD_LAND_PATH} fill="white" fillRule="evenodd" />
        <path
          d={ANATOLIA_LAND_PATH}
          fill="black"
          fillRule="evenodd"
          stroke="black"
          strokeWidth={COASTAL_POLITICAL_EXPANSION}
          strokeLinejoin="round"
        />
      </mask>

      {(regions ?? []).map((region) => {
        const d = buildPathData(region?.geometry?.polygons);
        if (!d || !region?.id) return null;
        return (
          <clipPath
            key={`historical-region-clip-${region.id}`}
            id={`historical-region-clip-${region.id}`}
            clipPathUnits="userSpaceOnUse"
          >
            <path d={d} fillRule="evenodd" />
          </clipPath>
        );
      })}

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
  return entry?.historicalPolitical?.color ?? entry?.country?.color ?? DEFAULT_POLITICAL_COLOR;
}

function getPoliticalFillOpacity(mode) {
  if (mode === "neutral") return 0.78;
  if (mode === "contested") return 0.86;
  if (mode === "suzerainty") return 0.90;
  return 0.94;
}

function normalizeSourceSubject(subject) {
  return String(subject ?? "").trim().toLocaleLowerCase("tr-TR").replace(/[’']/g, "'").replace(/\s+/g, " ");
}

function getStableSourceColor(subject) {
  const normalized = normalizeSourceSubject(subject);
  if (!normalized) return DEFAULT_POLITICAL_COLOR;
  return SOURCE_POLITICAL_ALIASES.get(normalized)
    ?? SOURCE_POLITICAL_PALETTE[Math.abs([...normalized].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) | 0, 7)) % SOURCE_POLITICAL_PALETTE.length];
}

function HistoricalWorldRegionPaths({ regions = [] }) {
  return regions.map((region) => {
    const d = buildPathData(region?.geometry?.polygons);
    if (!d) return null;
    return (
      <path
        key={`historical-world-${region.id ?? region.sourceName}`}
        d={d}
        fill={getStableSourceColor(region.subject)}
        fillOpacity={region.borderPrecision >= 3 ? 0.96 : 0.88}
        stroke="rgba(24,30,24,0.48)"
        strokeWidth="0.42"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    );
  });
}

function getProvinceId(entry) {
  return entry?.province?.id
    ?? entry?.historicalProvince?.id
    ?? entry?.id
    ?? null;
}

function getHistoricalProvince(entry) {
  return entry?.historicalProvince
    ?? entry?.province?.historicalProvince
    ?? entry?.province?.historical
    ?? null;
}

function isCuratedAnatoliaProvince(entry) {
  const historical = getHistoricalProvince(entry);
  return historical?.classification === "phase2d-anatolia-province-geometry";
}

function isCoastalProvince(entry) {
  const historical = getHistoricalProvince(entry);
  return historical?.coastal === true
    || historical?.port === true
    || historical?.terrain === "coast";
}

function renderProvinceBase(entry) {
  const d = buildPathData(entry?.geometry?.polygons);
  if (!d) return null;

  const mode = getHistoricalPoliticalOverlayMode(entry);
  const color = getPoliticalColor(entry);
  const fillOpacity = getPoliticalFillOpacity(mode);
  const pattern = mode === "suzerainty"
    ? "url(#historical-suzerainty-hatch)"
    : mode === "contested"
      ? "url(#historical-contested-hatch)"
      : mode === "neutral"
        ? "url(#historical-neutral-hatch)"
        : null;

  return { d, mode, color, fillOpacity, pattern };
}

function getRegionClipId(provinceId) {
  const regionId = HISTORICAL_REGION_BY_PROVINCE[provinceId];
  return regionId ? `url(#historical-region-clip-${regionId})` : null;
}

function HistoricalPoliticalRegionLayer({ date = HISTORICAL_1300_DATE, provinces = [], regions = [] }) {
  if (date !== HISTORICAL_1300_DATE) return null;

  const curatedProvinces = provinces.filter(isCuratedAnatoliaProvince);
  const nonAnatoliaRegions = regions.filter(
    (region) => !String(region?.id ?? "").startsWith("anatolia_")
  );

  return (
    <g pointerEvents="none" aria-label="1300 historical political map">
      <PoliticalOverlayDefs regions={regions} />
      <g clipPath={`url(#${HISTORICAL_WORLD_POLITICAL_CLIP_ID})`}>
        <rect x="-180" y="-90" width="360" height="180" fill={DEFAULT_POLITICAL_COLOR} fillOpacity="0.12" aria-label="Historical unassigned land presentation" />

        {/*
         * Legacy Anatolia regional polygons are intentionally excluded here.
         * The historical GIS remains a research/boundary source, but the
         * visible Anatolian political map is now province-authoritative.
         */}
        <g mask={`url(#${HISTORICAL_WORLD_SOURCE_MASK_ID})`}>
          <HistoricalWorldRegionPaths regions={nonAnatoliaRegions} />
        </g>

        {/*
         * First pass closes coastal coverage. The expansion is deliberately
         * tiny and only applied to coastal/port provinces. The enclosing
         * world-land clip is the final authority, so political colour cannot
         * enter the sea.
         */}
        <g>
          {curatedProvinces.map((entry) => {
            if (!isCoastalProvince(entry)) return null;
            const base = renderProvinceBase(entry);
            if (!base) return null;
            const provinceId = getProvinceId(entry);
            const regionClip = getRegionClipId(provinceId);
            return (
              <path
                key={`coastal-closure-${provinceId}`}
                d={base.d}
                clipPath={regionClip ?? undefined}
                fill={base.color}
                fillOpacity={base.fillOpacity}
                stroke={base.color}
                strokeOpacity={base.fillOpacity}
                strokeWidth={COASTAL_POLITICAL_EXPANSION}
                strokeLinejoin="round"
              />
            );
          })}
        </g>

        <g>
          {curatedProvinces.map((entry) => {
            const base = renderProvinceBase(entry);
            if (!base) return null;

            const provinceId = getProvinceId(entry);
            const regionClip = getRegionClipId(provinceId);

            return (
              <g key={provinceId} clipPath={regionClip ?? undefined}>
                <path
                  d={base.d}
                  fill={base.color}
                  fillOpacity={base.fillOpacity}
                  stroke="rgba(24,30,24,0.78)"
                  strokeWidth="0.72"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
                {base.pattern && <path d={base.d} fill={base.pattern} fillOpacity={base.mode === "neutral" ? 0.30 : 0.46} stroke="none" />}
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
}

export default HistoricalPoliticalRegionLayer;

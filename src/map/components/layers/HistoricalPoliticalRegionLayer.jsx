import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../data/AnatoliaProvinceMetadata.js";
import { polygonPath } from "../../rendering/physical/PhysicalGeometryPath.js";
import { getHistoricalPoliticalOverlayMode } from "./HistoricalPoliticalOverlayModel";

const HISTORICAL_1300_DATE = "1300-01-01";
const DEFAULT_POLITICAL_COLOR = "#6f765f";
const HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID = "historical-anatolia-political-land-clip";
const POLITICAL_BBOX = [25.2, 35.5, 45.0, 42.5];
const SITE_EPSILON = 1e-9;

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
  const anatoliaLandPath = polygonPath(ANATOLIA_PHYSICAL_ATLAS_RUNTIME.landPolygons);

  return (
    <defs>
      <clipPath id={HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID} clipPathUnits="userSpaceOnUse">
        <path d={anatoliaLandPath} fillRule="evenodd" />
      </clipPath>
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
  if (mode === "neutral") return 0.78;
  if (mode === "contested") return 0.84;
  if (mode === "suzerainty") return 0.90;
  return 0.94;
}

function clipHalfPlane(polygon, a, b, c) {
  if (!polygon.length) return [];
  const output = [];
  const inside = (point) => a * point[0] + b * point[1] <= c + SITE_EPSILON;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentInside = inside(current);
    const nextInside = inside(next);

    if (currentInside && nextInside) {
      output.push(next);
      continue;
    }

    if (currentInside !== nextInside) {
      const currentValue = a * current[0] + b * current[1] - c;
      const nextValue = a * next[0] + b * next[1] - c;
      const denominator = currentValue - nextValue;
      const t = Math.abs(denominator) < SITE_EPSILON ? 0 : currentValue / denominator;
      output.push([
        current[0] + (next[0] - current[0]) * t,
        current[1] + (next[1] - current[1]) * t,
      ]);
    }

    if (!currentInside && nextInside) output.push(next);
  }

  return output;
}

function buildVoronoiCell(siteIndex, sites) {
  const site = sites[siteIndex].point;
  let polygon = [
    [POLITICAL_BBOX[0], POLITICAL_BBOX[1]],
    [POLITICAL_BBOX[2], POLITICAL_BBOX[1]],
    [POLITICAL_BBOX[2], POLITICAL_BBOX[3]],
    [POLITICAL_BBOX[0], POLITICAL_BBOX[3]],
  ];

  for (let otherIndex = 0; otherIndex < sites.length; otherIndex += 1) {
    if (siteIndex === otherIndex) continue;
    const other = sites[otherIndex].point;
    const a = 2 * (other[0] - site[0]);
    const b = 2 * (other[1] - site[1]);
    const c = other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2;
    polygon = clipHalfPlane(polygon, a, b, c);
    if (polygon.length < 3) return [];
  }

  return polygon;
}

function buildCuratedPoliticalCells(entries) {
  const entryById = new Map(
    entries
      .filter((entry) => entry?.historicalProvince?.geometryAuthority === "anatolia-curated")
      .map((entry) => [entry.historicalProvince.id ?? entry.province?.id, entry]),
  );

  const sites = ANATOLIA_PROVINCE_METADATA.map((province) => ({
    provinceId: province.id,
    point: province.centroid,
  }));

  return sites.map((site, index) => ({
    province: ANATOLIA_PROVINCE_METADATA.find(({ id }) => id === site.provinceId),
    entry: entryById.get(site.provinceId),
    polygon: buildVoronoiCell(index, sites),
  })).filter(({ entry, polygon }) => entry && polygon.length >= 3);
}

function buildSourcePoliticalPath(entry) {
  if (entry?.historicalProvince?.geometryAuthority === "anatolia-curated") return "";
  return buildPathData(entry?.geometry?.polygons);
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

function renderPoliticalPresentation(entry, d, key, clipPath) {
  const mode = getHistoricalPoliticalOverlayMode(entry);
  const color = getPoliticalColor(entry);
  const pattern = mode === "suzerainty"
    ? "url(#historical-suzerainty-hatch)"
    : mode === "contested"
      ? "url(#historical-contested-hatch)"
      : mode === "neutral"
        ? "url(#historical-neutral-hatch)"
        : null;
  const coastal = isCoastalCuratedProvince(entry);

  return (
    <g key={key} clipPath={clipPath}>
      {coastal && (
        <path
          d={d}
          fill={color}
          fillOpacity={getPoliticalFillOpacity(mode)}
          stroke={color}
          strokeWidth="0.10"
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden="true"
        />
      )}
      <path
        d={d}
        fill={color}
        fillOpacity={getPoliticalFillOpacity(mode)}
        stroke="rgba(24,30,24,0.48)"
        strokeWidth="0.055"
        strokeLinejoin="round"
      />
      {pattern && (
        <path
          d={d}
          fill={pattern}
          fillOpacity={mode === "neutral" ? 0.45 : 0.58}
          stroke="none"
        />
      )}
    </g>
  );
}

function HistoricalPoliticalRegionLayer({ date = HISTORICAL_1300_DATE, provinces = [] }) {
  if (date !== HISTORICAL_1300_DATE) return null;

  const curatedCells = buildCuratedPoliticalCells(provinces);
  const sourceEntries = provinces.filter(
    (entry) => entry?.historicalProvince?.geometryAuthority !== "anatolia-curated",
  );

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

      {sourceEntries.map((entry) => {
        const d = buildSourcePoliticalPath(entry);
        if (!d) return null;
        return renderPoliticalPresentation(
          entry,
          d,
          entry?.province?.id ?? entry?.historicalProvince?.id,
          getPoliticalClipPath(entry),
        );
      })}

      <g clipPath={`url(#${HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID})`}>
        {curatedCells.map(({ province, entry, polygon }) => {
          const d = buildPathData([polygon]);
          if (!d) return null;
          return renderPoliticalPresentation(
            entry,
            d,
            `curated-${province.id}`,
            `url(#${HISTORICAL_ANATOLIA_POLITICAL_CLIP_ID})`,
          );
        })}
      </g>
    </g>
  );
}

export default HistoricalPoliticalRegionLayer;

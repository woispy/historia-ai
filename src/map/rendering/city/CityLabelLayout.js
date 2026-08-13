/**
 * Historia AI — adaptive city label layout.
 *
 * Labels are placed in map-space, but rendered with an explicit inverse camera
 * scale so typography remains stable on screen instead of growing with the
 * SVG viewBox zoom. Placement is deterministic: important cities reserve
 * space first, then lower-tier labels yield when they collide.
 */

export const CITY_LABEL_TIERS = Object.freeze({
  capital: Object.freeze({ priority: 100, minZoom: 0.95, screenMapSize: 3.20, markerRadius: 0.18 }),
  major: Object.freeze({ priority: 70, minZoom: 1.35, screenMapSize: 2.70, markerRadius: 0.13 }),
  town: Object.freeze({ priority: 40, minZoom: 2.15, screenMapSize: 2.25, markerRadius: 0.095 }),
  village: Object.freeze({ priority: 15, minZoom: 3.45, screenMapSize: 1.90, markerRadius: 0.065 }),
});

const LABEL_BUDGET = Object.freeze({
  world: 6,
  regional: 12,
  province: 18,
  city: 24,
  detailed: 32,
});

const MARKER_BUDGET = Object.freeze({
  world: 8,
  regional: 16,
  province: 26,
  city: 34,
  detailed: 48,
});

const LOD_BY_ZOOM = Object.freeze([
  [1.15, "world"],
  [1.75, "regional"],
  [2.55, "province"],
  [3.35, "city"],
]);

function getLod(zoom) {
  for (const [threshold, lod] of LOD_BY_ZOOM) {
    if (zoom < threshold) return lod;
  }
  return "detailed";
}

function tierOf(city) {
  return city?.map?.tier ?? "town";
}

function tierConfig(city) {
  return CITY_LABEL_TIERS[tierOf(city)] ?? CITY_LABEL_TIERS.town;
}

function compareCityPriority(a, b) {
  const aConfig = tierConfig(a);
  const bConfig = tierConfig(b);
  if (aConfig.priority !== bConfig.priority) return bConfig.priority - aConfig.priority;
  if (Boolean(a.map?.port) !== Boolean(b.map?.port)) return Number(Boolean(b.map?.port)) - Number(Boolean(a.map?.port));
  return String(a.map?.name ?? a.id).localeCompare(String(b.map?.name ?? b.id));
}

function getInverseZoomScale(zoom) {
  return 1 / Math.max(0.85, Number(zoom) || 1);
}

export function getCityVisualStyle(city, zoom = 1) {
  const config = tierConfig(city);
  const safeZoom = Math.max(0.85, Number(zoom) || 1);
  const labelScale = getInverseZoomScale(safeZoom);
  const layoutFontSize = config.screenMapSize * labelScale;
  return Object.freeze({
    radius: config.markerRadius,
    fontSize: config.screenMapSize,
    layoutFontSize,
    labelScale,
    priority: config.priority,
    minZoom: config.minZoom,
  });
}

export function getCityMarkerBudget(zoom = 1) {
  return MARKER_BUDGET[getLod(zoom)];
}

export function getCityLabelBudget(zoom = 1) {
  return LABEL_BUDGET[getLod(zoom)];
}

function getCandidates(city) {
  const { x, y, tier } = city.map;
  const config = tierConfig(city);
  const gap = tier === "capital" ? 0.15 : tier === "major" ? 0.12 : 0.09;
  const dx = city.map.labelDx ?? 0;
  const dy = city.map.labelDy ?? 0;
  const side = config.screenMapSize * 0.12;

  return [
    { x: x + dx + gap + side, y: y + dy + 0.04, anchor: "start" },
    { x: x + dx, y: y + dy - gap - side, anchor: "middle" },
    { x: x + dx - gap - side, y: y + dy + 0.04, anchor: "end" },
    { x: x + dx, y: y + dy + gap + side, anchor: "middle" },
    { x: x + dx + gap, y: y + dy - gap, anchor: "start" },
    { x: x + dx - gap, y: y + dy - gap, anchor: "end" },
  ];
}

function estimateTextWidth(city, fontSize) {
  const characters = String(city.map?.name ?? city.id).length;
  return Math.max(0.34, characters * fontSize * 0.44);
}

function labelBox(city, candidate, fontSize) {
  const width = estimateTextWidth(city, fontSize);
  const halfWidth = width / 2;
  const left = candidate.anchor === "start" ? candidate.x : candidate.anchor === "end" ? candidate.x - width : candidate.x - halfWidth;
  const right = candidate.anchor === "start" ? candidate.x + width : candidate.anchor === "end" ? candidate.x : candidate.x + halfWidth;
  const top = candidate.y - fontSize * 0.76;
  const bottom = candidate.y + fontSize * 0.22;
  return { left, right, top, bottom };
}

function markerBox(city) {
  const radius = tierConfig(city).markerRadius + 0.045;
  return { left: city.map.x - radius, right: city.map.x + radius, top: city.map.y - radius, bottom: city.map.y + radius };
}

export function boxesOverlap(a, b, padding = 0.045) {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
}

export function selectVisibleCities(cities, zoom = 1) {
  const budget = getCityMarkerBudget(zoom);
  return [...cities]
    .filter((city) => tierConfig(city).minZoom <= zoom || tierOf(city) === "capital")
    .sort(compareCityPriority)
    .slice(0, budget);
}

export function layoutCityLabels(cities, zoom = 1) {
  const budget = getCityLabelBudget(zoom);
  const placed = [];
  const labels = [];

  for (const city of [...cities].sort(compareCityPriority)) {
    if (labels.length >= budget) break;
    const style = getCityVisualStyle(city, zoom);
    if (zoom < style.minZoom) continue;

    for (const candidate of getCandidates(city)) {
      const box = labelBox(city, candidate, style.layoutFontSize);
      const blockedByMarker = cities.some((other) => other.id !== city.id && boxesOverlap(box, markerBox(other), 0.02));
      if (blockedByMarker) continue;
      if (placed.some((item) => boxesOverlap(box, item.box))) continue;

      placed.push({ box });
      labels.push({
        city,
        ...candidate,
        fontSize: style.fontSize,
        labelScale: style.labelScale,
        priority: style.priority,
      });
      break;
    }
  }

  return labels;
}

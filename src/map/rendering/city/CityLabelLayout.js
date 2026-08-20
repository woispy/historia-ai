/**
 * Historia AI — deterministic city label layout.
 *
 * City markers and labels are screen-stable, budgeted and LOD-aware. World
 * view deliberately shows only a few capital/strategic labels; smaller names
 * are not rendered until the camera is close enough to make them useful.
 */

export const CITY_LABEL_TIERS = Object.freeze({
  capital: Object.freeze({ priority: 100, minZoom: 1.00, baseSize: 0.36, markerRadius: 0.11 }),
  major: Object.freeze({ priority: 70, minZoom: 1.45, baseSize: 0.30, markerRadius: 0.085 }),
  town: Object.freeze({ priority: 40, minZoom: 2.65, baseSize: 0.27, markerRadius: 0.060 }),
  village: Object.freeze({ priority: 15, minZoom: 4.75, baseSize: 0.23, markerRadius: 0.045 }),
});

const LABEL_BUDGET = Object.freeze({ world: 3, regional: 7, province: 12, city: 18, detailed: 24 });
const MARKER_BUDGET = Object.freeze({ world: 5, regional: 12, province: 20, city: 30, detailed: 42 });
const LOD_BY_ZOOM = Object.freeze([[1.20, "world"], [1.85, "regional"], [2.65, "province"], [3.50, "city"]]);

const SCREEN_STABLE_SIZE = 1.15;
const MIN_AUTHORED_FONT_SIZE = 0.045;
const MIN_AUTHORED_MARKER_RADIUS = 0.020;
const MIN_RENDER_SCALE = 0.20;

function getLod(zoom) {
  for (const [threshold, lod] of LOD_BY_ZOOM) if (zoom < threshold) return lod;
  return "detailed";
}
function tierOf(city) { return city?.map?.tier ?? "town"; }
function tierConfig(city) { return CITY_LABEL_TIERS[tierOf(city)] ?? CITY_LABEL_TIERS.town; }
function compareCityPriority(a, b) {
  const aConfig = tierConfig(a), bConfig = tierConfig(b);
  if (aConfig.priority !== bConfig.priority) return bConfig.priority - aConfig.priority;
  if (Boolean(a.map?.port) !== Boolean(b.map?.port)) return Number(Boolean(b.map?.port)) - Number(Boolean(a.map?.port));
  return String(a.map?.name ?? a.id).localeCompare(String(b.map?.name ?? b.id));
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function getSafeZoom(zoom) { return Math.max(1, Number(zoom) || 1); }
function getScreenStableWorldSize(city, zoom) { return (tierConfig(city).baseSize * SCREEN_STABLE_SIZE) / getSafeZoom(zoom); }
function getScreenStableMarkerSize(city, zoom) { return (tierConfig(city).markerRadius * SCREEN_STABLE_SIZE) / getSafeZoom(zoom); }

export function getCityVisualStyle(city, zoom = 1) {
  const config = tierConfig(city), safeZoom = getSafeZoom(zoom);
  const screenStableWorldSize = getScreenStableWorldSize(city, safeZoom);
  const authoredFontSize = Math.max(MIN_AUTHORED_FONT_SIZE, screenStableWorldSize);
  const screenScale = clamp(screenStableWorldSize / authoredFontSize, MIN_RENDER_SCALE, 1);
  const authoredMarkerRadius = Math.max(MIN_AUTHORED_MARKER_RADIUS, getScreenStableMarkerSize(city, safeZoom));
  const markerScreenScale = clamp(getScreenStableMarkerSize(city, safeZoom) / authoredMarkerRadius, MIN_RENDER_SCALE, 1);
  return Object.freeze({
    radius: authoredMarkerRadius,
    screenScale,
    effectiveFontSize: authoredFontSize * screenScale,
    screenSize: authoredFontSize * screenScale * safeZoom,
    markerScreenScale,
    screenRadius: authoredMarkerRadius * markerScreenScale * safeZoom,
    fontSize: authoredFontSize,
    priority: config.priority,
    minZoom: config.minZoom,
  });
}

export function getCityMarkerBudget(zoom = 1) { return MARKER_BUDGET[getLod(zoom)]; }
export function getCityLabelBudget(zoom = 1) { return LABEL_BUDGET[getLod(zoom)]; }
function getCandidates(city, fontSize) {
  const { x, y, tier } = city.map, dx = Number(city.map.labelDx ?? 0), dy = Number(city.map.labelDy ?? 0);
  const gap = Math.max(tier === "capital" ? 0.14 : 0.11, fontSize * 0.72), side = Math.max(0.045, fontSize * 0.30), diagonal = gap * 0.82;
  return [
    { x: x + dx + gap + side, y: y + dy + 0.03, anchor: "start" },
    { x: x + dx, y: y + dy - gap - side, anchor: "middle" },
    { x: x + dx - gap - side, y: y + dy + 0.03, anchor: "end" },
    { x: x + dx, y: y + dy + gap + side, anchor: "middle" },
    { x: x + dx + diagonal, y: y + dy - diagonal, anchor: "start" },
    { x: x + dx - diagonal, y: y + dy - diagonal, anchor: "end" },
  ];
}
function estimateTextWidth(city, fontSize) { return Math.max(fontSize * 1.8, String(city.map?.name ?? city.id).length * fontSize * 0.46); }
function labelBox(city, candidate, fontSize) {
  const width = estimateTextWidth(city, fontSize), halfWidth = width / 2;
  const left = candidate.anchor === "start" ? candidate.x : candidate.anchor === "end" ? candidate.x - width : candidate.x - halfWidth;
  const right = candidate.anchor === "start" ? candidate.x + width : candidate.anchor === "end" ? candidate.x : candidate.x + halfWidth;
  return { left, right, top: candidate.y - fontSize * 0.78, bottom: candidate.y + fontSize * 0.24 };
}
function markerBox(city) {
  const radius = tierConfig(city).markerRadius + 0.045;
  return { left: city.map.x - radius, right: city.map.x + radius, top: city.map.y - radius, bottom: city.map.y + radius };
}
function isLabelInViewport(box, camera) {
  if (!camera) return true;
  const zoom = getSafeZoom(camera.zoom), viewWidth = 360 / zoom, viewHeight = 180 / zoom, centerX = Number(camera.x ?? 0), centerY = Number(camera.y ?? 0);
  const minY = centerY - viewHeight / 2, maxY = centerY + viewHeight / 2, minX = centerX - viewWidth / 2, maxX = centerX + viewWidth / 2;
  return box.top >= minY && box.bottom <= maxY && box.left >= minX && box.right <= maxX;
}
export function boxesOverlap(a, b, padding = 0.06) { return !(a.right + padding < b.left || a.left - padding > b.right || a.bottom + padding < b.top || a.top - padding > b.bottom); }
export function selectVisibleCities(cities, zoom = 1) {
  return [...cities].filter((city) => tierConfig(city).minZoom <= zoom || tierOf(city) === "capital").sort(compareCityPriority).slice(0, getCityMarkerBudget(zoom));
}
export function layoutCityLabels(cities, zoom = 1, camera = null) {
  const budget = getCityLabelBudget(zoom), placed = [], labels = [];
  for (const city of [...cities].sort(compareCityPriority)) {
    if (labels.length >= budget) break;
    const style = getCityVisualStyle(city, zoom);
    if (zoom < style.minZoom) continue;
    const layoutFontSize = style.effectiveFontSize;
    for (const candidate of getCandidates(city, layoutFontSize)) {
      const box = labelBox(city, candidate, layoutFontSize);
      if (!isLabelInViewport(box, camera)) continue;
      const blockedByMarker = cities.some((other) => other.id !== city.id && boxesOverlap(box, markerBox(other), 0.045));
      if (blockedByMarker || placed.some((item) => boxesOverlap(box, item.box, 0.06))) continue;
      placed.push({ box });
      labels.push({ city, ...candidate, fontSize: style.fontSize, screenScale: style.screenScale, effectiveFontSize: layoutFontSize, priority: style.priority });
      break;
    }
  }
  return labels;
}

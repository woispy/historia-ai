/**
 * Historia AI — deterministic city label layout.
 *
 * City markers and labels are screen-stable, budgeted and LOD-aware. World
 * view deliberately shows no city names; regional view introduces only the
 * highest-value major settlements and closer views progressively reveal more.
 */

export const CITY_LABEL_TIERS = Object.freeze({
  capital: Object.freeze({ priority: 100, minZoom: 1.00, baseSize: 0.36, markerRadius: 0.11 }),
  major: Object.freeze({ priority: 70, minZoom: 1.45, baseSize: 0.30, markerRadius: 0.085 }),
  town: Object.freeze({ priority: 40, minZoom: 2.65, baseSize: 0.27, markerRadius: 0.060 }),
  village: Object.freeze({ priority: 15, minZoom: 4.75, baseSize: 0.23, markerRadius: 0.045 }),
});

const LABEL_BUDGET = Object.freeze({
  world: 0,
  regional: 4,
  province: 10,
  city: 16,
  detailed: 22,
});

const MARKER_BUDGET = Object.freeze({
  world: 5,
  regional: 12,
  province: 20,
  city: 30,
  detailed: 42,
});

const LOD_BY_ZOOM = Object.freeze([
  [1.20, "world"],
  [1.85, "regional"],
  [2.65, "province"],
  [3.50, "city"],
]);

const SCREEN_STABLE_SIZE = 3.2;

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
  if (Boolean(a.map?.port) !== Boolean(b.map?.port)) {
    return Number(Boolean(b.map?.port)) - Number(Boolean(a.map?.port));
  }
  return String(a.map?.name ?? a.id).localeCompare(String(b.map?.name ?? b.id));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getScreenStableScale(zoom) {
  const safeZoom = Math.max(1, Number(zoom) || 1);
  return clamp(SCREEN_STABLE_SIZE / safeZoom, 0.72, SCREEN_STABLE_SIZE);
}

export function getCityVisualStyle(city, zoom = 1) {
  const config = tierConfig(city);
  const scale = getScreenStableScale(zoom);
  const radius = clamp(config.markerRadius * scale, 0.035, config.markerRadius * SCREEN_STABLE_SIZE);
  const fontSize = clamp(config.baseSize * scale, 0.085, config.baseSize * SCREEN_STABLE_SIZE);
  return Object.freeze({ radius, fontSize, priority: config.priority, minZoom: config.minZoom });
}

export function getCityMarkerBudget(zoom = 1) {
  return MARKER_BUDGET[getLod(zoom)];
}

export function getCityLabelBudget(zoom = 1) {
  return LABEL_BUDGET[getLod(zoom)];
}

function getCandidates(city, fontSize) {
  const { x, y, tier } = city.map;
  const dx = Number(city.map.labelDx ?? 0);
  const dy = Number(city.map.labelDy ?? 0);
  const gap = Math.max(tier === "capital" ? 0.14 : 0.11, fontSize * 0.72);
  const side = Math.max(0.045, fontSize * 0.30);
  const diagonal = gap * 0.82;

  return [
    { x: x + dx + gap + side, y: y + dy + 0.03, anchor: "start" },
    { x: x + dx, y: y + dy - gap - side, anchor: "middle" },
    { x: x + dx - gap - side, y: y + dy + 0.03, anchor: "end" },
    { x: x + dx, y: y + dy + gap + side, anchor: "middle" },
    { x: x + dx + diagonal, y: y + dy - diagonal, anchor: "start" },
    { x: x + dx - diagonal, y: y + dy - diagonal, anchor: "end" },
  ];
}

function estimateTextWidth(city, fontSize) {
  const characters = String(city.map?.name ?? city.id).length;
  return Math.max(fontSize * 1.8, characters * fontSize * 0.46);
}

function labelBox(city, candidate, fontSize) {
  const width = estimateTextWidth(city, fontSize);
  const halfWidth = width / 2;
  const left = candidate.anchor === "start"
    ? candidate.x
    : candidate.anchor === "end"
      ? candidate.x - width
      : candidate.x - halfWidth;
  const right = candidate.anchor === "start"
    ? candidate.x + width
    : candidate.anchor === "end"
      ? candidate.x
      : candidate.x + halfWidth;
  const top = candidate.y - fontSize * 0.78;
  const bottom = candidate.y + fontSize * 0.24;
  return { left, right, top, bottom };
}

function markerBox(city) {
  const radius = tierConfig(city).markerRadius + 0.045;
  return {
    left: city.map.x - radius,
    right: city.map.x + radius,
    top: city.map.y - radius,
    bottom: city.map.y + radius,
  };
}

function isLabelInViewport(box, camera) {
  if (!camera) return true;

  const zoom = Math.max(1, Number(camera.zoom) || 1);
  const viewWidth = 360 / zoom;
  const viewHeight = 180 / zoom;
  const centerX = Number(camera.x ?? 0);
  const centerY = Number(camera.y ?? 0);
  const minY = centerY - viewHeight / 2;
  const maxY = centerY + viewHeight / 2;
  const minX = centerX - viewWidth / 2;
  const maxX = centerX + viewWidth / 2;

  const verticalFit = box.top >= minY && box.bottom <= maxY;
  if (!verticalFit) return false;

  return box.left >= minX && box.right <= maxX;
}

export function boxesOverlap(a, b, padding = 0.06) {
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

export function layoutCityLabels(cities, zoom = 1, camera = null) {
  const budget = getCityLabelBudget(zoom);
  const placed = [];
  const labels = [];
  const orderedCities = [...cities].sort(compareCityPriority);

  for (const city of orderedCities) {
    if (labels.length >= budget) break;
    const style = getCityVisualStyle(city, zoom);
    if (zoom < style.minZoom) continue;

    for (const candidate of getCandidates(city, style.fontSize)) {
      const box = labelBox(city, candidate, style.fontSize);
      if (!isLabelInViewport(box, camera)) continue;

      const blockedByMarker = orderedCities.some((other) => (
        other.id !== city.id && boxesOverlap(box, markerBox(other), 0.045)
      ));
      if (blockedByMarker) continue;
      if (placed.some((item) => boxesOverlap(box, item.box, 0.06))) continue;

      placed.push({ box });
      labels.push({
        city,
        ...candidate,
        fontSize: style.fontSize,
        priority: style.priority,
      });
      break;
    }
  }

  return labels;
}

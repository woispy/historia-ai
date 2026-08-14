/**
 * Historia AI — deterministic city label layout.
 *
 * Labels are map-space entities with a screen-stable visual scale. Important
 * cities reserve space first; lower-priority labels yield when they collide
 * with another label or city marker. The algorithm is deterministic so the
 * same camera/atlas state always produces the same composition.
 */

export const CITY_LABEL_TIERS = Object.freeze({
  capital: Object.freeze({ priority: 100, minZoom: 0.95, baseSize: 0.60, markerRadius: 0.16 }),
  major: Object.freeze({ priority: 70, minZoom: 1.45, baseSize: 0.45, markerRadius: 0.11 }),
  town: Object.freeze({ priority: 40, minZoom: 2.75, baseSize: 0.34, markerRadius: 0.075 }),
  village: Object.freeze({ priority: 15, minZoom: 4.50, baseSize: 0.27, markerRadius: 0.055 }),
});

const LABEL_BUDGET = Object.freeze({
  world: 5,
  regional: 8,
  province: 12,
  city: 18,
  detailed: 22,
});

const MARKER_BUDGET = Object.freeze({
  world: 6,
  regional: 12,
  province: 20,
  city: 28,
  detailed: 34,
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
  if (Boolean(a.map?.port) !== Boolean(b.map?.port)) {
    return Number(Boolean(b.map?.port)) - Number(Boolean(a.map?.port));
  }
  return String(a.map?.name ?? a.id).localeCompare(String(b.map?.name ?? b.id));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getScreenStableScale(zoom) {
  // Deep zooms should reveal more detail, not giant typography.
  return clamp(1.5 / Math.sqrt(Math.max(1, zoom)), 0.62, 1);
}

export function getCityVisualStyle(city, zoom = 1) {
  const config = tierConfig(city);
  const scale = getScreenStableScale(zoom);
  const radius = clamp(config.markerRadius * scale, 0.045, config.markerRadius);
  const fontSize = clamp(config.baseSize * scale, 0.16, config.baseSize);
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
  const gap = Math.max(tier === "capital" ? 0.18 : 0.14, fontSize * 0.78);
  const side = Math.max(0.06, fontSize * 0.34);
  const diagonal = gap * 0.82;

  return [
    { x: x + dx + gap + side, y: y + dy + 0.04, anchor: "start" },
    { x: x + dx, y: y + dy - gap - side, anchor: "middle" },
    { x: x + dx - gap - side, y: y + dy + 0.04, anchor: "end" },
    { x: x + dx, y: y + dy + gap + side, anchor: "middle" },
    { x: x + dx + diagonal, y: y + dy - diagonal, anchor: "start" },
    { x: x + dx - diagonal, y: y + dy - diagonal, anchor: "end" },
  ];
}

function estimateTextWidth(city, fontSize) {
  const characters = String(city.map?.name ?? city.id).length;
  return Math.max(fontSize * 1.9, characters * fontSize * 0.48);
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
  const radius = tierConfig(city).markerRadius + 0.055;
  return {
    left: city.map.x - radius,
    right: city.map.x + radius,
    top: city.map.y - radius,
    bottom: city.map.y + radius,
  };
}

export function boxesOverlap(a, b, padding = 0.08) {
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
  const orderedCities = [...cities].sort(compareCityPriority);

  for (const city of orderedCities) {
    if (labels.length >= budget) break;
    const style = getCityVisualStyle(city, zoom);
    if (zoom < style.minZoom) continue;

    for (const candidate of getCandidates(city, style.fontSize)) {
      const box = labelBox(city, candidate, style.fontSize);
      const blockedByMarker = orderedCities.some((other) => (
        other.id !== city.id && boxesOverlap(box, markerBox(other), 0.05)
      ));
      if (blockedByMarker) continue;
      if (placed.some((item) => boxesOverlap(box, item.box, 0.08))) continue;

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

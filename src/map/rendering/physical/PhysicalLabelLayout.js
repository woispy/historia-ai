/**
 * Physical Geography 2.0 — deterministic label layout.
 *
 * Labels are world-space data. This service only chooses a stable placement;
 * it never reads camera or mutates map data.
 */

function overlaps(a, b, padding = 0) {
  return !(
    a.maxX + padding < b.minX ||
    a.minX - padding > b.maxX ||
    a.maxY + padding < b.minY ||
    a.minY - padding > b.maxY
  );
}

function estimateBox(label, x, y) {
  const fontSize = Number(label.fontSize ?? 0.24);
  const width = Math.max(fontSize * 2, label.name.length * fontSize * 0.58);
  const height = fontSize * 1.15;
  const align = label.align ?? "middle";
  const left = align === "start" ? x : align === "end" ? x - width : x - width / 2;

  return {
    minX: left,
    maxX: left + width,
    minY: y - height / 2,
    maxY: y + height / 2,
  };
}

function insideBounds(box, bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4) return true;
  const [minX, minY, maxX, maxY] = bounds;
  return box.minX >= minX && box.maxX <= maxX && box.minY >= minY && box.maxY <= maxY;
}

/**
 * Place physical labels in priority order.
 *
 * The algorithm is intentionally deterministic: the same atlas always gives
 * the same layout, which makes screenshots/tests reproducible.
 */
export function layoutPhysicalLabels(labels, zoom = 1) {
  const visible = labels
    .filter((label) => zoom >= Number(label.minZoom ?? 1))
    .filter((label) => zoom <= Number(label.maxZoom ?? Number.POSITIVE_INFINITY))
    .sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));

  const placed = [];
  const occupied = [];

  for (const label of visible) {
    const offsetCandidates = label.offsets ?? [[0, 0]];
    const padding = Number(label.padding ?? 0.08);
    let chosen = null;

    for (const [dx, dy] of offsetCandidates) {
      const x = Number(label.x) + Number(dx);
      const y = Number(label.y) + Number(dy);
      const box = estimateBox(label, x, y);

      if (!insideBounds(box, label.bounds)) continue;
      if (occupied.some((other) => overlaps(box, other, padding))) continue;

      chosen = { x, y, box };
      break;
    }

    if (!chosen) continue;

    occupied.push(chosen.box);
    placed.push({ ...label, x: chosen.x, y: chosen.y });
  }

  return placed;
}

export function estimatePhysicalLabelBox(label) {
  return estimateBox(label, Number(label.x), Number(label.y));
}

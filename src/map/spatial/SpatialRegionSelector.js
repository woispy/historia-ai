function normalizeBounds(bounds) {
  if (Array.isArray(bounds) && bounds.length === 4) {
    const [minX, minY, maxX, maxY] = bounds.map(Number);
    if ([minX, minY, maxX, maxY].every(Number.isFinite)) return { minX, minY, maxX, maxY };
  }
  if (bounds && [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY].every(Number.isFinite)) {
    return { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY };
  }
  throw new Error("Invalid spatial region bounds");
}

export function normalizeSpatialBounds(bounds) {
  const normalized = normalizeBounds(bounds);
  return {
    minX: Math.min(normalized.minX, normalized.maxX),
    maxX: Math.max(normalized.minX, normalized.maxX),
    minY: Math.min(normalized.minY, normalized.maxY),
    maxY: Math.max(normalized.minY, normalized.maxY),
  };
}

export function selectIntersectingSpatialRegions(regions, bounds, maxRegions = Infinity) {
  if (!Array.isArray(regions)) throw new Error("Spatial regions must be an array");
  if (!(Number.isInteger(maxRegions) || maxRegions === Infinity) || maxRegions < 1) {
    throw new Error("maxRegions must be a positive integer or Infinity");
  }

  const viewport = normalizeSpatialBounds(bounds);
  return regions
    .filter(Boolean)
    .map((region) => ({ ...region, normalizedBounds: normalizeSpatialBounds(region.bounds) }))
    .filter((region) => {
      const candidate = region.normalizedBounds;
      return candidate.minX <= viewport.maxX && candidate.maxX >= viewport.minX
        && candidate.minY <= viewport.maxY && candidate.maxY >= viewport.minY;
    })
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .slice(0, maxRegions)
    .map(({ id }) => id);
}

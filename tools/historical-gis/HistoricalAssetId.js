function slug(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function createHistoricalAssetId({
  year,
  sourceFeatureId,
  sourceFeatureIndex,
}) {
  const normalizedSourceId = slug(sourceFeatureId);
  const base = normalizedSourceId || `feature_${sourceFeatureIndex}`;

  return `province_${year}_${base}_${sourceFeatureIndex}`;
}

export { slug };

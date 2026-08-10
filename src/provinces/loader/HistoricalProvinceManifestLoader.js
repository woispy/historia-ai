const historicalProvinceManifests = import.meta.glob(
  "../../assets/historical/*/provinces/manifest.js",
  {
    eager: true,
    import: "default",
  },
);

function normalizeYear(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 4);
}

export function loadHistoricalProvinceManifest(date) {
  const year = normalizeYear(date);
  if (!year) return null;

  const entry = Object.entries(historicalProvinceManifests).find(([path]) =>
    path.includes(`/historical/${year}/provinces/manifest.js`),
  );

  return Array.isArray(entry?.[1]) ? entry[1] : null;
}

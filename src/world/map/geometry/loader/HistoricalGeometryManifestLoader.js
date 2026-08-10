const historicalManifests = import.meta.glob(
  "../../assets/historical/*/geometry/manifest.js",
  {
    eager: true,
    import: "default",
  },
);

function normalizeYear(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 4);
}

export function loadHistoricalGeometryManifest(date) {
  const year = normalizeYear(date);
  if (!year) return null;

  const entry = Object.entries(historicalManifests).find(([path]) =>
    path.includes(`/historical/${year}/geometry/manifest.js`),
  );

  return Array.isArray(entry?.[1]) ? entry[1] : null;
}

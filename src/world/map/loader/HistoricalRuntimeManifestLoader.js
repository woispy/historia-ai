const historicalRuntimeAssets = import.meta.glob(
  "../assets/historical/*/runtime.json",
  {
    eager: true,
    import: "default",
  },
);

function normalizeYear(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 4);
}

export function loadHistoricalRuntimeAsset(date) {
  const year = normalizeYear(date);
  if (!year) return null;

  const entry = Object.entries(historicalRuntimeAssets).find(([path]) =>
    path.includes(`/historical/${year}/runtime.json`),
  );

  return entry?.[1] ?? null;
}

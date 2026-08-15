const viteHistoricalRuntimeAssets =
  typeof import.meta.glob === "function"
    ? import.meta.glob(
        "../assets/historical/*/runtime.json",
        {
          eager: true,
          import: "default",
        }
      )
    : null;

const nodeProcess = globalThis.process;

const nodeFs =
  nodeProcess &&
  typeof nodeProcess.getBuiltinModule === "function"
    ? nodeProcess.getBuiltinModule("fs")
    : null;

function normalizeYear(value) {
  return String(value ?? "").replace(/[^0-9]/g, "").slice(0, 4);
}

function loadNodeHistoricalRuntimeAsset(year) {
  if (!nodeFs) {
    return null;
  }

  const fileUrl = new URL(
    `../assets/historical/${year}/runtime.json`,
    import.meta.url
  );

  if (!nodeFs.existsSync(fileUrl)) {
    return null;
  }

  return JSON.parse(
    nodeFs.readFileSync(fileUrl, "utf8")
  );
}

export function loadHistoricalRuntimeAsset(date) {
  const year = normalizeYear(date);
  if (!year) return null;

  if (!viteHistoricalRuntimeAssets) {
    return loadNodeHistoricalRuntimeAsset(year);
  }

  const entry = Object.entries(viteHistoricalRuntimeAssets).find(([path]) =>
    path.includes(`/historical/${year}/runtime.json`)
  );

  return entry?.[1] ?? null;
}

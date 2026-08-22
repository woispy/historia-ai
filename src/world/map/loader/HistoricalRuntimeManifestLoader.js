const viteHistoricalRuntimeAssets = import.meta.env
  ? import.meta.glob(
      "../assets/historical/*/runtime.json",
      {
        import: "default",
      }
    )
  : null;

const runtimeCache = new Map();
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
  if (!nodeFs) return null;

  const fileUrl = new URL(
    `../assets/historical/${year}/runtime.json`,
    import.meta.url
  );

  if (!nodeFs.existsSync(fileUrl)) return null;

  return JSON.parse(nodeFs.readFileSync(fileUrl, "utf8"));
}

export async function loadHistoricalRuntimeAsset(date) {
  const year = normalizeYear(date);
  if (!year) return null;

  if (runtimeCache.has(year)) {
    return runtimeCache.get(year);
  }

  if (viteHistoricalRuntimeAssets) {
    const entry = Object.entries(viteHistoricalRuntimeAssets).find(([path]) =>
      path.includes(`/historical/${year}/runtime.json`)
    );

    if (!entry?.[1]) return null;

    const runtime = await entry[1]();
    runtimeCache.set(year, runtime);
    return runtime;
  }

  const runtime = loadNodeHistoricalRuntimeAsset(year);
  runtimeCache.set(year, runtime);
  return runtime;
}

export function clearHistoricalRuntimeCache() {
  runtimeCache.clear();
}

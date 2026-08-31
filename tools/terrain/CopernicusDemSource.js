export const COPERNICUS_DEM_SOURCES = Object.freeze({
  GLO30_PUBLIC: Object.freeze({
    id: "COPERNICUS_30",
    product: "COP-DEM GLO-30 Public",
    resolutionMeters: 30,
    type: "DSM",
  }),
  GLO90: Object.freeze({
    id: "COPERNICUS_90",
    product: "COP-DEM GLO-90",
    resolutionMeters: 90,
    type: "DSM",
  }),
});

export function resolveCopernicusDemSource(instance = "COPERNICUS_90") {
  const source = Object.values(COPERNICUS_DEM_SOURCES).find(({ id }) => id === instance);
  if (!source) throw new Error(`Unsupported Copernicus DEM instance: ${instance}`);
  return source;
}

export function createDemTileProvenance({ source, gridId, productId, acquiredAt = null }) {
  const resolved = typeof source === "string" ? resolveCopernicusDemSource(source) : source;
  if (!resolved?.id || !gridId || !productId) {
    throw new Error("DEM provenance requires source, gridId and productId.");
  }
  return Object.freeze({
    authority: "Copernicus Data Space Ecosystem",
    sourceInstance: resolved.id,
    product: resolved.product,
    resolutionMeters: resolved.resolutionMeters,
    surfaceType: resolved.type,
    gridId,
    productId,
    acquiredAt,
  });
}

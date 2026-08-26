import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";

function polygonVertexMean(polygon) {
  const total = polygon.reduce(
    (sum, [longitude, latitude]) => [sum[0] + longitude, sum[1] + latitude],
    [0, 0],
  );
  return [total[0] / polygon.length, total[1] / polygon.length];
}

const result = buildAnatoliaPhase2DAssets();
for (const geometry of result.geometries) {
  geometry.polygons.forEach((polygon, polygonIndex) => {
    const centroid = polygonVertexMean(polygon);
    if (!isPhysicalLandPoint(centroid)) {
      console.log(JSON.stringify({
        provinceId: geometry.identity.provinceId,
        polygonIndex,
        centroid,
        vertices: polygon,
      }));
      process.exitCode = 1;
    }
  });
}

if (!process.exitCode) console.log("Phase 2D centroid diagnostics: all polygon vertex-mean centroids are on physical land.");

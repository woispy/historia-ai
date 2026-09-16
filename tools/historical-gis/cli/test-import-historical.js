import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { importHistoricalGeoJson } from "../HistoricalGeometryImporter.js";
import {
  buildHistoricalGeometryAsset,
  buildHistoricalProvinceAsset,
} from "../HistoricalProvinceAssetBuilder.js";

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "historia-historical-import-"));
const inputPath = path.join(temporaryDirectory, "source.geojson");

try {
  await fs.writeFile(
    inputPath,
    `${JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "bursa-test",
          properties: { NAME: "Bursa", SUBJECTO: "Ottomans" },
          geometry: {
            type: "Polygon",
            coordinates: [[[28, 40], [29, 40], [29, 41], [28, 40]]],
          },
        },
      ],
    })}\n`,
    "utf8",
  );

  const regions = await importHistoricalGeoJson(inputPath, 1326);
  assert.equal(regions.length, 1);
  assert.equal(regions[0].assetId, "province_1326_bursa_test_0");

  const region = {
    ...regions[0],
    year: 1326,
    historicalDate: "1326-04-07",
    provider: "test-evidence",
    dataset: "test-source.geojson",
  };
  const province = buildHistoricalProvinceAsset(region);
  const geometry = buildHistoricalGeometryAsset(region);

  assert.equal(province.identity.id, "province_1326_bursa_test_0");
  assert.equal(province.header.historicalDate, "1326-04-07");
  assert.equal(province.header.provider, "test-evidence");
  assert.equal(geometry.identity.id, province.identity.id);
  assert.equal(geometry.header.historicalDate, "1326-04-07");
  assert.equal(geometry.header.dataset, "test-source.geojson");

  console.log("Generic historical GIS importer year propagation test passed.");
} finally {
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
}

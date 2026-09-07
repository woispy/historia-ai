import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

import aoi from "../../../src/world/map/source/physical/copernicus-glo30.aoi.json" with { type: "json" };
import manifest from "../../../src/world/map/source/physical/copernicus-glo30.manifest.json" with { type: "json" };

const CATALOG_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";
const DOWNLOAD_URL = "https://download.dataspace.copernicus.eu/odata/v1/Products";
const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const DATASET = "COP-DEM_GLO-30-DGED/2024_1";
const PRODUCT_TYPE = "SAR_DGE_30_A4AD";
const OUTPUT_DIR = path.resolve("data/build/physical/copernicus-glo30/2024_1");

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    catalogOnly: args.has("--catalog-only"),
    download: args.has("--download"),
    promote: args.has("--promote"),
  };
}

function assertAoi() {
  if (aoi.west >= aoi.east || aoi.south >= aoi.north || aoi.tileSizeDegrees !== 1) {
    throw new Error("P6.2-A invalid GLO-30 AOI contract.");
  }
  const expectedTileCount = (aoi.east - aoi.west) * (aoi.north - aoi.south);
  if (aoi.tileCount !== expectedTileCount) {
    throw new Error(`P6.2-A AOI tileCount mismatch: expected ${expectedTileCount}, got ${aoi.tileCount}.`);
  }
}

function tileId(latitude, longitude) {
  const latPrefix = latitude >= 0 ? "N" : "S";
  const lonPrefix = longitude >= 0 ? "E" : "W";
  return `${latPrefix}${String(Math.abs(latitude)).padStart(2, "0")}_${lonPrefix}${String(Math.abs(longitude)).padStart(3, "0")}`;
}

function expectedTileIds() {
  const ids = [];
  for (let lat = aoi.south; lat < aoi.north; lat += 1) {
    for (let lon = aoi.west; lon < aoi.east; lon += 1) ids.push(tileId(lat, lon));
  }
  return ids;
}

function getAttribute(product, name) {
  return product.Attributes?.find((attribute) => attribute.Name === name)?.Value ?? null;
}

async function queryCatalog(gridId) {
  const filter = [
    "Collection/Name eq 'CCM'",
    `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'gridId' and att/OData.CSC.StringAttribute/Value eq '${gridId}')`,
    `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'dataset' and att/OData.CSC.StringAttribute/Value eq '${DATASET}')`,
    `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq '${PRODUCT_TYPE}')`,
  ].join(" and ");
  const url = `${CATALOG_URL}?$filter=${encodeURIComponent(filter)}&$expand=Attributes,Locations`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CDSE catalog query failed for ${gridId}: HTTP ${response.status}`);
  const body = await response.json();
  return body.value ?? [];
}

async function getToken() {
  const username = process.env.CDSE_USERNAME;
  const password = process.env.CDSE_PASSWORD;
  if (!username || !password) {
    throw new Error("P6.2-A download requires CDSE_USERNAME and CDSE_PASSWORD environment variables; credentials must never be committed.");
  }
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    client_id: "cdse-public",
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`CDSE authentication failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.access_token) throw new Error("CDSE authentication returned no access token.");
  return payload.access_token;
}

async function listNodes(productId, token, parentNode = null) {
  const base = `${DOWNLOAD_URL}(${productId})/Nodes`;
  const url = parentNode ? `${base}(${encodeURIComponent(parentNode)})/Nodes` : base;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`CDSE node listing failed: HTTP ${response.status}`);
  return (await response.json()).result ?? [];
}

async function findDemNode(productId, token, nodes = null, prefix = []) {
  const children = nodes ?? await listNodes(productId, token);
  for (const node of children) {
    const current = [...prefix, node.Name];
    if (node.ChildrenNumber > 0) {
      const nested = await findDemNode(productId, token, await listNodes(productId, token, node.Id), current);
      if (nested) return nested;
    } else if (/\.tif(f)?$/i.test(node.Name) && /(^|[_-])DEM([_.-]|$)/i.test(node.Name)) {
      return { node, path: current };
    }
  }
  return null;
}

async function downloadNode(productId, nodePath, token, destination) {
  let url = `${DOWNLOAD_URL}(${productId})/Nodes`;
  for (const node of nodePath) url += `(${encodeURIComponent(node)})/Nodes`;
  url = url.replace(/\/Nodes$/, "/$value");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: "follow" });
  if (!response.ok) throw new Error(`CDSE DEM node download failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  return bytes.length;
}

function sha256File(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  const { catalogOnly, download, promote } = parseArgs(process.argv);
  assertAoi();
  const ids = expectedTileIds();
  const results = [];

  for (const gridId of ids) {
    const products = await queryCatalog(gridId);
    if (products.length === 0) {
      results.push({ id: gridId, status: "missing-from-catalog" });
      continue;
    }
    if (products.length !== 1) {
      throw new Error(`P6.2-A expected exactly one pinned ${DATASET} product for ${gridId}; found ${products.length}.`);
    }
    const product = products[0];
    results.push({
      id: gridId,
      status: "catalogued",
      productId: product.Id,
      productName: product.Name,
      dataset: getAttribute(product, "dataset"),
      productType: getAttribute(product, "productType"),
      locations: product.Locations ?? [],
      checksum: product.Checksum ?? [],
    });
  }

  const catalogPath = path.join(OUTPUT_DIR, "catalog-results.json");
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(catalogPath, `${JSON.stringify({ schemaVersion: 1, dataset: DATASET, aoi, tiles: results }, null, 2)}\n`);
  console.log(`P6.2-A catalog discovery: ${results.filter((item) => item.status === "catalogued").length}/${results.length} tiles catalogued`);
  console.log(`catalogResults=${catalogPath}`);

  if (catalogOnly) return;
  if (!download) throw new Error("No download requested. Use --catalog-only or explicitly pass --download.");

  const token = await getToken();
  const promoted = [];
  for (const item of results.filter((entry) => entry.status === "catalogued")) {
    const demNode = await findDemNode(item.productId, token);
    if (!demNode) throw new Error(`P6.2-A could not locate DEM GeoTIFF inside product ${item.productId} (${item.id}).`);
    const destination = path.join(OUTPUT_DIR, `${item.id}.tif`);
    await downloadNode(item.productId, demNode.path, token, destination);
    const bytes = await fs.readFile(destination);
    const sha256 = sha256File(bytes);
    promoted.push({
      id: item.id,
      catalogDataset: DATASET,
      productId: item.productId,
      productName: item.productName,
      downloadLocator: `${DOWNLOAD_URL}(${item.productId})/Nodes/${demNode.path.join("/Nodes/")}/$value`,
      demNodePath: demNode.path,
      sha256,
      byteLength: bytes.length,
    });
  }

  if (!promote) {
    console.log(`downloaded=${promoted.length}; manifest promotion skipped (pass --promote to write the promotion candidate).`);
    return;
  }

  const promotedManifest = {
    ...manifest,
    acquisition: {
      aoi: aoi,
      verifiedAt: new Date().toISOString(),
      source: "CDSE OData authenticated download",
    },
    tiles: promoted,
  };
  await fs.writeFile(path.join(OUTPUT_DIR, "copernicus-glo30.promoted.json"), `${JSON.stringify(promotedManifest, null, 2)}\n`);
  console.log(`promotedManifestTiles=${promoted.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

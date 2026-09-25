import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import os from "node:os";

const SOURCE_ID = "cliopatria-v0.2.0";
const SCENARIO_DATE = "1326-04-07";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}
function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve(stdout) : reject(new Error(`${command} failed with code ${code}: ${stderr.trim()}`)));
  });
}

const archivePath = required("--archive");
const acquisitionPath = path.resolve(process.cwd(), arg("--acquisition", "data/build/gis/1326/source-snapshots/cliopatria-v0.2.0.acquisition.json"));
const manifestPath = path.resolve(process.cwd(), arg("--manifest", "data/gis/1326/acquisition-manifest.json"));
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/cliopatria-extraction-input.json"));

const acquisition = JSON.parse(await fs.readFile(acquisitionPath, "utf8"));
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const source = manifest.sources?.find(item => item.id === SOURCE_ID);

if (acquisition.sourceId !== SOURCE_ID) throw new Error("Acquisition source ID mismatch.");
if (acquisition.immutableReference?.sha !== "ad28a69") throw new Error("Immutable source commit mismatch.");
if (acquisition.sourceTag !== "v0.2.0") throw new Error("Acquisition source tag mismatch.");
if (acquisition.sourceUrl !== "https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.0/cliopatria.geojson.zip") throw new Error("Acquisition source URL mismatch.");
if (acquisition.immutableReference?.sourceBlobSha !== "cefab0f4b622e2e7fb3daf68d4f461f83991204c") throw new Error("Immutable source blob mismatch.");
if (acquisition.promotion !== "BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW") throw new Error("Acquisition must remain promotion-blocked.");
if (source?.status !== "acquired" || source?.snapshot?.status !== "acquired") throw new Error("Tracked acquisition manifest does not contain a verified acquired snapshot.");
if (source.snapshot?.sourceTag !== acquisition.sourceTag) throw new Error("Tracked acquisition source tag does not match the acquisition record.");
if (source.snapshot?.retainedArtifact !== acquisition.retainedArtifact) throw new Error("Tracked acquisition retained artifact does not match the acquisition record.");
if (source.snapshot?.acquiredAt !== acquisition.acquiredAt) throw new Error("Tracked acquisition timestamp does not match the acquisition record.");
if (source.snapshot.rawSha256 !== acquisition.rawSha256) throw new Error("Acquisition manifest SHA-256 does not match the acquisition record.");
if (source.snapshot.byteLength !== acquisition.byteLength) throw new Error("Acquisition manifest byte length does not match the acquisition record.");

const archive = await fs.readFile(archivePath);
const archiveSha = sha256(archive);
if (archiveSha !== acquisition.rawSha256) throw new Error(`Archive SHA-256 mismatch: expected ${acquisition.rawSha256}, got ${archiveSha}`);
if (archive.length !== acquisition.byteLength) throw new Error("Archive byte length mismatch.");

const extractDir = path.resolve(process.cwd(), "data/build/gis/1326/source-snapshots/cliopatria-v0.2.0");
await fs.rm(extractDir, { recursive: true, force: true });
await fs.mkdir(extractDir, { recursive: true });

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "historia-cliopatria-"));
try {
  const expandedDir = path.join(tempDir, "expanded");
  await fs.mkdir(expandedDir, { recursive: true });

  if (process.platform === "win32") {
    await run("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-Command",
      "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
      archivePath, expandedDir,
    ]);
  } else {
    try {
      await run("unzip", ["-q", archivePath, "-d", expandedDir]);
    } catch (error) {
      await run("tar", ["-xf", archivePath, "-C", expandedDir]);
    }
  }

  const files = [];
  async function collectFiles(dir, relative = "") {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const rel = relative ? path.posix.join(relative.replaceAll("\\", "/"), entry.name) : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await collectFiles(full, rel);
      else if (entry.isFile()) files.push({ relative: rel, full });
    }
  }
  await collectFiles(expandedDir);

  const geojsonFiles = files.filter(item => item.relative.toLowerCase().endsWith(".geojson"));
  if (geojsonFiles.length !== 1) {
    throw new Error(`Expected exactly one GeoJSON member in Cliopatria archive; found ${geojsonFiles.length}: ${geojsonFiles.map(item => item.relative).join(", ")}`);
  }

  const member = geojsonFiles[0].relative.replaceAll("\\", "/");
  if (path.posix.isAbsolute(member) || member.split("/").includes("..")) {
    throw new Error(`Unsafe archive member path: ${member}`);
  }
  const extractedPath = path.join(extractDir, ...member.split("/"));
  await fs.mkdir(path.dirname(extractedPath), { recursive: true });
  await fs.copyFile(geojsonFiles[0].full, extractedPath);

  const extracted = await fs.readFile(extractedPath, "utf8");
  const parsed = JSON.parse(extracted);
  if (parsed?.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    throw new Error("Extracted Cliopatria member must be a GeoJSON FeatureCollection.");
  }
  const extractedSha = sha256(Buffer.from(extracted, "utf8"));

  const relativeArchivePath = path.relative(process.cwd(), archivePath).replace(/\\/g, "/");
  const relativeExtractedPath = path.relative(process.cwd(), extractedPath).replace(/\\/g, "/");

  const record = {
    schemaVersion: 1,
    sourceId: SOURCE_ID,
    scenarioDate: SCENARIO_DATE,
    archive: {
      path: relativeArchivePath,
      rawSha256: archiveSha,
      byteLength: archive.length,
      acquisitionRecord: acquisitionPath.replace(/\\/g, "/")
    },
    member: {
      path: member,
      extractedPath: relativeExtractedPath,
      sha256: extractedSha,
      format: "GeoJSON",
      featureCollectionValidated: true
    },
    immutableReference: acquisition.immutableReference,
    extractionPolicy: "Exactly one .geojson archive member; cross-platform extraction; no inferred member selection.",
    promotion: "BLOCKED_UNTIL_TEMPORAL_EXTRACTION_RECONCILIATION_REVIEW"
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(record, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({
    sourceId: SOURCE_ID,
    scenarioDate: SCENARIO_DATE,
    archiveSha256: archiveSha,
    member,
    extractedSha256: extractedSha,
    outputPath,
    promotion: record.promotion
  }, null, 2));
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}


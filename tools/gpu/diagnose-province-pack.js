import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = path.join(root, "../src/world/map/assets/historical/1300/runtime.json");
const workerPath = path.join(root, "gpu-province-worker.js");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province, index) => ({
  province,
  geometry: geometryById.get(String(province.identity?.id)),
  index,
})).filter((entry) => entry.geometry);

if (!entries.length) throw new Error("GPU diagnostic found no historical province geometry.");

const timeoutMs = Number(process.env.GPU_PROVINCE_TIMEOUT_MS ?? 15000);
const results = [];

function runWorker(entry) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [workerPath, String(entry.index)], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GPU_PROVINCE_DIAGNOSTIC: "1" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({
        ok: false,
        timeout: true,
        elapsedMs: Date.now() - started,
        index: entry.index,
        provinceId: String(entry.province?.identity?.id ?? entry.province?.id ?? entry.index),
        stdout,
        stderr,
      });
    }, timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        timeout: false,
        elapsedMs: Date.now() - started,
        index: entry.index,
        provinceId: String(entry.province?.identity?.id ?? entry.province?.id ?? entry.index),
        code,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

console.log(`GPU province diagnostic: ${entries.length} provinces, per-province timeout=${timeoutMs}ms.`);
for (const entry of entries) {
  const result = await runWorker(entry);
  results.push(result);
  const line = result.ok
    ? `GPU province diagnostic PASS ${result.index + 1}/${entries.length} ${result.provinceId} ${result.elapsedMs}ms`
    : result.timeout
      ? `GPU province diagnostic TIMEOUT ${result.index + 1}/${entries.length} ${result.provinceId} after ${result.elapsedMs}ms`
      : `GPU province diagnostic FAIL ${result.index + 1}/${entries.length} ${result.provinceId} exit=${result.code} signal=${result.signal ?? "none"}`;
  console.log(line);
  if (!result.ok) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${line}; isolate the province before changing authoritative GIS geometry.`);
  }
}

const max = Math.max(...results.map((result) => result.elapsedMs));
const total = results.reduce((sum, result) => sum + result.elapsedMs, 0);
console.log(`GPU province diagnostic: PASS (${results.length} provinces; total=${total}ms; slowest=${max}ms).`);

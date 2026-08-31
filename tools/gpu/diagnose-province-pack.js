import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = path.join(root, "../src/world/map/assets/historical/1300/runtime.json");
const workerPath = path.join(root, "gpu-province-worker.js");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province, index) => ({ province, geometry: geometryById.get(String(province.identity?.id)), index })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("GPU diagnostic found no historical province geometry.");

const timeoutMs = Number(process.env.GPU_PROVINCE_TIMEOUT_MS ?? 20000);
const concurrency = Math.max(1, Math.min(4, Number(process.env.GPU_PROVINCE_DIAGNOSTIC_CONCURRENCY ?? 2)));
if (!Number.isFinite(timeoutMs) || timeoutMs < 1000) throw new Error(`Invalid GPU province timeout: ${timeoutMs}`);

function runWorker(entry) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [workerPath, String(entry.index)], { cwd: root, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GPU_PROVINCE_DIAGNOSTIC: "1" } });
    let stdout = ""; let stderr = ""; let settled = false;
    const finish = (result) => { if (settled) return; settled = true; clearTimeout(timer); resolve(result); };
    const timer = setTimeout(() => { child.kill("SIGKILL"); finish({ ok: false, timeout: true, elapsedMs: Date.now() - started, index: entry.index, provinceId: String(entry.province?.identity?.id ?? entry.province?.id ?? entry.index), stdout, stderr }); }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); process.stderr.write(chunk); });
    child.on("error", (error) => finish({ ok: false, timeout: false, elapsedMs: Date.now() - started, index: entry.index, provinceId: String(entry.province?.identity?.id ?? entry.province?.id ?? entry.index), error: error.message, stdout, stderr }));
    child.on("close", (code, signal) => finish({ ok: code === 0, timeout: false, elapsedMs: Date.now() - started, index: entry.index, provinceId: String(entry.province?.identity?.id ?? entry.province?.id ?? entry.index), code, signal, stdout, stderr }));
  });
}

let next = 0; const failures = []; const timings = [];
async function lane() {
  while (true) {
    const index = next++; if (index >= entries.length) return;
    const result = await runWorker(entries[index]);
    timings.push(result.elapsedMs);
    const line = result.ok
      ? `GPU province diagnostic PASS ${result.index + 1}/${entries.length} ${result.provinceId} ${result.elapsedMs}ms`
      : result.timeout
        ? `GPU province diagnostic TIMEOUT ${result.index + 1}/${entries.length} ${result.provinceId} after ${result.elapsedMs}ms`
        : `GPU province diagnostic FAIL ${result.index + 1}/${entries.length} ${result.provinceId} exit=${result.code ?? "spawn"} signal=${result.signal ?? "none"}`;
    console.log(line);
    if (!result.ok) failures.push({ ...result, line });
  }
}

console.log(`GPU province diagnostic: ${entries.length} provinces, concurrency=${concurrency}, per-province timeout=${timeoutMs}ms.`);
await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => lane()));
if (failures.length) {
  for (const failure of failures) { if (failure.stdout) process.stdout.write(failure.stdout); if (failure.stderr) process.stderr.write(failure.stderr); }
  throw new Error(failures.map((failure) => failure.line).join("\n"));
}
console.log(`GPU province diagnostic: PASS (${entries.length} provinces; wall-clock lanes=${concurrency}; slowest=${Math.max(...timings)}ms).`);

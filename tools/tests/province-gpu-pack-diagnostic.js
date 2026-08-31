import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const workerPath = path.join(root, "tools/gpu-province-worker.js");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const provinces = runtime.provinces ?? [];
if (!provinces.length) throw new Error("GPU diagnostic found no historical provinces.");

const timeoutMs = Number(process.env.HISTORIA_GPU_PROVINCE_TIMEOUT_MS ?? 20000);
const concurrency = Math.max(1, Math.min(4, Number(process.env.HISTORIA_GPU_DIAGNOSTIC_CONCURRENCY ?? 2)));
if (!Number.isFinite(timeoutMs) || timeoutMs < 1000) throw new Error(`Invalid GPU province timeout: ${timeoutMs}`);

const runWorker = (index) => new Promise((resolve, reject) => {
  const started = Date.now();
  const child = spawn(process.execPath, [workerPath, String(index)], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = ""; let stderr = ""; let settled = false;
  const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); fn(value); };
  const timer = setTimeout(() => {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 250).unref();
    finish(reject, new Error(`GPU province diagnostic TIMEOUT index=${index} elapsed=${Date.now() - started}ms\n${stdout}${stderr}`));
  }, timeoutMs);
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); process.stdout.write(chunk); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); process.stderr.write(chunk); });
  child.on("error", (error) => finish(reject, new Error(`GPU province worker spawn failed index=${index}: ${error.message}`)));
  child.on("close", (code, signal) => {
    if (code === 0) return finish(resolve, { index, elapsed: Date.now() - started });
    finish(reject, new Error(`GPU province diagnostic FAIL index=${index} code=${code} signal=${signal ?? "none"} elapsed=${Date.now() - started}ms\n${stdout}${stderr}`));
  });
});

let next = 0; let completed = 0;
const launch = async () => {
  while (true) {
    const index = next++;
    if (index >= provinces.length) return;
    const result = await runWorker(index);
    completed += 1;
    console.log(`GPU diagnostic PASS ${completed}/${provinces.length} index=${result.index} elapsed=${result.elapsed}ms`);
  }
};

await Promise.all(Array.from({ length: Math.min(concurrency, provinces.length) }, () => launch()));
console.log(`GPU province diagnostics: PASS (${completed}/${provinces.length}, concurrency=${concurrency}, timeout=${timeoutMs}ms).`);

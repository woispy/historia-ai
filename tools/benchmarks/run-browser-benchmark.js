import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || path.join(ROOT, "artifacts/benchmark-result.json");

await mkdir(path.dirname(output), { recursive: true });
await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "benchmark:prepare"], { cwd: ROOT });
await run(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "playwright", "test", "--config=playwright.benchmark.config.js", "--project=chromium", "--workers=1"], {
  cwd: ROOT,
  env: { ...process.env, HISTORIA_BENCHMARK_DURATION_MS: String(durationMs), HISTORIA_BENCHMARK_OUTPUT: output },
});
console.log(`Benchmark result: ${path.relative(ROOT, output)}`);

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? signal}`)));
  });
}

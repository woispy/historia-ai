import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const durationMs = Number(process.env.HISTORIA_BENCHMARK_DURATION_MS || 30000);
const output = process.env.HISTORIA_BENCHMARK_OUTPUT || path.join(ROOT, "artifacts/benchmark-result.json");

await mkdir(path.dirname(output), { recursive: true });
await runNpm(["run", "benchmark:prepare"]);
await runNpx(["playwright", "test", "--config=playwright.benchmark.config.js", "--project=chromium", "--workers=1"]);
console.log(`Benchmark result: ${path.relative(ROOT, output)}`);

function runNpm(args) {
  return runCommand(process.platform === "win32" ? "npm.cmd" : "npm", args, {
    cwd: ROOT,
    env: process.env,
  });
}

function runNpx(args) {
  return runCommand(process.platform === "win32" ? "npx.cmd" : "npx", args, {
    cwd: ROOT,
    env: { ...process.env, HISTORIA_BENCHMARK_DURATION_MS: String(durationMs), HISTORIA_BENCHMARK_OUTPUT: output },
  });
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const spawnOptions = { ...options, stdio: "inherit" };
    // Windows cmd shims can return EINVAL when spawned directly without a shell.
    // Use the platform shell only for the npm/npx launcher; arguments remain explicit.
    if (process.platform === "win32") spawnOptions.shell = true;
    const child = spawn(command, args, spawnOptions);
    child.on("error", reject);
    child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? signal}`)));
  });
}

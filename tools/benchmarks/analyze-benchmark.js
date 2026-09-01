import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const input = process.argv[2] || process.env.HISTORIA_BENCHMARK_INPUT || "artifacts/benchmark-result.json";
const raw = JSON.parse(await fs.readFile(input, "utf8"));
const results = Array.isArray(raw) ? raw : [raw];
const reports = results.map(analyze);
const report = { schema: "historia-benchmark-analysis/v1", generatedAt: new Date().toISOString(), input, runs: reports };
const output = process.env.HISTORIA_BENCHMARK_ANALYSIS_OUTPUT || input.replace(/\.json$/i, "-analysis.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

function analyze(r) {
  if (r.error) return { status: "ERROR", error: r.error };
  const f = r.frameTimeMs || {};
  const pick = r.pickLatencyMs || {};
  const heap = r.heap || {};
  const budget = Number(r.target?.frameMs || 6.944);
  const findings = [];
  const add = (category, severity, metric, evidence, action) => findings.push({ category, severity, metric, evidence, action });

  if (Number.isFinite(f.p99) && f.p99 > budget * 2) add("FRAME_TIME_TAIL", "CRITICAL", "frame.p99", f.p99, "Inspect long-frame trace and CPU/GPU pass timing before changing rendering architecture.");
  else if (Number.isFinite(f.p99) && f.p99 > budget * 1.25) add("FRAME_TIME_TAIL", "HIGH", "frame.p99", f.p99, "Profile frame tail; distinguish CPU blocking from GPU saturation.");
  if (Number.isFinite(f.average) && f.average > budget * 1.1) add("MAIN_THREAD_OR_GPU", "HIGH", "frame.average", f.average, "Use GPU timing plus JS profiler to classify sustained frame cost.");
  if (Number.isFinite(pick.p99) && pick.p99 > 4) add("PICKING_LATENCY", pick.p99 > 12 ? "HIGH" : "MEDIUM", "pick.p99", pick.p99, "Inspect async readback queueing, hover frequency, and staging/mapAsync completion.");
  if (Number.isFinite(heap.growthBytes) && heap.growthBytes > 8 * 1024 * 1024) add("HEAP_GROWTH", "HIGH", "heap.growthBytes", heap.growthBytes, "Run 30-min soak and compare periodic samples; inspect retained arrays, listeners, and renderer disposal.");
  if (Number.isFinite(heap.gcPressureProxyBytes) && heap.gcPressureProxyBytes > Math.max(16 * 1024 * 1024, Math.abs(heap.growthBytes || 0) * 2)) add("GC_PRESSURE", "MEDIUM", "heap.gcPressureProxyBytes", heap.gcPressureProxyBytes, "Inspect allocation rate; treat this as a proxy, not browser GC telemetry.");
  if (r.backend === "webgl2" && Number.isFinite(r.fps) && r.fps < 60) add("WEBGL2_FALLBACK", "HIGH", "fps", r.fps, "Treat WebGL2 as a scalability boundary; inspect draw calls, buffer churn, and readback stalls.");
  if (!findings.length) add("NO_DOMINANT_BOTTLENECK", "INFO", "summary", "No configured threshold exceeded.", "Keep the baseline and compare subsequent optimization runs against the same workload.");

  return {
    status: findings.some(x => x.severity === "CRITICAL") ? "CRITICAL" : findings.some(x => x.severity === "HIGH") ? "ATTENTION" : "PASS",
    backend: r.backend,
    provinces: r.provinceCount,
    fps: r.fps,
    frameTimeMs: f,
    pickLatencyMs: pick,
    heap,
    findings,
    measured: { gpuTimeMs: r.gpuTimeMs ?? null, drawCalls: r.drawCalls ?? null },
  };
}

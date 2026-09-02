# Phase H — Frame Budget, Picking, Telemetry & Integration Closure

## 1. Validation target

The renderer is evaluated against a 144 Hz frame budget:

- Target: 144 Hz
- Frame budget: 6.944 ms
- Stress asset: `stress-15k.mapbin`
- Provinces: 15,000
- Geometry points: 480,000
- Viewport: 3840x2160 CSS pixels
- DPR: 2
- Internal render target: 7680x4320
- GPU: NVIDIA GeForce GTX 1080 Ti / Pascal

## 2. Locked picking decision

The three-mode benchmark matrix establishes that picking is not a frame-budget bottleneck under the paced 144 Hz workload.

- `paced144`: 144.003 Hz, render CPU p50 0.10 ms, picking completion 100%, picking E2E p50 4.9 ms.
- `paced144-no-picking`: 143.991 Hz, render CPU p50 0.10 ms, GPU compute/cull/finalize average 0.01830 ms.
- `isolatedPick`: picking completion 100%, E2E p50 5.1 ms, queue completion p50 3.0 ms, readback synchronization p50 2.8 ms.

The previous unconstrained hundreds-of-milliseconds picking measurements were queue-flood/self-interference artifacts. No picking shader, resource, or async 1x1 readback architecture change is justified.

## 3. Telemetry decision

Benchmark GPU timestamp telemetry is sampled at low pressure:

- Ring slots: 64
- Timestamp sampling interval: 256 benchmark frames
- Dropped samples in the validated paced workload: 0
- Timestamp error: `null`

Production H9 timestamp infrastructure is intentionally untouched. `BenchmarkGpuTelemetry` remains benchmark-only.

## 4. Pass-level profiling

`BenchmarkPassProfiler` is benchmark-only and instruments the real `GPUCommandEncoder` pass boundaries using WebGPU timestamp queries. It does not alter the production renderer's H9 timing implementation.

Normal render passes are reported separately as:

1. `cull` — compute culling / index generation
2. `finalize` — indirect draw argument finalization
3. `draw` — province render pass

Picking continues to be measured by the isolated async-readback pipeline.

Sampling is deliberately sparse (256 benchmark operations) so the profiler cannot become the workload being measured.

## 5. Measurement rule

No micro-optimization is allowed solely from code inspection. A pass is changed only if its measured CPU/GPU contribution demonstrates a meaningful risk to the 6.944 ms frame budget or causes an observable regression in the 144 Hz A/B matrix.

## 6. Integrated A–H architecture

The branch contains the integrated GPU map-engine migration through Phase H, including:

- binary map asset loading and SoA province data
- map camera/runtime controller
- WebGPU renderer contract and factory integration
- compute culling
- indirect draw finalization
- GPU province rendering
- asynchronous 1x1 picking readback
- frame/pass profiler
- benchmark GPU telemetry
- stress benchmark tooling and 15k-province asset generation
- production and benchmark timestamp probes
- runtime/contract/stress tests

The current branch is intentionally kept separate from `main` until integration is performed against the current `main` tip. The branch currently diverges from `main`, so merge/rebase is a separate integration operation and should not be conflated with performance validation.

## 7. Local validation procedure

From the repository root in VS Code PowerShell:

```powershell
cd C:\Users\Woispy\Documents\Projects\historia-ai
git checkout refactor/gpu-map-engine-v2-gpu-timing-fix
git pull origin refactor/gpu-map-engine-v2-gpu-timing-fix
npm install
npm run dev
```

Then open the local Vite application and verify visually:

- the world map renders without blank/black canvas failure;
- zoom in/out remains responsive;
- pan/camera motion remains responsive;
- province hover/picking responds without visible stalls;
- the 15k-province stress asset can be loaded by the benchmark route;
- browser console contains no renderer/import/runtime errors.

For the final benchmark matrix, keep the benchmark server available and run:

```powershell
$env:HISTORIA_FRAME_PROFILING_DURATION_MS="30000"
$env:HISTORIA_BENCHMARK_MODE="paced144"
npx playwright test -c playwright.benchmark.config.js --project=chromium --workers=1 tools/benchmarks/frame-profiling.spec.js

$env:HISTORIA_BENCHMARK_MODE="paced144-no-picking"
npx playwright test -c playwright.benchmark.config.js --project=chromium --workers=1 tools/benchmarks/frame-profiling.spec.js

$env:HISTORIA_BENCHMARK_MODE="isolatedPick"
npx playwright test -c playwright.benchmark.config.js --project=chromium --workers=1 tools/benchmarks/frame-profiling.spec.js
```

The updated specification now requires pass-level GPU timing coverage (`cull`, `finalize`, `draw`) for the render modes and rejects dropped pass samples.

## 8. Closure criteria

Phase H is considered performance-closed when:

- paced 144 Hz remains at target cadence;
- render CPU remains far below the 6.944 ms budget;
- pass-level GPU measurements show no pass with meaningful frame-budget risk;
- picking remains 100% complete under the validated paced workload;
- benchmark timestamp drops remain zero;
- timestamp errors remain null;
- no production H9 timing regression is introduced;
- local visual smoke validation is clean.

Until the final pass-level benchmark is executed locally, the correct status is **Phase H performance validation pending final pass-level numbers**, not premature optimization.

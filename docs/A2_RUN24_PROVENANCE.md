# A2 Run #24 — Provenance Record

Status: **Open / forensic only**

Last reviewed: **2026-09-17**

## Purpose

Record the historical GitHub Actions executions associated with PR #89 / Run #24 and determine whether they contain the claimed `0.006755 → ~2.27e-13` Amisos collapse.

This document is evidence-only. It does not authorize production geometry, physical-authority, `MIN_AREA`, renderer, GPU, or topology changes.

## Execution 1 — first telemetry workflow

The first A2 telemetry workflow was introduced by commit `a4e646b0584c4cd7289eccc716c7d8b1ff178088`, immediately after the telemetry test file was added by `4e249b66f715e0cef63bb13c43772f4fa6eab1b7`.

At that point the workflow executed:

```text
node tools/tests/phase2d-a2-amisos-edge-telemetry.mjs
```

and the telemetry script resolved the V15 builder from the checked-out workspace rather than from a pinned forensic source tree.

The corresponding GitHub Actions execution was:

```text
workflow:  Phase 2.8-C A2 Amisos Telemetry
run id:    34352910724
run number: 1
head SHA:  a4e646b0584c4cd7289eccc716c7d8b1ff178088
result:    failure
```

The job reached `Generate required GIS runtime assets` successfully, but the telemetry step failed immediately afterward. The artifact-upload step also failed and GitHub retained **zero artifacts** for this execution.

Therefore this execution is important as provenance history, but it does **not** provide a retained telemetry artifact from which the `~2.27e-13` observation can be recovered.

## Execution 2 — retained Run #24 artifact

The later successful execution associated with PR #89 is workflow run `34398688728` (workflow run number `11`) on head `78c70ec516852c461c42ceee18c7e64e904843ac`.

Its retained artifact is:

```text
name:   phase2.8-c-a2-amisos-edge-telemetry
id:     10122933006
digest: sha256:cc697c0973a5a8ed4efb8b305dba013f782b9f85d03a91a5588ee734663920f9
```

The artifact explicitly records:

```text
sourceSHA          = 3575c1bccf94a322fed175958ce786531b142497
rawArea            = 0.5023951571206453
normalizedArea     = 0.5023951571206453
minArea            = 0.00005
collapseObserved   = false
```

All six V15 normalization edges enter as physical edges and the final normalized polygon retains six vertices and the same area.

## Consequence for the A2 hypothesis

The evidence now establishes two separate historical facts:

1. The first telemetry execution used an unpinned checked-out V15 source tree, but it failed before producing a retained artifact.
2. The later retained telemetry execution used the explicitly pinned V15 source SHA and produced `0.5023951571206453 → 0.5023951571206453`, with no collapse.

Therefore it is **not justified** to state that the `~2.27e-13` observation came from the unpinned V15 execution. The unpinned execution is a provenance gap, not a reproduced producer of the anomaly.

The separate canonical stage trace remains the only currently reproduced source of the historical `0.006755373858482017` raw-cell value, and it also produces no tiny-area hit.

Current A2 model:

```text
historical ~2.27e-13 observation
              │
              ▼
       source/artifact unknown
              │
       provenance discontinuity
              │
      ┌───────┴────────┐
      ▼                ▼
canonical trace    retained V15 trace
0.006755...        0.502395...
no tiny hit        no tiny hit
```

## Locked decisions

- Do not change `MIN_AREA`.
- Do not change normalization constants or repair depth.
- Do not enlarge the Amisos polygon.
- Do not alter MapBin or GPU normalization.
- Do not merge PR #89 or any forensic branch into production.
- `SAFE TO DELETE = 0`.
- Local convergence remains locked until the authoritative `1586/1586` GIS gate is green.

## Next forensic target

Trace the historical producer/report that first asserted or displayed `~2.27e-13` and identify its exact:

```text
execution
→ head SHA
→ source tree
→ input polygon
→ transformation stage
→ serialized/report representation
```

Only a common lineage connecting the `0.006755373858482017` cell to the tiny observation can close A2.

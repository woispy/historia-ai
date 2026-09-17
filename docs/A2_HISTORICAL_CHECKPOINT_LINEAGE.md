# A2 — Historical Checkpoint Lineage Inventory

Status: **Open / forensic only**  
Last reviewed: **2026-09-17**

## Purpose

Record the additional historical checkpoint lineage discovered on the dedicated A2 forensic branch `codex/phase2.8-c-a2-edge-trace` without promoting any result to production authority.

This document records **test capability and source lineage**, not a reproduced `0.006755 → ~2.27e-13` collapse.

## Newly identified forensic harness

The branch currently contains a combined producer-lineage workflow:

```text
.github/workflows/phase2d-a2-producer-lineage.yml
```

Its workflow explicitly reconstructs a canonical worktree at:

```text
6b7424125eee4a1c72925b7a1780c68e695e9ba3
```

and runs four forensic probes:

1. `phase2d-a2-producer-lineage-v3.mjs`
2. `phase2d-a2-stage-trace.mjs`
3. `phase2d-a2-counterfactual-land-halfplane.mjs`
4. `phase2d-a2-authority-isolation.mjs`

The workflow uploads their outputs as one forensic artifact. The current branch HEAD is `e4c184f46f35f03f6d38f606628938b74d788fbc`, whose latest commit is `test: make A2 checkpoint execution identity explicit`. This commit adds explicit execution identity (`branch`, `HEAD`, target area `2.27e-13`, tiny epsilon `1e-10`, Node and Git versions) to the retained forensic artifact. No retained CI execution artifact for this exact HEAD has yet been verified, so the harness remains **available test machinery, not execution evidence**.

## Historical checkpoint set

The counterfactual probe identifies three historical V15 checkpoints:

| Label | Commit | Intended question |
|---|---|---|
| `V0_5f_old-land_correct-halfplane` | `5f48731eec9804e99abd9ce60ea7f0b5d3ef5713` | Baseline before the full physical-land partition switch |
| `V1_bdf_new-land_broken-halfplane` | `bdf166a42bdccf1ce4669488f3a84c97b9e2dc2e` | Full physical-land authority switch with an intermediate half-plane edit |
| `V2_3021_new-land_correct-halfplane` | `3021b2d1104c8ea9e9f700435c453adf5f1ae4e8` | Same physical-land authority with restored exact half-plane interpolation |

The commit history confirms:

- `5f48731e...` removes an unused `PHYSICAL_LAND_POLYGONS` import and uses `ANATOLIA_PHYSICAL_ATLAS.landPolygons` for partition input.
- `bdf166a4...` switches partition input to `PHYSICAL_LAND_POLYGONS` from the shared physical-land authority.
- `3021b2d1...` restores the exact power half-plane interpolation after the intermediate `bdf166a4...` edit.

The intermediate `bdf166a4...` diff contains an additional `currentValue` expression that is not used by the subsequent interpolation calculation; the commit immediately after it restores the original exact expression. This is a historical code discontinuity, but **it is not by itself evidence that this checkpoint produced the A2 tiny-area observation**.

## Authority-isolation probe

The dedicated authority-isolation test takes checkpoint `bdf166a4...` and temporarily substitutes the older `ANATOLIA_PHYSICAL_ATLAS.landPolygons` partition source for the newer `PHYSICAL_LAND_POLYGONS` source. It also suppresses unrelated province failures so that Pontus-Amisos can be observed in isolation.

This creates a controlled comparison:

```text
BDF checkpoint
    ├── shared PHYSICAL_LAND_POLYGONS
    └── old ANATOLIA_PHYSICAL_ATLAS.landPolygons

             ↓
        Amisos output
```

Again, this is a **probe definition**, not a result. No conclusion about the tiny-area producer is authorized until the probe is actually executed and its artifact is retained.

## Producer-lineage probe scope

The producer-lineage V3 harness reconstructs the canonical `6b7424...` worktree and instruments the `powerCell` return path for `pontus-amisos`. It then records the final exported Amisos polygon area, vertex count, site counts and geometry version.

This is useful because it isolates the canonical producer representation before later runtime stages. It does not by itself reproduce the historical tiny value unless the historical artifact shares the same input and transformation lineage.

## New execution archaeology finding

The first retained-history gap can now be explained precisely. The original telemetry workflow execution `34352910724` did not fail inside the geometry producer. Its job successfully completed dependency installation and the GIS asset-generation step, then failed when the telemetry script attempted to open:

```text
tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js
```

from the checked-out candidate workspace. The file did not exist at that workflow head, producing an `ENOENT` filesystem error. The subsequent artifact upload also failed because the expected telemetry JSON had not been produced.

Therefore the first unpinned execution is a **missing-source execution gap**, not evidence that the unpinned producer generated `~2.27e-13`.

By contrast, the later retained execution explicitly fetched the pinned V15 source tree at `3575c1bccf94a322fed175958ce786531b142497`, verified the source path, ran the telemetry successfully, and retained an artifact. That artifact recorded `rawArea = normalizedArea = 0.5023951571206453` and `collapseObserved = false`.

This distinction is important: the historical provenance gap is now characterized as **execution/input availability failure**, while the actual retained V15 execution remains a clean no-collapse observation.

## Current interpretation

The checkpoint machinery narrows the historical search space, but it does **not** close A2.

Current proven facts remain:

```text
canonical stage trace       → 0.006755373858482017 → no tiny hit
pinned V15 Run #24          → 0.5023951571206453   → no tiny hit
first unpinned telemetry   → ENOENT before producer result
historical ~2.27e-13       → producer/artifact still unidentified
```

The current checkpoint branch has now been instrumented so that any future retained execution can be tied unambiguously to its exact branch/HEAD and target threshold. Until such an artifact exists, no checkpoint result should be treated as an executed finding.

The remaining question is therefore not simply “which code version was buggy?” It is:

```text
Which historical artifact first contained ~2.27e-13,
and what exact geometry representation did that artifact measure?
```

## Locked decisions

- Do not change `MIN_AREA`.
- Do not change normalization constants or repair depth.
- Do not alter MapBin/GPU behavior.
- Do not promote checkpoint behavior to canonical authority.
- Do not merge `codex/phase2.8-c-a2-edge-trace` into production.
- `SAFE TO DELETE = 0`.
- Local convergence remains locked until the authoritative `1586/1586` GIS gate is green.

## Next forensic action

Execute the instrumented checkpoint/authority-isolation harness under CI, retain the artifact including `execution-identity.txt`, and compare the Amisos producer areas and polygons across `5f48731e...`, `bdf166a4...`, and `3021b2d1...`.

Acceptance is **not** merely “one checkpoint differs.” The required evidence is a common lineage that explains:

```text
historical input polygon
        ↓
checkpoint/source SHA
        ↓
producer stage
        ↓
intermediate representation
        ↓
~2.27e-13
```

Only then can A2 move from `BLOCKED / provenance discontinuity` to a surgical root-cause decision.

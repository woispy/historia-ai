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

The workflow uploads their outputs as one forensic artifact. The branch HEAD inspected on 2026-09-17 is `985f97b072e0b91a4713f6757f3c8339a759c4b6`, with the latest commit titled `test: run A2 stage trace across historical checkpoints`.

No retained workflow result was found for that branch HEAD during this review, so these probes are currently **available test machinery, not execution evidence**.

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

## Current interpretation

The newly discovered checkpoint machinery narrows the historical search space, but it does **not** close A2.

Current proven facts remain:

```text
canonical stage trace       → 0.006755373858482017 → no tiny hit
pinned V15 Run #24          → 0.5023951571206453   → no tiny hit
historical ~2.27e-13       → producer/artifact still unidentified
```

The checkpoint set adds a third investigation axis:

```text
V0 old-land
      ↓
V1 new-land + intermediate half-plane edit
      ↓
V2 new-land + restored half-plane
      ↓
compare Amisos producer output
```

Until an executed artifact shows the tiny value, these checkpoints remain **candidate historical representations**, not the root cause.

## Locked decisions

- Do not change `MIN_AREA`.
- Do not change normalization constants or repair depth.
- Do not alter MapBin/GPU behavior.
- Do not promote checkpoint behavior to canonical authority.
- Do not merge `codex/phase2.8-c-a2-edge-trace` into production.
- `SAFE TO DELETE = 0`.
- Local convergence remains locked until the authoritative `1586/1586` GIS gate is green.

## Next forensic action

Execute the already-defined checkpoint/authority-isolation harness under CI, retain the artifact, and compare the Amisos producer areas and polygons across `5f48731e...`, `bdf166a4...`, and `3021b2d1...`.

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

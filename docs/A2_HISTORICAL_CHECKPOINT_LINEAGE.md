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

The forensic branch has since advanced to `2343d98ef23b20b01780e202575ea7ca725be8de`, which adds a controlled historical-V15 normalization probe for the canonical Amisos raw polygon.

The workflow runs producer, stage, counterfactual, authority-isolation and V15 transformation probes. All outputs are retained as forensic artifacts; none is production authority.

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

The latest exact-head execution retained the probe output, but the authority-isolation path still encounters the unrelated `caria-halikarnassos` geometry failure before a complete common Amisos lineage can be established.

## Producer-lineage probe scope

The producer-lineage V3 harness reconstructs the canonical `6b7424...` worktree and instruments the `powerCell` return path for `pontus-amisos`. It records the final exported Amisos polygon area, vertex count, site counts and geometry version.

The exact-head retained execution at branch HEAD `2343d98...` records canonical producer output:

```text
commit        = 6b7424125eee4a1c72925b7a1780c68e695e9ba3
vertexCount  = 5
area         = 0.0067547530500178254
siteCount    = 5633
politicalSites = 1683
geometryVersion = 2
```

No `2.27e-13` value is present in the producer result or producer trace.

## Execution archaeology

The original telemetry workflow execution `34352910724` did not demonstrate an anomalous producer result. It completed dependency installation and GIS asset generation, then failed because the telemetry script attempted to open:

```text
tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js
```

from a workspace where that file did not exist. This produced `ENOENT`; the expected telemetry JSON was therefore not created.

The later retained execution explicitly fetched the pinned V15 source tree at `3575c1bccf94a322fed175958ce786531b142497`. That execution produced:

```text
rawArea        = 0.5023951571206453
normalizedArea = 0.5023951571206453
collapseObserved = false
```

Thus the original unpinned run is a **missing-source execution gap**, not evidence of the tiny-area producer.

## Retained Run #26 V4 execution evidence

Workflow run `35234798862` retained the V4 stage replay artifact from HEAD `8cb5151b74b5174d78570b2aea1acf455b15a686`.

The replay recorded zero tiny hits at all six checkpoints. At canonical `6b742412...`, the minimum observed stage area was `0.0034620092040995587`; the accepted Amisos raw-cell value remained `0.006755373858482017`.

The runtime-to-GPU report recorded Amisos runtime/GPU area `0.15216490540012728`, with GPU raw and normalized values identical and no tiny-area hit.

## Exact-head forensic execution

A retained GitHub Actions execution now exists for the instrumented forensic branch HEAD `2343d98ef23b20b01780e202575ea7ca725be8de`.

Workflow run:

```text
35267020164
```

The execution identity and forensic artifacts were retained successfully. The producer lineage, stage/edge traces, V15 probes, B-series probes and other forensic steps completed at this exact branch HEAD.

This satisfies the **execution-identity portion** of Issue #104, but does not close the issue because the complete V0/V1/V2 and authority-isolation evidence still does not establish a common lineage to `~2.27e-13`.

## New historical-V15 normalization experiment

The latest forensic branch adds a controlled experiment: take the canonical Amisos raw polygon and pass that exact geometry through the historical V15 `normalizePhysicalBoundary` path.

The canonical raw representation has area approximately:

```text
0.006755373858482017
```

The historical V15 normalization result is approximately:

```text
0.006626536473277156
```

with an area ratio of approximately:

```text
0.9809281635770472
```

This means approximately 98.09% of the raw area survives the historical normalization path. The transformation therefore **does not reproduce `2.27e-13`** and is not the missing collapse mechanism.

The V15 probe also operates on a different historical Amisos geometry in its own producer path, with the retained pinned-V15 result `0.5023951571206453`. Therefore the old model:

```text
canonical 0.006755
    ↓
V15 producer
    ↓
2.27e-13
```

is unsupported. The canonical and V15 producer geometries are different representations/lineages.

## Historical representation transition finding

The commit archaeology now identifies a second important representation family: the Phase 2D fallback sequence.

Commit `0dd1dadb90103b5706fd87c470b8d4a6dc85f496` introduced `createAnchorFallbackPolygon()` and allowed a province with no generated polygon to receive a generated six-vertex fallback. The same commit added `fallbackProvinceCount` to the output diagnostics. fileciteturn418file0L3-L7

Subsequent historical commits changed the fallback behavior. In particular:

- `2edad3f...` reduced fallback radii from `[0.03, 0.015, 0.008]` to `[0.004, 0.002, 0.001]`. fileciteturn423file0L3-L11
- `8fb70748...` changed acceptance from requiring every fallback vertex to be physical land to requiring only the centroid to be physical land. fileciteturn422file0L3-L11
- `535d6a6...` explicitly treated tiny fallback polygons differently in the test invariant: polygons below `0.00005` were allowed to bypass the normal centroid-land assertion. fileciteturn421file0L3-L11

These commits establish a historical **tiny-fallback representation family**, but they do **not** prove that any of these fallbacks produced the specific `2.27e-13` Amisos artifact. The evidence currently available shows only that tiny fallback geometry was deliberately introduced and subsequently modified.

## Clipping representation transition

Commit `3db105afb857be55e0ce7696f3d7e904185fc5f8` introduced the custom `clipCellToLand()` path before runtime export. It gathered cell points, land vertices and segment intersections, deduplicated points using six-decimal coordinate keys, sorted them around the centroid, and then applied `roundPolygon()` at five decimal places before export. fileciteturn416file0L3-L7

This is a high-priority historical representation boundary because it changes the polygon from a raw Voronoi cell into a reconstructed clipped polygon and then applies coordinate rounding. It is **not yet proven** to produce `2.27e-13`.

Later commit `16c17706c436954eacb76b8262480388b40d673b` retained the Voronoi partition while changing the rounded-geometry integrity check and fallback handling. fileciteturn417file0L3-L11

## Checkpoint replay evidence — V1/V2 do not reproduce the tiny artifact

A retained checkpoint replay artifact was inspected independently during the current forensic pass:

```text
bdf166a4  → Amisos runtime polygons: 4.057109021412884 and 0.002238248805042531
3021b2d1  → identical Amisos runtime polygons: 4.057109021412884 and 0.002238248805042531
6b742412  → Amisos runtime polygons include 0.0067547530500178254
```

None of these values is within the tiny threshold `1e-10`. The replay also reports no exact target hit at `2.27e-13`.

The `5f48731e...` baseline is **not yet a successful common-lineage result** in that artifact: its replayed build path did not complete, so it cannot be used to claim a V0 numerical result.

This materially narrows the checkpoint hypothesis. The intermediate `bdf166a4...` half-plane edit and the restored `3021b2d1...` implementation both converge to the same Amisos output in the retained replay. They therefore do not currently explain the historical tiny artifact.

## New measurement hypothesis — signed-area cancellation / topology

External review suggested a separate possibility that is now being tested without modifying production code: the historical `clipCellToLand()` does not perform a conventional polygon clip. It collects points, deduplicates them, computes their arithmetic center, and sorts by `atan2()` before applying shoelace area.

That construction can be sensitive to non-convex point sets. A self-intersecting or nearly self-intersecting ordered ring can have a large spatial extent while its shoelace terms cancel to a very small residual.

The decisive diagnostic is therefore not just absolute area. The forensic probe now records, for each raw and rounded candidate:

- ordinary shoelace absolute area;
- origin-translated shoelace area;
- vertex count;
- self-intersection pairs;
- six-decimal deduplication count and area;
- five-decimal rounded representation.

Interpretation will be:

```text
ordinary area ≈ 2.27e-13
translated area ≫ ordinary area
→ numerical cancellation is implicated

ordinary area ≈ translated area ≈ 2.27e-13
→ geometry is genuinely near-degenerate / topologically collapsed

self-intersections present with large bbox
→ angle-sort/topological ordering becomes a primary suspect
```

This remains a **hypothesis under test**, not a root-cause conclusion.

## Precision-alignment hypothesis — status

The `uniquePoints(6)` → `roundPolygon(5)` mismatch remains a valid representation-boundary candidate, but it is not sufficient evidence by itself. Five-decimal rounding can collapse nearby vertices, yet the exact historical `2.27e-13` artifact has not been recovered from the available retained polygons.

Therefore no change from six to five decimals, or from five to six decimals, is authorized at this stage.

## Current interpretation

The strongest current facts are:

```text
canonical producer             → 0.0067547530500178254 → no tiny
canonical raw stage            → 0.006755373858482017 → no tiny
V15 normalize(canonical raw)   → ~0.006626536473      → no tiny
pinned V15 producer            → 0.5023951571206453   → no tiny
Run #26 V4 replay              → no tiny at all checkpoints
fallback history               → tiny fallback family exists
clipCellToLand Run #9          → no tiny / no filter-collapse / no self-intersection
clipCellToLand history         → custom reconstruction + rounding exists
historical ~2.27e-13           → still unidentified
```

The working hypothesis is therefore now **historical geometry representation/provenance discontinuity**. The clip-lineage branch has now been exercised without reproducing the artifact, so the remaining priority is the exact historical artifact identity plus the fallback/serialization representation family. The tested clip path remains part of the audit trail, but it is no longer supported as the immediate producer by Run #9.

Priority next:

1. identify the first artifact/run that recorded `2.27e-13`;
2. reconstruct the tiny-anchor fallback family and its serialization/rounding boundaries;
3. preserve the clip-lineage Run #9 evidence as a negative reproduction result.

Neither branch is authorized as the root cause until the exact historical artifact or an exact numerical reproduction is obtained.


## Run #27 — canonical-targeted producer-lineage execution arm (2026-09-18)

- Forensic branch: `codex/phase2.8-c-a2-edge-trace`
- Instrumentation head: `1f410f7a3f2e93a8c7302c81d7c54baee616cfe6`
- Change: `.github/workflows/phase2d-a2-producer-lineage.yml` gained a `pull_request` trigger targeting `integration/phase-a-h-production`, in addition to the existing branch-push and manual triggers.
- Forensic PR: #106, draft, base `integration/phase-a-h-production`, explicitly marked no-merge / no-production-mutation.
- Purpose: obtain an auditable Actions execution artifact tied to the exact instrumentation HEAD. This is an execution mechanism change only; it does not alter production geometry, authority, MIN_AREA, or runtime behavior.
- Observation at checkpoint recording time: the GitHub connector exposes no workflow run or status for `1f410f7...` yet. Therefore no execution result or artifact is claimed from this arm until independently retrieved.
- Next evidence gate: retrieve the exact-head `phase2d-a2-fallback-lineage` artifact and inspect raw → round(5) → importer → MapBin → Float32 traces, including the early fallback clip boundary trace.

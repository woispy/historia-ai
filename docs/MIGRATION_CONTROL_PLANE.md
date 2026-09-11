# Historia AI — Migration Control Plane

## Purpose

This document defines the controlled path for converging fragmented GitHub work and the local repository onto one canonical production line without losing provenance or silently changing behavior.

## Canonical references

- Canonical production branch: `integration/phase-a-h-production`
- Canonical production baseline: `6b7424125eee4a1c72925b7a1780c68e695e9ba3`
- P6.2 sync branch: `integration/p6.2-phase-a-h-sync`
- P6.2 boundary feature: `feat/p6.2-boundary-solver-foundation`
- V15 shadow forensic branch: `codex/phase2.8-c-v15-shadow`
- V15 raw forensic branch: `codex/phase2.8-c-v15-raw-forensics`
- A2 edge trace branch: `codex/phase2.8-c-a2-edge-trace`

## Constitutional locks

1. Zero Blind Code Mutation.
2. Zero Algorithmic Mutation until root cause is proven.
3. Zero Assertion Relaxation.
4. Production Builder, Canonical Authority, Game Core, and PR #87 remain isolated.
5. `SAFE TO DELETE = 0` until provenance and equivalence are proven.
6. No merge, reset, rebase, force-push, or deletion as an archaeological shortcut.
7. Local sync is locked until the authoritative GIS gate is green at `1586/1586`.

## Migration states

Every work item and branch must be assigned one of these states:

- `CANONICAL` — already represented by the canonical production line and verified by behavior/CI.
- `INTEGRATE` — unique work proven valuable and ready for a controlled migration.
- `PRESERVE` — historically valuable or still under forensic investigation; do not merge or delete.
- `SUPERSEDED` — behavior is proven equivalent to a newer canonical implementation.
- `BLOCKED` — dependency or gate prevents migration.
- `SAFE TO DELETE` — only after explicit provenance, equivalence, CI, and reference checks. Current value: `0`.

## Migration ledger

This ledger is the authoritative tracking surface for work that may eventually reach canonical. **No candidate is allowed to disappear from the migration process merely because its branch is old, renamed, or superseded by another investigation.**

| Migration ID | Workstream | Source branch / commits | Unique value | Canonical destination | Evidence status | Current disposition | Next action |
|---|---|---|---|---|---|---|---|
| `MIG-2.8-A1` | Native micro-polygons | Canonical geometry generation; Smyrna, Ayasuluk, Pecin, Halikarnassos, Sinop | Five raw canonical polygons are already below `MIN_AREA` | Canonical Phase 2D generation/input geometry | Root cause class established; generation/input proof still required | `BLOCKED` | Complete generation/input proof; do not change `MIN_AREA` |
| `MIG-2.8-A2` | Amisos normalization collapse | `codex/phase2.8-c-v15-raw-forensics`, `codex/phase2.8-c-a2-edge-trace`; V15 builder `37cc47ecf7cef0aa12abffb6fe3e1a527fd409c9`; V15 authority `c47238cee6ab6b9c522e11b5f1cd92ad0d5970a3` | The earlier claim that canonical raw area ~`0.006755` collapses to ~`2.27e-13` inside V15 normalization is **not reproduced** when the exact canonical Amisos raw polygon is fed directly to V15 `normalizePhysicalBoundary()` | Phase 2D boundary/normalization path | A2 exact symbol resolution established; direct canonical→V15 edge trace shows area preserved (~98.1% of input) with no repair recursion; the previously attributed V15 normalization collapse is a rejected hypothesis | `BLOCKED` | Locate the actual transformation that produced ~`2.27e-13`; do not change behavior or constants until that stage is reproduced |
| `MIG-2.8-B` | Nicomedia/Nicaea edge repair | `codex/phase2.8-c-v15-shadow`, `codex/phase2.8-c-v15-raw-forensics` | Deterministic cross-geometry edge-repair divergence | Shared physical boundary/repair contract | Deterministic symptom proven; extraction not yet authorized | `BLOCKED` | Compare canonical edge, V15 raw edge, authority boundary, first-invalid sample |
| `MIG-2.8-C` | Amasya authority semantics | V15 raw forensic lineage | Lake-interior vs physical-land boundary semantic distinction | MW-02 physical authority contract | Semantic class established; decision matrix pending | `BLOCKED` | Complete endpoint authority decision matrix |
| `MW-02` | Physical land authority consolidation | `85fe793a4d0f4801c3805d78ebd211019566e979` + lineage | Shared `PHYSICAL_LAND_POLYGONS` and recovery authority | `tools/historical-gis/recovery/physical-land-authority.mjs` on canonical line | Provenance established; migration gate blocked by 2.8-C | `PRESERVE` | Migrate only the proven authority contract after 2.8-C gate |
| `MW-01` | CDSE DEM source adapter | P6.2 DEM contract lineage | Copernicus Data Space `COP-DEM_GLO-30-DGED`, release `2024_1` contract | DEM source adapter / asset-builder boundary | Contract known; authenticated acquisition not claimed | `BLOCKED` | Keep isolated; migrate adapter only after evidence and source verification |
| `P6.1` | Real Anatolia adjacency diagnostics | `feat/p6.1-real-anatolia-adjacency` | Non-authoritative candidate adjacency/MST diagnostics | Future topology/AI diagnostic layer | Candidate evidence exists; authoritative promotion not approved | `PRESERVE` | Reconcile with topology authority after GIS migration |
| `Phase H` | GPU timing/profiling work | Phase H GPU branches / PR #84 lineage | Measured 144 Hz/picking/pass timing evidence | GPU benchmark/production hardening | Historical evidence exists; equivalence/integration audit pending | `PRESERVE` | Audit unique production-relevant deltas before integration |
| `Phase G` | Gameplay/simulation foundation | PR #81/#82 lineage | Deterministic simulation RNG and save-library runtime contracts | WorldState / Save-Load runtime | Historical CI evidence exists; canonical incorporation not yet reconciled | `PRESERVE` | Inventory against canonical runtime before any merge |

## Required evidence for migration

For each candidate branch/work item record:

1. Branch HEAD SHA.
2. First and last meaningful commits.
3. Unique commits relative to canonical.
4. Unique files and symbols.
5. Canonical equivalent file/symbol/behavior, if any.
6. CI evidence for the candidate.
7. Production impact assessment.
8. Dependency/authority relationships.
9. Migration destination.
10. Final disposition.
11. If integrated: canonical commit SHA and authoritative CI run.

## Synchronization protocol

### Phase S0 — Freeze

Do not synchronize local and GitHub by force. Keep the current canonical production baseline intact.

### Phase S1 — Inventory

Reconcile GitHub refs, local refs, commit history, tracked files, and known forensic records.

### Phase S2 — Ownership map

Map every meaningful branch/workstream to the system it owns and identify whether its behavior is already canonical.

### Phase S3 — Evidence gate

Run targeted tests and forensic probes. No integration decision is made from branch age, naming, or commit count alone.

### Phase S4 — Controlled integration

Only proven `INTEGRATE` work is moved toward the canonical line, in small, independently testable units. Each unit must immediately receive a ledger entry with source provenance and resulting canonical SHA.

### Phase S5 — Canonical gate

Require the complete authoritative GIS gate and relevant regression suite to be green before declaring convergence.

### Phase S6 — Local convergence

Only after the gate is green, align the local repository to the verified canonical SHA. Preserve any unmerged work in named branches; do not destroy local provenance.

### Phase S7 — Cleanup

Only after convergence and provenance review may any branch become a `SAFE TO DELETE` candidate. Deletion is a separate, reversible decision and is never part of synchronization itself.

## Current forensic migration gate

The active blocker is Phase 2.8-C authoritative geometry migration. The current evidence set distinguishes four classes and must not be collapsed into one generic failure count:

| Class | Scope | Current classification | Migration consequence |
|---|---|---|---|
| A1 | Smyrna, Ayasuluk, Pecin, Halikarnassos, Sinop | Native canonical micro-polygons below `MIN_AREA` in raw canonical generation | Investigate canonical generation/input geometry; do not change `MIN_AREA` |
| A2 | Pontus-Amisos | **The previously reported V15 normalization collapse is not reproduced by direct canonical-raw → V15 normalization tracing.** The exact stage producing ~`2.27e-13` remains unidentified. | Reproduce the actual collapse stage before any algorithmic change |
| B | 8 Nicomedia edges + 1 Nicaea edge | Cross-geometry recursive edge-repair divergence; deterministic max-depth behavior | Compare canonical edge, V15 raw edge, authority boundary, and first-invalid sample before extraction |
| C | Pontus-Amasya edge 3 | Authority semantic boundary case involving lake interior semantics | Complete endpoint decision matrix before authority migration |

### A2 evidence correction — 2026-09-11

A dedicated forensic branch `codex/phase2.8-c-a2-edge-trace` was created from the retained V15 raw-forensics lineage. It obtains the **raw canonical Amisos polygon directly from canonical production SHA `6b7424125eee4a1c72925b7a1780c68e695e9ba3`**, then feeds that exact polygon into the retained V15 `normalizePhysicalBoundary()` implementation without changing V15 behavior.

Targeted workflow run: `34604315604` (`Phase 2D V15 Raw Forensics`). The produced A2 trace artifact records:

- canonical raw Amisos area: approximately `0.006755`
- V15 normalization output area: approximately `0.0066265`
- area ratio: approximately `0.981`
- no recursive repair events on the traced canonical→V15 normalization path

Therefore the earlier statement “Amisos collapses during V15 normalization” is a **rejected hypothesis**. This does **not** close A2: it proves that the reported `~2.27e-13` value came from another transformation, input representation, or stage not yet isolated.

No `MIN_AREA`, `MAX_EDGE_REPAIR_DEPTH`, `RECOVERY_STEP`, or `MAX_RECOVERY_DISTANCE` change is authorized.

## A2 exact symbol resolution

The canonical production builder at `integration/phase-a-h-production` is `tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`. Its current implementation keeps physical-land authority inline (`isPhysicalLandPoint`, `isPhysicalLandPolygon`, `distanceToLandBoundary`) and does not expose the V15 normalization functions as public symbols. urlCanonical Phase 2D builderhttps://github.com/woispy/historia-ai/blob/integration/phase-a-h-production/tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js

The retained V15 implementation is `tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js`, source SHA `37cc47ecf7cef0aa12abffb6fe3e1a527fd409c9`. The exact A2 normalization chain identified in that source is:

`buildPartition()` → `clipCellToLand()` → `normalizePhysicalBoundary()` → `repairPhysicalEdge()` → `resolvePhysicalGeometryBoundaryPoint()`.

The V15 physical authority adapter is `tools/historical-gis/recovery/physical-land-authority.mjs`, source SHA `c47238cee6ab6b9c522e11b5f1cd92ad0d5970a3`. Its relevant contracts are `isPhysicalLandPoint()`, `isLakeInteriorPoint()`, `nearestLakeBoundaryPoint()`, `resolvePhysicalGeometryBoundaryPoint()`, and `isPhysicalGeometryBoundaryPoint()`.

The V15 adapter wrapper is `tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15Adapter.js`, source SHA `dea20986189c2499fdee16184145763c22d3c958`. It delegates generation to the retained V15 engine and supplies the shared authority contract.

This resolution is **evidence registration only**. No canonical algorithm has been changed by this entry.

## Near-term execution order

1. Finish A1/A2/B/C root-cause proofs.
2. For A2, reproduce the exact producer of `~2.27e-13` before comparing repair behavior again.
3. Apply only the smallest proven migration change, candidate-side first where possible.
4. Re-run PA-05/PA-10/PA-11 and the full 1586-province shadow comparison.
5. Establish MW-02 authority consolidation as a controlled migration unit.
6. Establish MW-01 DEM source-adapter migration as a separate unit.
7. Reconcile GitHub/local refs only after the authoritative gate is green.
8. Build the final branch disposition matrix.

## MW-02 authority lineage

The central physical-land authority was introduced by commit `85fe793a4d0f4801c3805d78ebd211019566e979` (`refactor: centralize physical land authority`). It created `tools/historical-gis/recovery/physical-land-authority.mjs` and established `PHYSICAL_LAND_POLYGONS` as a single physical-land authority including coast corrections while excluding runtime lake interiors. This is migration lineage evidence, not permission to merge the whole historical branch. urlGitHub commit 85fe793ahttps://github.com/woispy/historia-ai/commit/85fe793a4d0f4801c3805d78ebd211019566e979

## Local/GitHub convergence rule

The target is not simply `local HEAD == origin HEAD` for one branch. The target is a reproducible repository state where:

- canonical production has one authoritative SHA,
- local tracking refs are known and current,
- active migration branches have explicit ownership and disposition,
- every integrated work item has provenance,
- CI proves the canonical gate,
- and no valuable historical work is silently lost.

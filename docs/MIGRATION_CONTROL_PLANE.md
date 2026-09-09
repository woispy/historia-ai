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

Only proven `INTEGRATE` work is moved toward the canonical line, in small, independently testable units.

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
| A2 | Pontus-Amisos | Raw canonical area is approximately `0.006755`, but V15 normalization collapses it to approximately `2.27e-13` | Edge-level transformation proof required; do not alter constants |
| B | 8 Nicomedia edges + 1 Nicaea edge | Cross-geometry recursive edge-repair divergence; deterministic max-depth behavior | Compare canonical edge, V15 raw edge, authority boundary, and first-invalid sample before extraction |
| C | Pontus-Amasya edge 3 | Authority semantic boundary case involving lake interior semantics | Complete endpoint decision matrix before authority migration |

### Evidence already established

- V15 raw Nicomedia/Nicaea normalization succeeds, so the nine current canonical max-depth failures are not proof that V15's raw pipeline itself fails on those edges.
- The nine cross-geometry failures show deterministic boundary-walk/creep behavior with repeated first-invalid sampling and bounded depth termination.
- The five A1 provinces are already below `MIN_AREA` before V15 normalization in canonical raw geometry.
- Amisos is materially above `MIN_AREA` before normalization and collapses during V15 normalization.
- Amasya edge 3 has a native V15 authority semantic mismatch: the endpoint is not accepted as physical land although its nearest land-boundary distance is zero, consistent with lake-interior semantics.
- These findings do not authorize changing `MIN_AREA`, `MAX_EDGE_REPAIR_DEPTH`, `RECOVERY_STEP`, or `MAX_RECOVERY_DISTANCE`.

## Near-term execution order

1. Finish A1/A2/B/C root-cause proofs.
2. Apply only the smallest proven migration change, candidate-side first where possible.
3. Re-run PA-05/PA-10/PA-11 and the full 1586-province shadow comparison.
4. Establish MW-02 authority consolidation as a controlled migration unit.
5. Establish MW-01 DEM source-adapter migration as a separate unit.
6. Reconcile GitHub/local refs only after the authoritative gate is green.
7. Build the final branch disposition matrix.

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

# Historia AI — 1326 Anchor Reconciliation Control

Status: **ACTIVE / forensic-to-production handoff**
Last reviewed: **2026-10-08 17:07 TRT**

Follow-up gate: **T3-B persisted review package / CI handoff**

## Scope

This document is the control ledger for the production-facing transition from the 1326 historical evidence registry to reviewed candidate political geometry.

It does **not** authorize canonical political geometry by itself.

The required promotion chain remains:

```
source
  -> evidence extraction
  -> temporal normalization
  -> entity reconciliation
  -> geometry reconciliation
  -> review ledger
  -> topology validation
  -> provenance / confidence
  -> canonical geography
```

## Current constitutional constraints

- Scenario target: `1326-04-07`.
- 1300 data remains legacy/reference material; it is not copied into 1326 production.
- `AnatoliaPhase2DGeometryBuilder` remains legacy/research/forensic tooling.
- No synthetic Voronoi, jitter, or fallback polygon may be promoted as historical authority.
- Political geometry and physical geography remain separate authorities.
- `MIN_AREA = 0.00005` remains unchanged.
- A2 historical `~2.27e-13` provenance chase is parked/non-blocking; no production mutation was made to reproduce it.
- `SAFE TO DELETE = 0`.
- Local convergence remains locked until the authoritative GIS acceptance gate is green.

## A2 disposition

The retained forensic record establishes:

- canonical producer Amisos area: approximately `0.0067547530500178254`;
- canonical raw stage: approximately `0.006755373858482017`;
- historical V15 normalization of the canonical raw polygon: approximately `0.006626536473277156`;
- pinned historical V15 producer result: `0.5023951571206453`;
- retained Run #26 replay: no tiny hit;
- historical fallback family exists, but the exact `2.27e-13` observation remains provenance-disconnected.

The dedicated clip-lineage workflow also completed successfully at head `d4b44274f7a201ac34c7458c220ee8281c7c063c`, but the currently queryable GitHub Actions run exposes zero retained artifacts. Therefore the execution is recorded as **successful execution evidence, artifact unavailable for current inspection**, not as a reproduced numeric result.

No production fix is authorized from that run.

## 2026-10-08 CI checkpoint

- Pinned Cliopatria acquisition is now independently verified in GitHub Actions at run `37787235151` before the workflow failed later.
- Immutable source reference: commit `ad28a69`.
- Expected source blob SHA: `cefab0f4b622e2e7fb3daf68d4f461f83991204c`; CI hash check passed.
- Acquired archive: 44,231,317 bytes; retained snapshot SHA-256: `d01ae3a20d358cc5d54f69d9d725d390767d9c8759ac89ad6f90c58d106f3370`.
- The first post-acquisition failure was not GIS/T3-B logic: the workflow attempted to publish `cliopatria-v0.2.0-production-snapshot` twice and GitHub Actions rejected the second upload with HTTP 409 artifact-name conflict.
- That duplicate upload was removed in commit `80d3f3ab6e0573c3ca8063e7917cbbd5c70b005d` on the existing T3-B branch. No new branch or PR was created.
- The T3-B candidate/review pipeline has therefore **not yet been declared GREEN** from this latest corrected workflow execution. Canonical promotion remains BLOCKED.
## 2026-10-08 T3-B pipeline contract correction

- Corrected the real CI failure in candidate screening: `screen-1326-political-candidate-surface.js` expected the legacy `{id, coordinates}` anchor shape, while the validated production research registry uses `{anchorId, geometry: Point}`.
- The screening tool now normalizes both explicitly supported shapes without modifying candidate geometry or synthesizing coordinates.
- The workflow now consumes `data/gis/1326/anchor-candidate-registry.json`, which is already protected by the anchor-candidate-registry validation contract.
- No historical boundary was inferred or promoted by this correction; the registry remains `research-candidate-registry`, anchor geometry confidence remains `NOT_ASSERTED`, and canonical promotion remains blocked.
- Corrected commit: `19066da39e0063ca6231df7b2451d04122f44141`; workflow binding update: `7d9ab702e5b87181096c8efbfd16e83246533160`.
- A new CI result for the corrected head is not yet queryable; therefore T3-B remains **OPEN / unverified**, not GREEN.
## Anchor / candidate handoff

### Evidence layer

The canonical 1326 source registry defines the following promotion boundary:

```
source
  -> evidence
  -> reconciliation
  -> topology
  -> provenance/confidence
  -> review
  -> canonical
```

The source registry explicitly states that no authoritative 1326 political runtime asset has yet been promoted.

### T3-A

T3-A models historical political/settlement anchors separately from geographic constraint anchors.

Political anchors may represent:

- urban/political centres;
- fortified centres;
- regional political nodes.

Constraint anchors may represent:

- rivers;
- lakes;
- mountains;
- passes;
- roads/corridors;
- coastlines.

An anchor's existence/controller confidence is independent from exact boundary confidence.

### T3-B

T3-B consumes reconciled anchor/evidence records and produces **candidate-only** political surfaces.

Candidate geometry is not canonical geometry.

The candidate surface must retain:

- candidate geometry identity;
- source feature identity;
- scenario/date applicability;
- provenance;
- confidence;
- reconciliation notes;
- review status;
- geometry version;
- physical-feature references where used.

## Geometry reconciliation gate

A candidate may enter review only when:

1. its entity identity is reconciled;
2. its temporal applicability is explicit;
3. its source provenance is complete;
4. its geometry is deterministic;
5. its physical constraints are represented as evidence rather than silently promoted to political authority;
6. its topology is valid for the declared coverage;
7. unresolved conflicts are explicitly recorded.

The review ledger must distinguish at minimum:

- `ACCEPT`
- `ACCEPT_WITH_UNCERTAINTY`
- `REVIEW_REQUIRED`
- `REJECT`
- `INSUFFICIENT_EVIDENCE`

## Current handoff state

| Layer | State |
|---|---|
| 1326 source registry | GREEN |
| Historical evidence registry | GREEN |
| T3-A anchor model | GREEN / research contract |
| T3-B deterministic evidence registry | GREEN / CI-proven |
| Candidate political surface | CANDIDATE ONLY |
| Geometry reconciliation review ledger | **OPEN** |
| Physical authority | PRESERVE / migration debt |
| Canonical political geometry | **BLOCKED** |
| 1586/1586 authoritative GIS gate | **NOT GREEN** |
| Local convergence | **LOCKED** |
| SAFE TO DELETE | **0** |

## Immediate next operation

The next production-facing task is not another global branch migration.

It is:

```
pinned source extraction
  -> candidate surfaces
  -> deterministic reconciliation queue
  -> persisted review ledger
  -> pilot review bindings
  -> topology validation
```

The first pilot should use a small, high-confidence 1326 anchor set and retain the complete provenance chain before scaling to the wider Tier-1 geography.

Only after the pilot ledger is persisted and independently validated may candidate geometry begin the reviewed-geometry transition.

## Migration rule

No branch is considered migrated because its code passes CI.

Required proof remains:

```
Provenance
  -> Equivalence
  -> CI
  -> Migration
  -> Canonical CI
```

Canonical production remains protected until that chain is complete.
## 2026-10-08 T3-B screening normalization fix

- Corrected commit: `b6fc796ef7bd25d89fdcc34d1fab2fcae03f0643`.
- The first CI attempt after the anchor-schema correction reached the real candidate pipeline, but failed because `normalizeAnchorReport()` correctly returned a normalized array while the caller still referenced `anchors.anchors`.
- This was a local implementation contract bug, not a historical-geography finding and not a source-data problem.
- The fix changes only the caller to consume the normalized anchor array directly. It does not alter anchor coordinates, candidate geometry, screening radius, authority status, or promotion policy.
- Corrected head `b6fc796ef7bd25d89fdcc34d1fab2fcae03f0643` is now running through both `Cliopatria v0.2.0 acquisition verification` and the main `Historia AI CI` chain.
- T3-B remains **OPEN / unverified** until the real candidate → reconciliation → review-ledger → pilot-readiness chain completes successfully and its persisted artifacts are inspected.


# Historia AI — 1326 Anchor Reconciliation Control

Status: **ACTIVE / forensic-to-production handoff**
Last reviewed: **2026-10-08 20:50 TRT**

Follow-up gate: **T3-B explicit review bindings / geometry adjudication handoff**

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
| Candidate political surface | CANDIDATE ONLY — 150 source candidates / 21 screened |
| Geometry reconciliation review queue | GREEN / CI-proven — 21 immutable pending items |
| Persisted geometry review ledger | GREEN / CI-proven — 21 pending records |
| T3-B pilot readiness | GREEN / CI-proven — waiting for explicit review bindings |
| Geometry reconciliation review/adjudication | **OPEN** |
| Physical authority | PRESERVE / migration debt |
| Canonical political geometry | **BLOCKED** |
| 1586/1586 authoritative GIS gate | **NOT GREEN** |
| Local convergence | **LOCKED** |
| SAFE TO DELETE | **0** |

## Immediate next operation

The next production-facing task is not another global branch migration.

The T3-B machine pipeline is now sealed. The next task is the **research-backed explicit review binding phase**:

```
21 pending review records
  -> select high-confidence pilot records
  -> bind each reviewId to explicit historical/edge evidence
  -> adjudicate reviewedGeometry externally/research-backed
  -> validate reviewed geometry + topology
  -> persist confidence/decision
  -> re-run canonical acceptance gates
```

The current real package contains 21 pending review records, but 0 explicit review bindings. Do not infer or synthesize bindings merely to make the gate green.

Only after reviewed geometry and topology/provenance acceptance are independently proven may canonical political geometry be promoted.

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
## 2026-10-08 main CI integration checkpoint

- Main `Historia AI CI` run **#3451 / 37819819056** completed **SUCCESS** on the T3-B branch after the source-register/reference update.
- The full validation chain remained green across physical geometry, historical GIS, topology, cartography/rendering, GPU province pack, runtime/game entry, build, repository cleanliness, and **15K+ province scalability/diagnostics**.
- This confirms the T3-B documentation/reference additions did not regress the wider production contract surface.
- The current branch remains a research/reconciliation workstream; canonical political geometry is still BLOCKED.

## 2026-10-08 T3-B persisted review-package checkpoint — GREEN

- Corrected production head: `ba3d21824dcd4af443da5f6ea569771cc1d9b502` on the existing `work/phase-a-1326-t3b-candidate-surface` branch / PR #109.
- Cliopatria v0.2.0 acquisition verification run **#141 / 37819558760** completed **SUCCESS**.
- Immutable source remains commit `ad28a69`, source blob SHA `cefab0f4b622e2e7fb3daf68d4f461f83991204c`; archive SHA-256 remains `d01ae3a20d358cc5d54f69d9d725d390767d9c8759ac89ad6f90c58d106f3370`.
- Real extraction: **13,765** input features → **150** temporal candidates; exclusions **13,608** outside range, **7** non-polity, **0** missing geometry. Candidate packet SHA-256 remains `c03d8d1e2cb4b280f6549a48b0602f8f44d6c856e7fa49b543fbb2f748779c24`.
- Entity reconciliation: **8** required entities, **2 matched**, **6 unmatched**, **0 ambiguous**. Matching remains candidate-only; no controller/geometry authority is inferred from names.
- Candidate screening: **21 screened**, **129 rejected**; source geometry remains immutable and promotion-blocked.
- Geometry reconciliation queue: **21 items**, **21 immutable source geometries**, **21 pending**, **2 entity-linked / 19 unmatched**. No reviewed geometry was generated.
- Persisted geometry review ledger: **21 records**, schema v2, review-ledger-only, promotion BLOCKED.
- Pilot edge-evidence preparation/validation passed; current real package has **0 explicit review bindings** and therefore remains waiting for human/research adjudication.
- T3-B pilot-readiness validator passed with status **WAITING_FOR_EXPLICIT_REVIEW_BINDINGS**; this is a successful safety state, not canonical promotion.
- All five T3-B contract tests passed: geometry reconciliation, review ledger, edge-evidence bindings, provenance lineage, and pilot readiness.
- Published artifact `historia-1326-t3b-review-package` is retained for 7 days (artifact ID **11568193231**, digest `sha256:50f2939b98f69c0ca776fa19a1fddaba9bfa32c3cb5fb3b897b9f9cd75a955d5`).
- **Interpretation:** T3-B pipeline integrity is now GREEN/CI-proven. This does **not** promote any Cliopatria polygon to canonical political geography. Canonical political geometry remains BLOCKED until explicit research-backed review bindings, reviewed geometry, topology validation, provenance/confidence adjudication, and the authoritative GIS acceptance gate are complete.

### Contract fixes sealed in this checkpoint

1. Candidate report now explicitly carries `promotion: BLOCKED`.
2. Reconciliation candidate records explicitly carry `autoPromotion: false`.
3. Geometry queue now binds to the immutable extraction candidate packet and keeps source-candidate hash separate from screened review-record hash.
4. Pilot readiness accepts intentionally unmatched screened candidates; only present reconciliation matches are identity-checked.
5. Geometry/provenance test fixtures now distinguish packet SHA, immutable source-candidate SHA, and screened review-record SHA.


## 2026-10-08 T3-B screening normalization fix

- Corrected commit: `b6fc796ef7bd25d89fdcc34d1fab2fcae03f0643`.
- The first CI attempt after the anchor-schema correction reached the real candidate pipeline, but failed because `normalizeAnchorReport()` correctly returned a normalized array while the caller still referenced `anchors.anchors`.
- This was a local implementation contract bug, not a historical-geography finding and not a source-data problem.
- The fix changes only the caller to consume the normalized anchor array directly. It does not alter anchor coordinates, candidate geometry, screening radius, authority status, or promotion policy.
- Corrected head `b6fc796ef7bd25d89fdcc34d1fab2fcae03f0643` is now running through both `Cliopatria v0.2.0 acquisition verification` and the main `Historia AI CI` chain.
- T3-B remains **OPEN / unverified** until the real candidate → reconciliation → review-ledger → pilot-readiness chain completes successfully and its persisted artifacts are inspected.



## 2026-10-08 EU5DB cartographic reference checkpoint

- EU5DB was reviewed as a **comparative map-architecture reference**, not as 1326 historical authority.
- The review confirms a distinct spatial hierarchy of **İl / Location → Vilayet / Province → Alan / Area → Bölge / Region → Alt Kıta → Kıta** and separate map modes for these levels. citeturn0search0turn0search1
- This distinction is useful for Historia AI's future cartographic/LOD design because local geography and province-scale aggregation can be rendered as different semantic levels.
- The new analysis is recorded in `docs/architecture/EU5DB-REFERENCE-MAP-ANALYSIS.md`.
- No EU5DB geometry, ownership, or 1337 political state is imported or promoted.
- The next production-facing work remains the existing T3-B explicit review-binding/adjudication gate; this reference work does not replace it.


## 2026-10-08 T3-B pilot selection checkpoint

- The retained review package was re-inspected from artifact **11568193231**.
- The real ledger contains **21** pending review records; **0** explicit bindings are currently present.
- A bounded pilot-selection document was added at `docs/architecture/1326-T3B-PILOT-REVIEW-SELECTION.md`.
- Initial pilot candidates are:
  - Ottoman Empire — reviewId `cliopatria-1326-feature-6204-760f7a0da05d42da`
  - Byzantine Empire — reviewId `cliopatria-1326-feature-6241-eb6b78911fe2e881`
  - Beylik of Menteshe — reviewId `cliopatria-1326-feature-6092-af809c314ff27761`
  - Beylik of Karasi — reviewId `cliopatria-1326-feature-6227-d74baf119f1e7fa5`
- Selection is research prioritization only. It does not create explicit review bindings, alter source geometry, or promote any candidate.
- Ottoman + Byzantine are intentionally paired first because the existing Bithynia evidence surface can test temporal boundary discipline around Bursa/Nicaea/Pelekanon/Nicomedia without projecting later events backward into 1326.
- Menteşe and Karasi provide non-Bithynian comparative beylik cases.
- Canonical political geometry remains **BLOCKED**.

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


## 2026-10-09 T3-B pilot evidence admissibility checkpoint

- Added `docs/architecture/1326-T3B-PILOT-EVIDENCE-ADMISSIBILITY.md` at commit `124aa541dfea4942a2f6aeb5980dc6c022355809`.
- The P1 Ottoman and Byzantine records were checked against the existing evidence matrix and Bithynia edge registry.
- The sources support date-specific context: Bursa surrendered on 1326-04-06; İznik was captured in 1331; İzmit was captured in 1337. These dates constrain scenario interpretation but do not define full political polygons.
- The Bursa–Nicaea frontier edge remains explicitly uncertain (confidence 0.25). River/road corridor and regional-proximity evidence are not political-boundary proof.
- Decision: do not create geometry-supporting review bindings from the current edge set alone. Keep `reviewBindings: []`, candidate geometry immutable, and promotion BLOCKED until the binding contract can preserve evidence roles or boundary-specific evidence is acquired.
- This is a research/evidence-quality checkpoint, not a geometry adjudication and not a new CI claim.
- Immediate next task: acquire/reconcile boundary-specific historical geography evidence for the Bithynia frontier; if the exact line remains unsupported, record `INSUFFICIENT_EVIDENCE` or `REVIEW_REQUIRED` rather than synthesizing geometry.


## 2026-10-09 TIB 13 source-acquisition checkpoint

- Added the Austrian Academy of Sciences' **Tabula Imperii Byzantini 13 — Bithynia and Hellespont** as a high-priority scholarly source lead in `docs/architecture/1326-source-register.md` (commit `fd80cbe0d1216e47a011c608f0f27270f0279bae`).
- Added the source-specific admissibility and extraction checklist to `docs/architecture/1326-T3B-PILOT-EVIDENCE-ADMISSIBILITY.md` (commit `dd862083ad97f3ed88a09c380a2145dbbb45bc4d`).
- Official TIB documentation describes regional coverage, settlements/toponyms, fortifications, roads/sea routes, and cartographic material for Bithynia/Hellespont. The FWF e-book record identifies the map resource as CC BY 4.0; attribution and asset-specific rights must be retained.
- Ruling: TIB 13 is **ACCEPTED as a source-acquisition lead**, not yet accepted as exact boundary evidence for 1326-04-07. It is a historical-geography synthesis across the Byzantine period, not a ready-made 1326 political polygon layer.
- Next operation: inspect the TIB 13 introductory sections and map/gazetteer references for Nikaia, Nikomedeia, Prusa, Sangarios/Sakarya and Lefke; record exact pages/maps, temporal scope, spatial scale and evidence role. Only source statements explicitly supporting a relevant dated frontier may be classified as boundary evidence.
- No review binding was added. `reviewBindings: []`, immutable candidate geometries, `SAFE TO DELETE = 0`, and canonical promotion **BLOCKED** remain unchanged.
- No CI result is claimed for these documentation commits.


## 2026-10-09 TIB 13 targeted page-map checkpoint

- Expanded `docs/architecture/1326-T3B-PILOT-EVIDENCE-ADMISSIBILITY.md` with a page-level reading plan from the published review of Klaus Belke's TIB 13 (commit `f3045151abc0a8e08236436637cc3c400e632e50`).
- Priority sections are: geographic scope/terminology pp. 97–102; geography pp. 103–110; historical and administrative development pp. 111–224; transport connections pp. 263–304; Nikaia pp. 802–830; Nikomedeia pp. 833–856; Prusa pp. 949–957; and the regional/detail maps in the end matter.
- The secondary review is used only as a navigation aid. The next evidence records must cite Belke's exact page/map, claim, date scope, scale and limitations; the review itself is not a substitute for the underlying source.
- A regional or period-coded settlement map is not automatically a political border map. No digitization, polygon reconstruction or review binding is authorized from this page map alone.
- Canonical promotion remains **BLOCKED**; immutable candidate geometries and the empty binding list remain unchanged. No CI claim is made for documentation-only commits.


## 2026-10-09 TIB 13 first-pass evidence ruling

- Checked the official TIB 13 overview and available indexed full-text excerpts against the current P1 Bithynia question.
- Official summary supports Bithynian regional context, key centres (Nikomedeia, Nikaia, Kyzikos), fortified-city references (including Prusa), and route/sea connectivity.
- The exact full-volume PDF could not be reliably opened for page-by-page extraction in this pass. The one indexed p. 150 excerpt concerns earlier Byzantine administrative history and does not establish a frontier on 1326-04-07.
- Classification: **CONTEXT-ONLY / INSUFFICIENT EVIDENCE** for the exact Ottoman–Byzantine boundary. No explicit dated frontier statement or map was verified.
- Keep the Ottoman/Byzantine review records pending, `reviewBindings: []`, immutable candidate geometry, and canonical promotion **BLOCKED**. Do not infer borders from settlements, fortifications, routes, metropolitan status, or regional cartography.
- Next: obtain the segmented/open-access volume and extract the exact scope/history sections and gazetteer entries with printed page/map, date, evidence class, scale and limitation. If no 1326-specific frontier evidence is present, close TIB 13 as contextual corroboration and continue the source search without synthetic geometry.
- No CI result is claimed for this documentation-only checkpoint.



## 2026-10-09 TIB 13 exact-page extraction

- Corrected the previous access note: the direct full-volume endpoint did not open, but the publisher-hosted segmented open-access edition is accessible. The historical/administrative chapter PDF was inspected at printed pp. 217–219 (PDF pages 106–108 of part 0x003b6739.pdf).
- TIB 13 p. 218 states Prusa was under a prolonged encirclement and food shortage and surrendered to Orhan on **6 April 1326**; it became the emerging Ottoman state's first capital. This is a date-specific **city-control event**, not proof of the full surrounding political polygon.
- The same page describes the 1321–1328 Byzantine civil war and a probable 1325 campaign in Bithynia and/or northern Hellespont, while noting that campaign details are not preserved. This is military context with spatial uncertainty.
- TIB 13 p. 219 records Nikaia under Ottoman siege in 1329 and its surrender on 2 March 1331; it also describes likely Byzantine administrative presence at Nikomedeia in 1329 and its land-side encirclement in 1331. These are later chronology constraints, not facts to back-project into the 1326 ownership state.
- The chapter explicitly notes a thin/uncertain record for Ottoman conquests before about 1320; no precise frontier is described for 1326-04-07.
- Updated disposition: TIB 13 now contributes **dated city-control and military/administrative context**, but still does not provide an exact coordinate-level frontier. Keep Bithynia exact-line status REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE, keep reviewBindings: [], preserve immutable candidates, and leave canonical promotion **BLOCKED**.
- Next: add the Prusa/Bursa date-specific event to the evidence matrix only if its current schema supports an event/anchor without implying polygon ownership; inspect existing Bursa record first to avoid duplication. Then continue source search for a dated frontier or sufficiently constrained boundary anchors. No CI result is claimed for this documentation update.



## 2026-10-09 TIB 13 evidence matrix update

- Added TIB 13 printed p. 218 as a second source for the existing Ottoman Beylik/Bursa city-control event in data/gis/1326/evidence-matrix.json; matrix commit: aaba343392aebbdcac3f0b0b10b72b1ef8689324.
- Kept the evidence record in the existing source/claim/dateScope/role shape. The claim explicitly limits its scope to city control and does not imply the surrounding polygon or Bursa–Nicaea frontier.
- No new polity, boundary edge, review binding, candidate geometry, or canonical authority was created. The evidence matrix remains evidence-only.
- CI is pending/running for the newest head and must be checked before claiming verification.



## 2026-10-09 TIB 13 Sangarios-corridor lead

- Inspected TIB 13 printed pp. 215–216 (PDF pages 104–105 in the publisher-hosted chapter part).
- The chapter attributes the 1304/05 Sangarios-valley conquest sequence to Ottoman chronicle tradition, distinguishes it from the Byzantine narrative, and cautions that the Ottoman account differs in details and includes legendary embellishment. Named places include Lefke/Leukai, Mekece/Makaǧā, Akhisar/Malagina and Geyve/Kabeia; place-identification and fortification chronology caveats remain.
- Disposition: source-critical historical-anchor lead only. Do not merge divergent traditions, assert continuous control through 1326, or turn the Sangarios corridor into a political border.
- Next: reconcile each toponym independently against the existing anchor candidate ledger and evidence schema; if the schema cannot represent source-critical claims without implying certainty, leave them in the research register.
- Exact 1326 frontier remains REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE. No geometry, binding, or authority change. No CI result is claimed for this documentation-only update.



## 2026-10-09 anchor-registry cross-check for TIB 13

- Cross-checked data/gis/1326/anchor-candidate-registry.json against the TIB 13 early Sangarios-corridor names: Lefke/Leukai, Mekece/Makaǧā, Geyve/Kabeia and Sangarios. No matching candidate is currently present in that registry.
- This is a **coverage gap**, not permission to create coordinates from an unreviewed place-name match. No new anchor was inserted because this pass has not independently reconciled modern/historical toponym identity, coordinate provenance, and scenario-date relevance for each place.
- Keep these names as source-research leads. The next safe step is entity/toponym reconciliation from existing project evidence and a second independent gazetteer/source; only then consider an anchor-candidate record with explicit confidence and provenance. Any anchor would remain non-boundary evidence.
- Geometry, review bindings, and canonical authority remain unchanged. No CI claim is made for this documentation checkpoint.


## 2026-10-09 Sangarios toponym reconciliation checkpoint

A focused reconciliation pass was recorded in `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md`.

- **Lefke/Leukai → Osmaneli:** provisional place match supported by the Bilecik Provincial Directorate of Culture and Tourism; a separate 2021 epigraphic paper is identified for follow-up. Exact coordinate/site provenance has not been extracted, so no anchor was added.
- **Geyve/Kabia-Kabeia:** local municipal history is a useful lead, but the underlying epigraphic publication/critical edition must be checked before treating the identification as independently verified.
- **Akhisar/Malagina:** Clive Foss's scholarly work provides a promising identification lead; exact site equivalence and coordinate provenance remain to be reconciled.
- **Mekece/Makaǧā:** unresolved; no independent place identification sufficient for registry inclusion was verified.
- **Sangarios/Sakarya:** physical/corridor constraint only, never a presumed political border.

**Disposition:** no changes to `data/gis/1326/anchor-candidate-registry.json`, immutable candidate geometry, or review bindings. The TIB 1304/05 campaign account remains source-critical retrospective evidence, not proof of continuous control on `1326-04-07`. Canonical political geometry remains BLOCKED and `SAFE TO DELETE = 0`.

**Next step:** inspect the full Öztürk (2021) Leukai/Lefke epigraphic study, verify the underlying Kabia inscription reference, reconcile Malagina against Foss/TIB's gazetteer, and find an independent Mekece identification. Add research-only anchors only after coordinate provenance is explicit; no frontier binding unless boundary-specific evidence is found.

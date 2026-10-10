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


## 2026-10-09 source verification addendum — Leukai and Kabia

A second source pass inspected the full Öztürk (2021) article and located Sencer Şahin's Ministry-hosted 1983 epigraphic/historical-geography survey.

- Öztürk (2021), printed pp. 2–3, explicitly equates Leukai/Lefke with modern Osmaneli and cites TIB 13's Leukai entry. This supports place identity and route context, not 1326 political ownership.
- Şahin's 1983 survey's indexed text reports Kabaia at the site of modern Geyve and connects the name with an inscription. Keep TIB's Kabeia and the forms Kabia/Kabaia source-specific until normalized through the original publications.
- Sakarya Metropolitan Municipality's historical-castles PDF summarizes Foss's identification of Malagina's fortress with Paşalar Kalesi and notes Mekece Kalesi as an earlier proposal. This is a genuine place-identification conflict to preserve, not a reason to merge Mekece and Malagina.

References and claim limits are documented in `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md`. No anchors, polygons, evidence-matrix records, or review bindings were added. **Next:** inspect the full Foss article and exact TIB gazetteer entries; keep Mekece/Makaǧā unresolved unless independent identification evidence closes the ambiguity.


## 2026-10-09 third-pass — Malagina/Metabole site distinction

A source comparison now separates three entities that earlier shorthand could blur:

- **Malagina:** the wider Sangarios plain/region, described by Foss (2022) as stretching broadly between Mekece and Lefke.
- **Metabole / the fortress in the Malagina region:** a specific fortified site; the consulted Sakarya University thesis favours Paşalar Castle over Mekece Castle as the more suitable identification, while documenting the history of competing proposals.
- **Mekece Castle:** a separate fort near the modern village; do not treat the castle as identical to the wider Malagina region or as proof that TIB's Mekece/Makaǧā toponym has been reconciled.

Foss's accessible 2022 excerpt associates the Ottoman-chronicle Akhisar with the Malagina/Metabole fortress context and says the Sangarios route was held by Orhan by 1324. This is useful dated regional chronology, but neither the campaign narrative nor a road corridor provides a coordinate-level political frontier for 1326-04-07. Foss (1990)'s full argument was not accessible in this pass; the abstract alone does not establish a registry-ready coordinate.

Reference note: `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md`; sources include Foss (1990), Foss (2022 indexed extract), Sakarya Metropolitan Municipality's *Sakarya Kaleleri*, and the Sakarya University thesis on northwestern Anatolian road networks.

**Disposition:** no anchor registry change, no geometry mutation, no review binding. Keep the frontier **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**. Next step: inspect the thesis bibliography and primary references, then acquire the complete Foss/TIB gazetteer passages and any coordinate-bearing archaeological record before considering a research-only point anchor.


## 2026-10-09 fourth pass — official Paşalar Castle record check

Checked the Sakarya Governorship's Paşalar Castle page and the Ministry of Culture and Tourism Culture Inventory entry.

- The Governorship says Paşalar Castle (Karaceyş Castle) is Byzantine and reports a 1314 conquest; it describes the castle as overlooking the Pamukova and Geyve plains.
- The Culture Inventory places the castle at Kale Tepe, north of Paşalar village in Pamukova/Sakarya, gives a broad 5th–6th century construction date and describes extant fortification remains. Its location section does not provide coordinates.
- Neither official page explicitly identifies Paşalar as Malagina/Metabole. That link remains a scholarly site-identification hypothesis; the 1314 local-history statement is not sufficient to assign control to the whole region or to draw a political polygon for 1326.

No anchor was added because a project-acceptable coordinate source is still missing and the identity/control roles must remain separate. No candidate geometry or review binding changed. See the source-specific analysis in `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md`.


## 2026-10-09 fifth-pass — TIB register / Malagina entity reconciliation

- Inspected the official Austrian Academy of Sciences TIB 13 online toponym register. It has separate entries for **Akhisar (Malagina)** (including printed p. 215), **Makaǧā** (also p. 215), **Malagina (region/place/theme)**, **Metabolē**, and **Leukai (2)**. These related entries do not independently establish that Makaǧā is modern Mekece or that a corridor is a political border.
- Checked the Sakarya University historical-roads thesis (T10915, printed p. 30 as indexed). It records Şahin's Mekece-based identification argument for the wider Malagina region, while judging Paşalar Castle more suitable as the specific Malagina/Metabole fortress based on historical topography and routes; it cites Foss and Şahin. This is a stronger comparative secondary source, but not a replacement for direct inspection of Foss (1990).
- Current source-critical distinction: **Malagina region ≠ Metabole fortress ≠ Mekece Castle ≠ TIB campaign Makaǧā (unresolved)**. Paşalar is the leading research hypothesis for the fortress, not yet a coordinate-verified anchor.
- Coordinate provenance remains below the project bar: no coordinates copied from community/web-index entries, and no project-grade coordinate pair has been verified from the official cultural inventory or the full scholarly site argument.
- No anchor registry, candidate geometry, evidence matrix, or review binding changed. reviewBindings remains empty, immutable candidates, SAFE TO DELETE = 0, local convergence locked, and canonical promotion **BLOCKED** remain unchanged.
- Next: inspect Foss (1990), pp. 163–164 and 170–171, against the TIB full-text entries for p. 215 and pp. 748–750; then seek institutional coordinate provenance. If evidence remains insufficient, retain the candidate-only status. No CI result is claimed by this documentation update.


## 2026-10-09 sixth-pass — Foss / TIB index source limits

- Re-inspected Cambridge Core's accessible Foss (1990) article record. The abstract says fieldwork enabled a more precise Malagina site identification and fortress description; its references explicitly state Foss's conclusions differ from S. Şahin's 1986 study. The full topographical argument remains inaccessible in the directly inspected record, so the abstract cannot validate the precise coordinate or all details attributed to Foss by later summaries.
- Cross-checked the official TIB 13 index. Separate entries exist for Akhisar (Malagina), Makaǧā, Mekece, Malagina (region/place/theme), Metabolē, and Leukai (2). Mekece and Makaǧā share some page references, including printed p. 215, but an index is not an identity assertion. TIB pp. 747–750 require full-text inspection before any equivalence is accepted.
- Current disposition: Paşalar remains a leading research hypothesis for the Metabole fortress; no project-grade coordinate provenance or directly verified full scholarly argument is in hand. Do not collapse Malagina region, Metabole fortress, Mekece Castle and the campaign form Makaǧā.
- No anchor registry, evidence matrix, candidate geometry or review binding changed. reviewBindings remains empty; immutable candidate geometry, SAFE TO DELETE = 0, convergence lock, and canonical promotion BLOCKED remain unchanged.
- Next: directly inspect Foss's full article (or a legitimate institutional copy), TIB pp. 215 and 747–750, and an official coordinate-bearing archaeological record. No CI result is claimed by this documentation update.


## 2026-10-09 seventh pass — live register verification

- Queried the live TIB 13 register entries directly. Akhisar (Malagina), Makaǧā, Mekece, Malagina (region/place/theme), and Metabolē are distinct index entries; Makaǧā and Mekece share some page references, including pp. 214–215 and 747–750. This is an index-level observation, not proof of identity.
- Clicked the TIB reader links for p. 215 and pp. 747–750; the browser extraction exposed no readable page text in this pass. Record this as an access/extraction limitation; do not claim that the page prose was verified.
- Cambridge Core's Foss (1990) extract confirms field investigation and a scholarly conclusion differing from Şahin (1986), but the article body remains gated. The bibliographic record describes the surviving Metabole fortress remains, but does not substitute for direct inspection of the topographical argument.
- A secondary indexed page exposes a Paşalar coordinate pair, but it is rejected as project-grade coordinate provenance because the official Culture Inventory lacks coordinates and the original survey/map basis was not directly checked. No coordinate copied to project data.
- No anchor registry, candidate geometry, evidence matrix or review binding changed. reviewBindings remains empty; immutable candidates, SAFE TO DELETE = 0, convergence lock and canonical promotion BLOCKED remain unchanged.
- Next: obtain readable TIB pp. 215 and 747–750, inspect Foss (1990) and its map directly, and find institutional coordinate metadata. No CI result is claimed by this documentation update.


## 2026-10-09 eighth-pass — TIB reader access and current PR gate

- Exact TIB 13 index entries were rechecked: Akhisar (Malagina), Makaǧā, Mekece, Malagina (region/place/theme), and Metabolē remain separate index entries. Makaǧā and Mekece share printed-page references, but shared references do not prove identity.
- Clicked the index links for printed p. 215 and pp. 747–750. They resolve to the TIB static reader, but browser extraction returned zero readable lines. Record this as a source-access limitation; do not claim the prose of those pages has been transcribed.
- The TIB project page explains that the index links into the digital volume; next task is to secure a readable full-text route and transcribe the relevant lemmas directly.
- Pre-documentation commit gate refresh: GitHub reported PR #109 mergeable=true, 523 commits ahead / 0 behind, and both Historia AI CI and Cliopatria v0.2.0 acquisition verification completed successfully for HEAD 35cffac6a0e905cff231d5ef4019f9edd7c1081d. This is not a CI claim for the new documentation commits that follow.
- No anchor, coordinate, evidence-matrix record, candidate geometry, or review binding changed. reviewBindings remains empty; immutable candidates, SAFE TO DELETE = 0, convergence lock and canonical promotion BLOCKED remain unchanged.
- Next: directly inspect TIB pp. 215 and 747–750, Foss (1990), and institutional coordinate provenance; then verify CI on the new HEAD. No new CI result is claimed in this document update.


## 2026-10-09 ninth-pass — Foss 2022 and official local-source cross-check

- A readable indexed extract attributed to Foss, *The Beginnings of the Ottoman Empire* (2022), pp. 67–69, distinguishes the Mekece tekfur from the Akhisar fortress attacked by Osman and associates the fortified Metabole site with Akhisar overlooking the Malagina plain. The readable extract is hosted on a third-party document platform; treat as a research lead and verify against a legitimate OUP/library copy before promotion. Official OUP chapter metadata confirms the source's existence and its source-critical reconciliation focus, not the full text of pp. 67–69.
- An official Sakarya provincial tourism master-plan PDF explicitly retains a location fork: Malagina is proposed as either Mekece or Paşalar/Paşalar Castle based on Byzantine and Ottoman sources. Official Pamukova District Governorate and Ministry Culture Inventory pages describe Paşalar Castle but do not equate it with Metabole and do not provide a coordinate pair.
- Entity ruling: Mekece settlement/tekfur and Akhisar fortress are distinct in Foss's account; Metabole↔Akhisar is a stronger scholarly association; Malagina plain/region remains a broader context; Paşalar=Metabole/Akhisar is still plausible but unproven; campaign Makaǧā remains unresolved.
- No anchor, coordinate, candidate geometry, evidence-matrix record or review binding changed. Immutable source geometry preserved; SAFE TO DELETE = 0; convergence locked; canonical promotion BLOCKED; frontier remains INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED.
- Next: inspect legitimate OUP/library copy and map context, compare it with the official tourism plan and Foss 1990, then obtain institutional coordinate metadata. No CI claim is made for the documentation update.


## 2026-10-10 T3-B entity alias reconciliation correction

The latest persisted real-source review package (Cliopatria v0.2.0, candidate packet SHA-256 `c03d8d1e2cb4b280f6549a48b0602f8f44d6c856e7fa49b543fbb2f748779c24`) exposed a deterministic naming gap in `reconcile-1326-cliopatria-entities.js`: the required canonical IDs `ottoman-beylik`, `karasi`, `saruhan`, and `aydin` did not include the exact upstream candidate labels `Ottoman Empire`, `Beylik of Karasi`, `Beylik of Saruhan`, and `Beylik of Aydin`. The normalization also discarded Turkish dotless `ı` rather than treating it as `i`.

The reconciliation alias list now includes those exact source labels, and normalization explicitly maps dotless `ı` to `i`. This is an identity-reconciliation correction only: matching remains candidate-only, auto-promotion remains false, and a name match still does not establish controller or geometry authority. No polygon, coordinate, review binding, or canonical record was changed. Eşrefoğulları and Alâiye remain unmatched until a source candidate with an admissible identity is found; they are not force-mapped to unrelated polities.

**Required verification:** fresh PR CI and Cliopatria acquisition workflow must confirm the new reconciliation output and downstream queue/ledger integrity. Until then the previous artifact counts are historical and must not be represented as post-fix counts. Canonical political geography remains **BLOCKED**; `SAFE TO DELETE = 0`; local convergence remains locked.


### T3-B alias-fix execution result — 2026-10-10 / acquisition workflow #194

The Cliopatria v0.2.0 acquisition workflow **#194** completed successfully on HEAD `2f0c74e8ee42ff60035cae67f24437423d88a54e`. Its persisted review-package artifact (`historia-1326-t3b-review-package`, artifact ID `11663983164`, SHA-256 `16cf06b02f38bc5c87c9527591b33485be9cf389d1081181c7766749dfd4d459`) was downloaded and inspected after the alias correction.

Verified reconciliation output:

- required entities: **8**;
- single-candidate matches: **6** — Ottoman Empire, Byzantine Empire, Ilkhanate, Beylik of Karasi, Beylik of Saruhan, Beylik of Aydin;
- unmatched: **2** — Eşrefoğulları and Alâiye;
- ambiguous: **0**;
- review queue: **21** records, **6** entity-linked and **15** unmatched;
- review ledger: **21/21 pending**, `reviewedGeometry = null` for every record;
- explicit `reviewBindings`: **0**;
- promotion: **BLOCKED**.

This is a verified reduction of a name-alias reconciliation gap, not a geometry or controller verdict. Eşrefoğulları and Alâiye do not have a matching record in this pinned 150-candidate packet under the accepted aliases; they remain unmatched rather than being attached to a geographically nearby or historically adjacent polity. The six candidate matches are identity links for review only and do not validate their polygons or political borders.

The main Historia AI CI #3503 was still running when this result was recorded. A behavior-level regression test has since been added for the six exact source labels and the two intentionally unmatched entities; the final HEAD must receive a fresh green CI and acquisition workflow before this checkpoint can be treated as fully verified on the branch.


## 2026-10-10 unmatched-entity research / latest artifact checkpoint

The current pinned-source run **Cliopatria acquisition verification #199** completed successfully for documentation/reconciliation HEAD `e7c6c63bae75833678c6f3bd46173a3c4c4d7b99`. Persisted review package artifact ID `11665088147`, SHA-256 `b741892cd9616bd2355e20dcb6db7c3c6cf6065cd5a48f74f13dd7cfbd61094a`, was downloaded and inspected.

Its output confirms the alias correction remains stable after the evidence-matrix/source-register updates: **8 required entities; 6 matched; 2 unmatched; 0 ambiguous; 21 review records; 21/21 pending; 0 explicit review bindings; promotion BLOCKED**. The two unmatched entities are Eşrefoğulları and Alâiye.

The source review distinguishes (a) Eşrefoğulları's supported existence on 1326-04-07 from its later territorial transfer after 9 October 1326, and (b) Alâiye's distinct locality/polity history from Karaman-affiliated local rulers and the unresolved exact scenario-date authority. Spatial screening shows bbox intersections with Cliopatria candidate features Karaman (6219), Teke (6221), and Hamid (6229), but bbox intersection plus year-level temporal intervals does not prove entity identity, exact containment, or April controller. No alias substitution is authorized.

- Cliopatria acquisition verification #199: **PASS**.
- Historia AI CI #3508 for this exact HEAD: **in progress at checkpoint time**; final green status is still required.
- Latest PR head remains open/draft, no merge performed.
- No anchor, coordinate, reviewed geometry, controller, or edge binding was promoted.
- `SAFE TO DELETE = 0`; local convergence remains locked; canonical political geography remains **BLOCKED**.

## 2026-10-10 — exact-HEAD T3-B verification checkpoint

PR #109 HEAD `554ac0bba1d9a44b68dcafcccc8fa0ba79cc0006` has now received both required workflow results:

- Historia AI CI **#3509 — PASS**: all 81 listed validation/build/scalability steps completed successfully.
- Cliopatria v0.2.0 acquisition verification **#200 — PASS**: immutable source acquisition, real T3-B candidate-to-review pipeline, persisted geometry-review ledger, explicit pilot edge-binding validation, provenance/pilot-readiness validation, contract tests, and artifact publication all completed successfully.
- PR #109 remains **OPEN / DRAFT / mergeable**; no merge was performed.

The exact-HEAD review-package artifact is published as `historia-1326-t3b-review-package`, artifact ID `11665278111`, size 262,628 bytes, GitHub SHA-256 digest `940b03809dde1d40161bc0f0a1d94e69cc791a135c0b908c0aba9928c65a137c`, created 2026-10-10 08:56:57 UTC and expiring 2026-10-17 08:56:56 UTC. The pinned production source snapshot is artifact ID `11665258199`, 44,232,585 bytes, digest `6d303e9854f8474641557f5654d4a9ca53c2624eb2d8facc932d8998cf0b2f00`.

Important audit limitation: artifact metadata and workflow steps were inspected in this checkpoint, but the newly published ZIP's internal JSON files were not re-extracted here. Therefore the prior 6/8 entity reconciliation and 21/21 pending-ledger figures remain the last content-inspected package figures, not a newly asserted #200 content audit. Use the exact-HEAD package as the next read-only evidence source before making any candidate/identity ruling.

Gate ruling unchanged: workflow PASS validates the pipeline, not the historical truth of candidate geometry. Do not create aliases for Eşrefoğulları or Alâiye, infer control from bbox intersections, or promote any reviewed geometry without independent evidence and explicit review. No anchor, coordinate, polygon, controller, or review binding was changed by this checkpoint. `reviewBindings = []` remains the last content-verified state; `SAFE TO DELETE = 0`; convergence locked; canonical political geography **BLOCKED**; frontier **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.

Next operation: inspect the #200 review-package contents, compare its manifests/ledger with the prior #199 package, and only then choose a candidate for evidence-backed adjudication. Do not merge PR #109.

### #200 review-package content audit — 2026-10-10

The newly published #200 package was downloaded and inspected. Artifact SHA-256 from GitHub metadata: `940b03809dde1d40161bc0f0a1d94e69cc791a135c0b908c0aba9928c65a137c`. The extracted manifests/ledger agree with the prior #199 content checkpoint:

- Input features **13,765**; temporal candidate packet **150**; excluded **13,608** outside the temporal range, **7** non-polity, **0** missing geometry.
- Spatial screen **21/150** retained for review and **129** rejected by the documented 120 km anchor-influence bounding-box screen. This is a research triage screen only.
- Required canonical entities **8**; single-candidate matches **6** (Ottoman Empire, Byzantine Empire, Ilkhanate, Beylik of Karasi, Beylik of Saruhan, Beylik of Aydin); unmatched **2** (Eşrefoğulları, Alâiye); ambiguous **0**.
- Review queue **21**; linked candidates **6**; unmatched candidates **15**; review ledger **21 records / 21 pending**.
- Each ledger decision remains `pending`; `reviewedGeometry = null`; topology gate `not-run`; explicit `reviewBindings = []`.
- Automatic review matching, geometry generation, controller inference, and canonical promotion remain disabled. Every matched candidate has `autoPromotion = false`.

The queue audit also confirms why the 21 candidates cannot be accepted based on the screening alone: some source polygons have very broad extents and produce many anchor hits (for example, the Mamluk Sultanate candidate hits anchors across Anatolia and the Levant). These hits derive from bbox screening, not exact polygon containment or evidence of political control. The screen must never be used as an implicit candidate-to-anchor binding.

This exact-HEAD artifact audit confirms the alias-fix behavior and the intended safety posture; it does **not** adjudicate a single polygon or edge. Eşrefoğulları and Alâiye remain unmatched, and no candidate should be force-bound to them. Next research unit should be a tightly scoped pilot with a source-backed historical entity plus a specific, independently supported edge claim; if no source supports an exact edge, record the gap and leave the review pending rather than manufacture a binding.

The previous subsection's note that #200 package internals had not yet been re-extracted is superseded by this audit. All geometry/promotion gates remain unchanged: `SAFE TO DELETE = 0`; convergence locked; canonical political geography **BLOCKED**.

## 2026-10-10 — exact-HEAD CI #3511 and T3-B #202 audit

Latest PR #109 head before this documentation checkpoint was `3eb200aed9e5c44d9cb7e5fa2ed8cd1f783c4ed7`. Both required workflows have now completed successfully on that exact SHA:

- Historia AI CI **#3511 — PASS**: full validate job passed, including lint, historical GIS, map/rendering, build, repository-cleanliness, and 15K+ province scalability gates.
- Cliopatria v0.2.0 acquisition verification **#202 — PASS**: real source acquisition, candidate/review pipeline, ledger validation, pilot edge-binding validation, provenance/readiness, contract tests and artifact publication passed.

Exact-HEAD artifact `historia-1326-t3b-review-package`: ID `11666780759`, 262,628 bytes, GitHub SHA-256 `832a90cf49d5019ae3956218c4c3986231710aa96425acf34f514f371dd5b70e`. The source snapshot artifact is ID `11666995441`, 44,232,585 bytes, digest `99b65830e3c139a62dcebd16ba2f96c5d0e2c1df04af00a6b5064944d94c66b4`.

### Package-level audit

The #202 package was downloaded and inspected, not inferred from workflow success:

- 13,765 source features; 150 temporal candidates; 21 candidates retained for review and 129 rejected by the documented 120 km bounding-box screen.
- Entity reconciliation: 8 required entities, 6 single-candidate matches, 2 unmatched (`esrefogullari`, `alaye`), 0 ambiguous.
- Queue: 21 review items, 6 entity-linked and 15 unmatched; ledger: 21/21 pending; `reviewedGeometry=null`; 0 edge assessments; topology `not-run`; `reviewBindings=[]`.
- All candidate records remain evidence-only; `autoPromotion=false`. The queue's anchor-hit counts range from 1 to 24, but these are bbox-screen hits, not exact polygon containment or political control. For example, Republic of Genoa has 23 hits and Byzantine Empire 20, demonstrating that spatial screening is intentionally broad.

### Pilot evidence audit — no binding authorized

`data/gis/1326/pilot-edge-evidence/bithynia-core-01.json` records the Bursa–Nicaea exact frontier as uncertain (confidence 0.25), regional proximity as supported (0.75), Nicaea–Sangarius corridor as supported (0.9), and other route/physical relationships separately. Its cited evidence keys point to internal inventory items (for example `inventory:1326-gecis-envanteri#17`), not to a direct source citation within the binding packet. The paired `bithynia-core-01.review-bindings.json` correctly remains `WAITING_FOR_REAL_CANDIDATE_ACQUISITION` with an empty binding list. The CI package's generated `edge-evidence-bindings.json` likewise contains zero bindings.

Therefore the pipeline's “pilot readiness” status is only a contract/readiness result, **not evidence that the Bursa–Nicaea edge has been historically adjudicated**. Before binding any review ID to an edge, the internal inventory references must be traced to inspectable underlying sources and the edge type must be kept precise: regional proximity, river/road corridor, and exact political frontier are distinct claims. Current evidence does not justify accepting the Bursa–Nicaea exact boundary.

No candidate polygon, anchor, coordinate, controller, or review binding changed. Eşrefoğulları and Alâiye remain unmatched; no forced alias. `SAFE TO DELETE = 0`; convergence locked; canonical political geography **BLOCKED**; frontier **INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED**.

Next operation: trace and audit the source records behind the Bithynia pilot's internal inventory references; replace internal-only citations with source-level provenance where possible. If the source only supports proximity/corridor rather than an exact frontier, preserve that limitation and keep the geometry review pending. Do not merge PR #109.

# Historia AI — 1326 T3-B Spatial Screening Audit

## Status

- Scenario: `1326-04-07`
- Branch: `work/phase-a-1326-t3b-candidate-surface`
- Pull request: [#109](https://github.com/woispy/historia-ai/pull/109)
- Audit date: 2026-10-22
- Screening implementation: actual Polygon/MultiPolygon intersection against anchor influence rectangles; geometry bbox is only a fast prefilter
- Canonical political geometry: **BLOCKED**
- Explicit review bindings: **0**
- Historical boundary claims inferred from this screening: **NONE**

This note records the latest CI artifact audit. It does not replace the source register, the anchor-authority research log, or the route-cost experiment contract.

## Verification record

- Commit: `b731c55351aa163d7c895461d9533f8295a64aad`
- Historia AI CI #3554: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39759128729)
- Cliopatria acquisition verification #245: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39759128785)
- Review artifact: `historia-1326-t3b-review-package`
- Artifact ID: `12417561474`
- Artifact ZIP SHA-256: `e59e1e4544b7cbe9d0d48ab101ce09b588ac2cfb83d7ef9dfc1f12c419c65dca`
- Retention: GitHub reported expiry at 2026-10-29 09:55:37 UTC.

The artifact was downloaded and inspected directly. The ZIP contains nine files. Relevant per-file SHA-256 values:

| File | SHA-256 |
|---|---|
| `cliopatria-candidate-surface-screening.json` | `b9cba97291d142d7bebeab0037876a8a7e7b77aa7669898a39e6b753b12a8df9` |
| `1326-geometry-reconciliation-queue.json` | `3531b15cbb4458a0484c16baaf8a3014677db0ef86d797c6f541b5634ebee525` |
| `1326-geometry-review-ledger.json` | `81c9e211bb48fbf5e25f6d06c9fc90fdaa370960921fbaa5012dbea1850d0450` |
| `edge-evidence-bindings.json` | `5d6643190d72ff508d509402acead38d97115982598849a26f8ac8d4158dab59` |
| `1326-geometry-review-ledger-edge-bridged.json` | `7e18299e717bbfee67de2ccb402538a8d297bd34c89ebc3a85a668382f2b4057` |

## Screening result

| Metric | Latest run |
|---|---:|
| Source candidates | 150 |
| Screened candidates | 18 |
| Rejected candidates | 132 |
| Geometry review queue records | 18 |
| Pending review ledger records | 18 |
| Entity-linked candidates | 6 |
| Unmatched candidates | 12 |
| Explicit bound reviews | 0 |
| Canonical promotion | BLOCKED |

The previous audited package contained 21 screened candidates. This run screened 18: the stricter geometric predicate rejected three candidates whose bboxes overlapped anchor influence windows but whose Polygon/MultiPolygon geometry did not intersect those windows. The current rejection ledger reports 129 outside-window candidates and 3 bbox-only false positives.

This is a screening-quality improvement, not a historical validation of the remaining 18 records.

## Remaining scope defect

The current spatial window is built from the full anchor report with a 120 km influence radius. It is not yet a Bithynia-only pilot scope gate. The resulting 18 candidates include entities/anchor hits across the Levant, Black Sea coast, western Anatolia, central/southern Anatolia, and the Nicaea–Bursa area. Examples include the Mamluk Sultanate, Empire of Trebizond, Menteshe, Genoa, Ilkhanate, Ottoman Empire, Saruhan, Karaman, Teke, Aydin, Karasi, Hamid, Byzantine Empire, Sinop, Germiyanids, Cilicia and Isfendiyar.

Consequently:
- queue membership does not mean a candidate is relevant to the Bithynia pilot edge;
- anchor-window intersection does not prove historical control, entity identity, boundary alignment, or source suitability;
- unmatched records must remain unresolved;
- no record may be bound to a pilot edge solely because it intersects a spatial influence window.

## Next gate: explicit regional scope

Before the next candidate review, add a declared and testable pilot-scope contract derived from the existing pilot-edge plan and source-backed anchor registry. The scope must identify its purpose and allowed anchor/edge IDs in versioned data/configuration rather than burying a guessed region in code. Tests must show that:
1. a valid in-scope polygon is screened;
2. a geometrically intersecting but out-of-scope candidate is rejected with an explicit scope reason;
3. bbox-only false positives remain rejected;
4. Polygon holes do not create false hits;
5. scenario-year mismatches are rejected;
6. MultiPolygon components are handled without accepting unrelated distant components;
7. source geometry and provenance hashes remain unchanged.

Do not choose the scope list from the current candidate output alone. First reconcile it against the pilot edge definitions and the documented 1326 source/evidence plan. If those sources do not define the scope, document that gap rather than inventing an allowlist.

## Authority and route-cost boundaries

- Keep `reviewedGeometry` null until a source-backed human review explicitly resolves a candidate.
- Keep review bindings empty until the evidence record supports a specific pilot edge.
- Keep canonical promotion blocked.
- Do not use this screening result to infer controller/ownership or to manufacture a political boundary.
- The separate Nicaea–Lefke–Sangarios DEM experiment remains `BLOCKED_ENDPOINT_PROVENANCE`; this audit does not resolve route endpoints or pin DEM tiles.

## Next operation

Inspect the existing machine-readable pilot edge definitions and their evidence bindings, establish the explicit Bithynia scope from those records, then implement the scope gate and regression fixtures. Re-run CI and inspect the new persisted artifact before any candidate is manually adjudicated.

## Pilot edge contract inspected after this audit

The machine-readable `data/gis/1326/pilot-edge-evidence/bithynia-core-01.json` defines seven evidence edges:

- `bursa-nicaea-frontier-1326` — uncertain frontier hypothesis, confidence 0.25;
- `bursa-nicaea-regional-proximity-1326` — regional relationship, confidence 0.75;
- `nicaea-sangarius-corridor-1326` — river/access corridor, confidence 0.9;
- `nicaea-sangarius-barrier-1326` — partial physical constraint, confidence 0.7;
- `nicaea-lefke-route-1326` — route/accessibility hypothesis, confidence 0.8;
- `nicomedia-nicaea-network-1326` — regional network, confidence 0.7;
- `nicomedia-nicaea-crossing-1326` — uncertain strategic-crossing hypothesis, confidence 0.35.

These edge records define research questions and evidence types; they do **not** define a closed regional polygon or a complete anchor allowlist. The companion `bithynia-core-01.review-bindings.json` currently has `reviewBindings: []` and status `WAITING_FOR_REAL_CANDIDATE_ACQUISITION`. The production artifact confirms that the pipeline has now acquired candidates, but it still has zero explicit review bindings.

The registry contains 32 evidence-only anchors. The confirmed records for Bursa, Nicaea, Bilecik and Söğüt are useful references, but choosing those four as the complete spatial scope would be an unsupported inference: the pilot also includes Nicomedia, Sangarios and a Lefke route hypothesis, while the route endpoint note explicitly says no source-backed Lefke/Sangarios endpoint is sealed in the registry. Therefore the scope gate must be built from an explicit reviewed scope record—not an improvised list derived from these names or from current candidate hits.

**Decision:** scope definition remains a separate blocking task. The current implementation and artifact are valid for global candidate screening, not yet for a Bithynia-only review shortlist.

## Explicit pilot-scope gate implementation — 2026-10-22

The screening CLI now supports an opt-in `--scope <path>` contract. When supplied, the scope must:
- use schema version 1 and scenario date `1326-04-07`;
- declare `status: "APPROVED"`, a pilot ID, edge IDs, and a non-empty unique `allowedAnchorIds` list;
- reference only anchor IDs present in the supplied anchor report.

The CLI fails closed when the scope is blocked, malformed, empty, or references missing anchors. In scoped mode, only explicitly allowed anchor influence windows can admit candidates; geometry intersecting only other anchors is rejected as `outside-explicit-pilot-scope`. The global screening behavior remains available when `--scope` is omitted, so this unresolved pilot decision does not silently change the established global acquisition pipeline.

A new machine-readable record is committed at `data/gis/1326/pilot-edge-evidence/bithynia-core-01.scope.json`. It deliberately has `status: "BLOCKED_SCOPE_DEFINITION"`, an empty allowlist, and unresolved references for Nicomedia, Sangarios, and the Lefke corridor. This is not an approved production scope and must not be passed as though it were one.

Regression coverage now exercises:
1. an approved test-only Bursa subset;
2. exclusion of a polygon intersecting only the Nicaea anchor when the explicit scope allows only Bursa;
3. the explicit `outside-explicit-pilot-scope` reason;
4. fail-closed behavior for a blocked scope;
5. the existing polygon-hole, year-range, and MultiPolygon cases.

The test-only approved scope is synthetic fixture data used to validate control flow, not a historical or production scope decision. The production Bithynia scope remains blocked pending source-backed scope review.

## Scope-gate verification artifact — 2026-10-22

- Verified HEAD: `56521ace8bd3c3316b608bf1400546236859e12f`
- Cliopatria acquisition verification #251: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39775490687)
- Historia AI CI #3560: pending at time of this update; full-repository result not yet confirmed.
- Persisted review package artifact ID: `12423239605`
- Artifact ZIP SHA-256: `5c184f928ddab7fe6de157765ceaf8797c54bc903ab4cfd11ed70af9886d85d6`
- Screening JSON SHA-256: `963529138c3c53715217f9571e5c5b577da7b281759bd65b0799d7350c320593`
- Reconciliation queue SHA-256: `3531b15cbb4458a0484c16baaf8a3014677db0ef86d797c6f541b5634ebee525`
- Review ledger SHA-256: `81c9e211bb48fbf5e25f6d06c9fc90fdaa370960921fbaa5012dbea1850d0450`

The artifact was downloaded and inspected after the scope-gate change. It still contains 150 source candidates, 18 screened candidates, 132 rejected candidates, 18 queue entries and 18 pending review-ledger records; 6 candidates are entity-linked, 12 remain unmatched, and explicit bound reviews remain zero. Rejections are 129 outside the global anchor screening windows and 3 bbox-only false positives. This is expected because the production Bithynia scope is deliberately blocked and the established acquisition workflow continues to run in global-screening mode.

The acquisition verification's T3-B contract-test step passed on this HEAD, including the new explicit-scope regression coverage. The full Historia AI CI result remains pending, so this is not yet a complete repository-wide green gate.

## Full repository gate confirmation — 2026-10-22

- Verified HEAD: `5c91f50052c11ec8049566092b3b397fe99b8473`
- Historia AI CI #3561: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39775633191)
- Cliopatria acquisition verification #252: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39775633332)
- Pull request #109 remains open and draft; latest GitHub metadata reports mergeable, but this is not an approval or a merge.

The full CI validate job completed successfully, including lint, map/terrain contracts, historical GIS and political runtime checks, topology and boundary solver contracts, P6.1/P6.2 telemetry and DEM contracts, 15K+ province scalability diagnostics, build, and repository-cleanliness checks. The dedicated acquisition verification also passed its T3-B screening/review pipeline and artifact publishing steps.

This closes the CI-verification gap for the current HEAD only. It does **not** approve the production Bithynia scope: `bithynia-core-01.scope.json` remains `BLOCKED_SCOPE_DEFINITION`, and `reviewBindings` remains empty. Next work must resolve the scope from source-backed anchor/physical-reference records or explicitly narrow the edge subset with documented justification; no candidate should be manually bound or promoted solely from spatial proximity.

## Nicomedia anchor research update — 2026-10-22

The anchor registry now includes `1326-nicomedia` as an **evidence-only candidate**, not as a sealed historical anchor.

- TDV İslâm Ansiklopedisi's [İzmit entry](https://islamansiklopedisi.org.tr/izmit#1) records the 1329 Pelekanon battle, an agreement in 1333, and the Ottoman capture of İzmit in 1337. This chronology supports excluding the later Ottoman capture from the 1326-04-07 scenario; it does not by itself establish a complete controller record for the scenario date.
- The Turkish Historical Society-hosted [İzmit historical overview](https://dunyasavasi.ttk.gov.tr/tr/turk-ermeni-kulliyati/vi-cilt-merkez-ve-tasrada-ermeniler/izmit-kazasinda-ermeni-yerlesiminin-baslangici-ve-ermeni-yerlesim-yerleri-oguz-polatel-490.html) independently identifies the city as Nicomedia in the Byzantine period and also dates the transition to Turkish rule to 1337.
- Modern city-point coordinates were recorded separately from GeoNames and Wikidata. Their reported points differ by roughly 2 km, so coordinate confidence is `MEDIUM`; this is a city anchor, not a historical boundary or a coastline/terrain geometry.
- Registry authority remains `candidate-evidence-only`; controller and geometry are explicitly `NOT_ASSERTED`.

This narrows one missing reference but does not close the pilot scope gate. The unresolved edge contract still needs a human-approved anchor/edge subset, while Sangarios and the Lefke route corridor still require explicit physical-reference provenance. Do not infer historical ownership or route cost from this new city point.

## Lefke / Osmaneli evidence update — 2026-10-22

The anchor registry also now includes `1326-lefke-osmaneli` as an **evidence-only settlement candidate**.

- The TDV İslâm Ansiklopedisi [Anadolu entry](https://cdn2.islamansiklopedisi.org.tr/dosya/3/C03015526.pdf) states that Lefke (Osmaneli), Akhisar, Geyve and Gölpazarı had been incorporated into Ottoman territory before Bursa's conquest in 1326. This supports the place's pre-scenario historical relevance.
- Halim Demiryürek's [Lefke/Osmaneli study](https://dergipark.org.tr/tr/pub/sinopusd/article/1358434) corroborates the historical/modern toponym link and reports the official name change to Osmaneli in 1914.
- GeoNames, Wikidata and Getty TGN provide modern city-point references. The coordinate records differ by about 1 km, so confidence remains `MEDIUM`; none identifies the exact endpoint of the hypothesized Nicaea–Lefke–Sangarios route.
- The new record's authority is `candidate-evidence-only`; it does not assert controller, route geometry, or a political boundary.

**Scope consequence:** the two missing settlement references (Nicomedia and Lefke/Osmaneli) now have evidence-only candidate records, but the production pilot remains blocked. The Sangarios river segment and the exact `lefke_sangarius_corridor` route endpoint still lack a versioned, source-backed physical-reference record, and no reviewer-approved edge subset has been recorded.

## Verification boundary after evidence-only registry additions

- Latest branch HEAD: `927147277a3004792de48e05cffccb95c67e6571`
- Cliopatria acquisition verification #254: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39785206807) on the preceding registry revision `22f71c9a0468590db7a0cb6834115ee473dbcc78`.
- Historia AI CI #3563 was cancelled while a newer commit was pushed. The workflow lookup returned no CI run for the latest evidence-only registry revision, so full CI is **not claimed for current HEAD**.
- Earlier full CI #3561 passed on `5c91f50052c11ec8049566092b3b397fe99b8473`; it predates these two registry additions.

Next verification must run the registry contract and full gate chain against the latest branch head before these records are treated as validated inputs. Canonical promotion and review bindings remain blocked.


## Latest full-gate confirmation — 2026-10-22 (supersedes prior verification snapshot)

- Verified branch HEAD: `01742889ef9f461ef70d28aa3eabf8a61ec4f64e`
- Historia AI CI #3568: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39833368380)
- Cliopatria acquisition verification #259: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39833368309)
- Pull request [#109](https://github.com/woispy/historia-ai/pull/109) remains open, draft, and unmerged.

The full validate job passed on this HEAD, including lint, world physical-geometry generation, generated-asset cleanliness checks, historical GIS generation/validation, river and physical-geography tests, topology and boundary-solver contracts, P6.1/P6.2 telemetry and DEM contracts, production build, and 15K+ province scalability diagnostics. The dedicated Cliopatria acquisition verification also passed its T3-B candidate-to-review pipeline, provenance checks, contract tests, and artifact publication.

This supersedes the older verification snapshot above. The successful gates validate the repository and acquisition pipeline, not historical control or boundary claims. Nicomedia and Lefke/Osmaneli remain evidence-only candidates; the production scope is still `BLOCKED_SCOPE_DEFINITION`, review bindings remain empty, and canonical political geometry remains **BLOCKED**.

### Next blocking work: physical-reference intake

The repository pins Natural Earth Vector source revision `ca96624a56bd078437bca8184e78163e5039ad19`. The physical atlas builder derives canonical river identity `sakarya` from the pinned 10m river/lake centerline data and exports WGS84 coordinates. The checked-in source contract explicitly marks the river adapter as non-authoritative; therefore this source can identify a generalized physical river trace but cannot establish a 1326 political boundary or prove a specific medieval road.

The next data task is to extract the Sakarya/Sangarios line geometry reproducibly from that pinned source into a versioned physical-reference record. Record source revision, source layer/feature identity, CRS, coordinate provenance, extraction method, geometry hash, and uncertainty. Do not invent a coordinate range or endpoint before extraction. Treat the Lefke route endpoint as unresolved unless a source explicitly supports it; a modern settlement point is not a route endpoint.

Keep `bithynia-core-01.scope.json` blocked until the chosen edge subset, required anchor/physical references, and human approval are recorded. Do not populate review bindings or promote candidate geometry based only on spatial proximity.

## Latest CI + physical-source extraction audit — 2026-10-22 (supersedes prior verification snapshot)

- Verified branch HEAD: `e8c1b473b6f90fd165bd150afa02bfc24c9e9e6f`
- Historia AI CI #3569: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39841574706)
- Cliopatria acquisition verification #260: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39841574931)
- Pull request [#109](https://github.com/woispy/historia-ai/pull/109) remains open, draft, unmerged; GitHub currently reports mergeable.
- Cliopatria review-package artifact ID: `12453546282`, SHA-256 `8692a97e3295ec47c4306ad3c648459f8b5ced3bd29ca7fc05bf2dca6ba2bb2a`.
- Cliopatria production-snapshot artifact ID: `12454135236`, SHA-256 `c4e084e3a49a0b8883af21b6b361b2efe2033a4595ca0c5f157c875b6ea5ad81`.

The complete 81-step Historia AI validate job passed, including physical-geometry generation and clean-tree checks, historical GIS generation/validation, river and physical-geography regressions, topology/boundary-solver contracts, P6.1/P6.2, build, and 15K+ province scalability diagnostics. The acquisition verification and both artifact-publishing steps also passed. These are pipeline gates only; they do not establish historical ownership, medieval route geometry, or political boundaries.

### Extraction implementation findings

The checked-in builder `tools/asset-builder/cli/build-anatolia-hydrography-10m.js` reads four pinned inputs under `src/world/map/source/physical`:
- `ne_10m_lakes_europe.geojson`
- `ne_10m_lakes.geojson`
- `ne_10m_rivers_europe.geojson`
- `ne_10m_rivers_lake_centerlines.geojson`

It clips river linework to the Anatolia atlas bbox, removes exact duplicate clipped geometry, and assigns canonical identity `sakarya` by normalized name/alias matching. Output coordinates are `EPSG:4326`. The runtime segment IDs are generated from source-layer name plus feature-array index, segment index, and clipped-piece index; they are **not** stable source feature identifiers. Therefore a source intake record must not treat a generated runtime ID as a durable Natural Earth feature ID.

For a reproducible physical-reference record, the extraction step must retain the pinned source revision (`ca96624a56bd078437bca8184e78163e5039ad19`), source layer and original feature properties, source feature geometry hash, extracted line geometry hash, clipping/selection method, CRS, and any segment selection rule. If the upstream feature has no durable feature identifier, explicitly record that limitation and use a source-revision-scoped feature locator plus content hash rather than inventing an ID. Preserve the full selected Sakarya linework or document a deterministic, evidence-based segment selection; do not select a segment by guessed endpoint proximity.

The current CI artifacts do not publish the generated hydrography JSON as a standalone file, so this verification confirms the builder contract and successful generation but does **not** itself supply an independently inspected Sakarya coordinate list. No physical-reference geometry has been promoted by this update.

### Decision and next gate

The physical-reference intake remains open. Next, make a deterministic extraction path that operates on the pinned Natural Earth source and emits a small reviewable record plus provenance manifest; validate feature selection and both hashes in a regression test. Inspect the extracted coordinates and feature metadata before committing them. Until then, `sangarius` and `lefke_sangarius_corridor` remain unresolved, `bithynia-core-01.scope.json` remains `BLOCKED_SCOPE_DEFINITION`, review bindings remain empty, and canonical political geometry remains **BLOCKED**.

## Reproducible Sakarya intake extractor added — 2026-10-22

- Extractor: `tools/historical-gis/cli/extract-sakarya-physical-reference.js`
- Pinned Natural Earth revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source layer: `ne_10m_rivers_lake_centerlines`
- Expected output: `data/gis/1326/physical-reference-intake/sakarya-source-candidates.json`
- Default command after the repository's asset fetch step has populated the pinned source:
  `node tools/historical-gis/cli/extract-sakarya-physical-reference.js`

The extractor reads the pinned source GeoJSON, selects all features whose supported name properties normalize to a Sakarya match, retains each original geometry and source properties, and writes SHA-256 digests for the source file, each geometry, and each complete feature payload. It preserves source geometry without clipping and records source revision, layer, feature index, any source-provided ID, and the fact that a feature index is revision-scoped when no durable source ID exists. It intentionally does not choose a river segment by proximity to a guessed endpoint.

This is an extraction mechanism, not a completed evidence intake: the output has **not** been generated or inspected in this environment because the pinned source file is not present in the available working checkout. No coordinates, candidate count, or geometry hash are claimed here. After the source is fetched in a repository checkout, run the extractor, inspect every candidate's names/geometry, and only then decide whether to retain a source-backed physical-reference record. If multiple Sakarya matches are present, keep them as candidates until the source structure and geographic coverage justify a reviewed selection.

The extractor does not assert that Natural Earth reproduces the exact medieval Sangarios course. The production scope remains `BLOCKED_SCOPE_DEFINITION`; no review binding or canonical geometry promotion is authorized by this code addition.

## Sakarya source candidate extracted and persisted — 2026-10-23

The CI run on commit `e4670c066848efe9cf13837b5f44e0b37590cb5b` completed successfully:
- Historia AI CI #3574: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39858239164)
- Cliopatria acquisition verification #265: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39858239241)
- Sakarya intake artifact: [workflow artifact](https://github.com/woispy/historia-ai/actions/runs/39858239164), artifact ID `12459779293`, ZIP SHA-256 `1ee01f7e219300b6832e5eb99fe90af89cfc13a35639a080f1ae113698eceb02`.

The intake artifact was downloaded and inspected. The pinned source yielded **one** Sakarya name candidate:
- Layer: `ne_10m_rivers_lake_centerlines`
- Revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source feature locator: array index `1077`; no durable source feature ID is present.
- Source properties: `name=Sakarya`, `name_en=Sakarya`, `rivernum=741`, `featurecla=River`.
- Geometry: `MultiLineString`, WGS84 / `EPSG:4326`, 112 coordinate pairs, one line component.
- Observed WGS84 bbox: `[29.44752, 40.038275, 30.6456, 41.132921]`.
- First coordinate: `[29.534597, 40.038275]`; last coordinate: `[30.6456, 41.132921]`.
- Source file SHA-256: `9ae6e735f9d96cab4804339755ea1c694f7bddfc21bf391db64dafcc32edb17a`.
- Geometry SHA-256: `b668b2b2ba510837cc6a33fa7eeadef90916977ba5bba05b089724eef7a1e4c3`.
- Feature payload SHA-256: `9c746f05d4f4afe51a2c03fd6a3d32e0a81e443f8f4ad7e2b359215803e899bd`.

A durable metadata record is now committed at `data/gis/1326/physical-reference-intake/sakarya-source-candidate.json`. It records the pinned source locator, source properties, hashes, geometry bounds, coordinate count, extraction method, artifact digest, and evidence limitations. The full candidate geometry remains reproducible from the pinned source using `tools/historical-gis/cli/extract-sakarya-physical-reference.js`; the CI artifact retains the complete extracted geometry for inspection.

### Extraction precision correction

Review of the first artifact exposed duplicate matched labels because both `name` and `name_en` contain “Sakarya”. The extractor now deduplicates matched labels and uses exact normalized equality rather than substring matching. The CI contract also checks the pinned revision/layer, expected feature index and source properties, the unique label, geometry type/CRS, hash formats, and every coordinate's WGS84 bounds. This prevents a changed upstream feature selection from silently passing as the same source candidate.

The above geometry metrics and hashes are from the inspected artifact produced before this exact-match hardening; the geometry itself is unchanged by label deduplication. The newer exact-match contract and persisted manifest are awaiting their own CI result as of this documentation update.

### Interpretation boundary

This is a source-backed, generalized modern river trace—not proof of the exact 1326 Sangarios course, a medieval road endpoint, a political frontier, or ownership. The modern coordinate extent is recorded only to identify the extracted source geometry; it must not be used to invent a Lefke route endpoint. The candidate is evidence-only and still requires human review before edge binding.

Production status remains:
- `bithynia-core-01.scope.json`: `BLOCKED_SCOPE_DEFINITION`
- Explicit review bindings: `0`
- Canonical political geometry: **BLOCKED**
- `lefke_sangarius_corridor`: unresolved pending independent endpoint provenance.

## Hardened Sakarya extraction verification — 2026-10-23

- Extraction contract verified on commit `4f25d9546ac4dc239032ac4d3a615f921a4147d2`.
- Historia AI CI #3578: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39871061577).
- Cliopatria acquisition verification #269: [SUCCESS](https://github.com/woispy/historia-ai/actions/runs/39871061559).
- Hardened extraction artifact ID: `12466233836`; ZIP SHA-256: `a90b57ccfc452e64dc3c02d551c1ac8f0c19253ee6ecd9dafb7f56a0412c09f9`.

The exact normalized name match, expected source locator, source properties, geometry type/CRS, hash formats and WGS84 coordinate bounds passed. The durable metadata record has been updated to point to this hardened artifact instead of the earlier pre-hardening artifact. That metadata pointer update and this review-note update are newer than the cited successful CI run; the CI chain must be considered pending for the resulting new HEAD until it completes.

The extracted candidate remains the pinned Natural Earth source feature at array index `1077`, with no durable upstream feature ID. The geometry is a generalized modern river trace, not an exact reconstruction of the 1326 Sangarios course. The recorded bounds and endpoints identify the source line only; they do not establish a medieval route endpoint or political boundary.

**Next gate:** compare the trace with independent historical and physical-geography evidence, then document whether it is suitable as evidence for the Sangarios corridor and/or barrier hypotheses. No edge binding is automatic. The Lefke route endpoint remains unresolved, `bithynia-core-01.scope.json` remains `BLOCKED_SCOPE_DEFINITION`, review bindings remain empty, and canonical political geometry remains **BLOCKED**.


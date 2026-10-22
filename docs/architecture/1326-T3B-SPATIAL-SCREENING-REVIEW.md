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

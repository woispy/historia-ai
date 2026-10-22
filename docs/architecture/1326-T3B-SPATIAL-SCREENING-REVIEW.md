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

# Phase 2.8-C Root-Cause Forensic Status

Date: 2026-09-16

## Scope

This document records forensic evidence only. It does not change canonical production geometry, physical authority, thresholds, or runtime behavior.

Canonical production baseline: `6b7424125eee4a1c72925b7a1780c68e695e9ba3`.

## B4 prerequisite

B4 calibrated the retained V15 `powerCell()` against the exact canonical full political seed universe. Canonical political sites: 1683; total captured sites: 5633. For both `bithynia-nicomedia` and `bithynia-nicaea`, V15 `powerCell()` with the exact canonical sites and zero weights was exactly equivalent to the canonical cell (zero area delta and zero vertex-distance delta). B4 also found seven of ten tested endpoints where canonical physical-land classification differed from the shared V15 physical authority. This separates seed/power-cell behavior from physical-authority behavior.

## A1 — native micro-polygons

Historical ledger claim: Smyrna, Ayasuluk, Pecin, Halikarnassos, and Sinop are five native canonical polygons below `MIN_AREA = 0.00005`.

A new non-asserting closure probe was run against the exact canonical baseline with raw-cell capture before the canonical `MIN_AREA` gate. It found the first captured raw cells for those five IDs had areas:

- `lydia-smyrna`: `0.015204060409701015`
- `ionia-ayasuluk`: `0.12999794966981426`
- `caria-pecin`: `0.042641344741127796`
- `caria-halikarnassos`: `0.010764618232315115`
- `pontus-sinop`: `0.8710592075024124`

All are above `MIN_AREA`.

**Forensic conclusion:** the historical A1 statement is not reproduced by the current canonical full-site generation at the named province IDs. The A1 record is therefore stale or refers to another transformation/stage/fixture. No `MIN_AREA` change is authorized. A1 remains a provenance-isolation task, not a production geometry-fix task.

## A2 — Amisos

Existing producer-lineage evidence establishes canonical raw Amisos at approximately `0.006755` and shows that direct canonical-raw → V15 normalization does not collapse it: the earlier calibrated trace produced approximately `0.0066265` after normalization (ratio approximately `0.981`). The V15 `buildPartition()` trace likewise produced approximately `0.5023951571` for both partition-raw and partition-normalized Amisos before an independent Amasya failure.

The new closure probe independently captured a canonical raw Amisos cell from the current full-site build at `0.5783361031461709`; direct V15 normalization rejected that particular raw cell rather than producing the historical `~2.27e-13` value. This demonstrates that the current full-site capture is not the same historical raw representation used by the earlier `0.006755` trace and must not be conflated with it.

**Forensic conclusion:** `~2.27e-13` is not attributable to direct V15 normalization on the already-established canonical `0.006755` raw artifact. The exact producer of the tiny value remains unidentified and must be traced to its historical artifact/fixture/version/stage. No algorithmic mutation is authorized.

## C — Amasya / lake semantics

The shared physical authority explicitly separates lake interior from final physical land:

- `isLakeInteriorPoint()` identifies lake interiors.
- `isPhysicalLandPoint()` excludes lake interiors.
- `isPhysicalGeometryBoundaryPoint()` permits lake-interior semantics for geometry-boundary recovery.
- `isFinalPhysicalGeometryBoundaryPoint()` requires final physical land.

The closure probe tested a runtime lake interior and observed exactly this semantic matrix: lake interior `true`, physical land `false`, geometry boundary `true`, final physical boundary `false`.

**Forensic conclusion:** the authority contract is internally non-circular and the lake-interior/final-land distinction is intentional. C's remaining task is not to redesign the authority semantics; it is to bind the known Amasya failure edge to this contract and prove the endpoint/repair decision matrix without changing authority behavior.

## Status matrix

| Class | Current forensic status | Production mutation |
|---|---|---|
| A1 | Historical claim not reproduced at named IDs; provenance/stage isolation still required | None |
| A2 | Historical tiny-area collapse disproven for direct normalization; exact producer still unidentified | None |
| B | B4 calibrated and complete | None |
| C | Authority semantics proven; Amasya edge binding still required | None |

## Non-negotiable locks

- `MIN_AREA` remains `0.00005`.
- No assertion relaxation.
- No canonical geometry mutation.
- No physical-authority mutation.
- No local synchronization.
- `SAFE TO DELETE = 0`.

## Next forensic action

Resolve A1 historical artifact lineage and A2 exact `~2.27e-13` producer in parallel with a targeted C Amasya edge replay. Only after those evidence chains are complete may any surgical migration unit be proposed.

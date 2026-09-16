# Phase 2.8-C — Edge-3 Authority Equivalence

## Purpose

Freeze the evidence boundary between the production-equivalent C3 replay and the candidate physical authority before any MW-02 migration.

## Proven replay

- Source replay: `tools/tests/phase2d-v15-c-c3-amasya-edge3-replay.mjs`
- Replay commit: `09aeeabe4dd8c4be7984c8d24efccbdf267922bd`
- Edge start: `[34.828390856782086, 41.01264370368176]`
- Edge end: `[35.31959064327484, 41.25286549707603]`
- Intervals: `256`
- Samples: `257`
- Expected lake-interior samples: `9`
- Expected shoreline recoveries: `9`
- Expected unresolved/invalid after recovery: `0`

## Authority semantics

A lake interior is not physical land. A recovered lake boundary is eligible only when it resolves to an authoritative lake shoreline. Final physical boundary eligibility is therefore restricted to `LAND` and `LAKE_BOUNDARY`; `LAKE_INTERIOR`, `WATER`, and `UNKNOWN` remain rejected final classes.

## Equivalence gate

The migration candidate is GREEN only when the real replay output, the authority classification, and the recovery output agree on all of the following:

1. sample count and exact Edge-3 endpoints;
2. lake-interior classification count;
3. shoreline-recovery count;
4. unresolved/invalid count;
5. final-boundary eligibility for every recovered point;
6. canonical-vs-candidate authority divergence, explicitly reported rather than silently normalized.

A historical mismatch is a blocker. The replay is evidence, not political authority, and this document does not authorize canonical geometry mutation.

## Migration order

`Provenance → Equivalence → CI → Surgical migration → Canonical CI → 1586/1586 GREEN`.

Until the equivalence gate is independently reproduced in CI, MW-02 remains candidate-only, canonical production geometry remains locked, and `SAFE TO DELETE = 0`.

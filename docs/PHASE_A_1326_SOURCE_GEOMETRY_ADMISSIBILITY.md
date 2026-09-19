# Phase A — 1326 Source-to-Geometry Admissibility Matrix

## Purpose

This matrix makes the Tier-1 evidence boundary explicit and machine-verifiable. It separates evidence that can support a boundary-evidence candidate, control-point candidate, or temporal/extent constraint from material that is context-only or prohibited for geometry.

The matrix is evidence-only. It does not create polygons, authorize reconstruction by itself, mutate the canonical MapBin, or change the SAFE TO DELETE = 0 lock.

## Classification

- **boundary-evidence-candidate** — may inform later boundary reconstruction, but only with retained artifact, provenance, temporal interpretation, rights review where applicable, and an explicit reconstruction method.
- **control-point-candidate** — may support map georeferencing after a documented visible-map correspondence is established. It is never an automatic polygon vertex.
- **temporal-extent-constraint** — constrains chronology or regional extent; it cannot directly define a polygon.
- **context-only** — useful for research/discovery/cross-checking, but not geometry authority.
- **prohibited-for-geometry** — material or interpretation that must not enter geometry reconstruction.

## Current Tier-1 outcome

### Eşrefoğulları

The current evidence supports historical existence and several regional/chronological constraints. The Alperen (2001) reproduced map and the approximately 1330 Wikimedia map can serve as cross-check evidence, but neither is exact to 1326-04-07. TDV's dated account constrains the scenario by placing the territorial division after 9 October 1326.

No current record supplies an immutable, date-exact 1326 boundary artifact. Therefore no Eşrefoğulları polygon is generated.

### Alâiye

The current evidence supports historical existence, southern Anatolian placement, and dated political/monetary context. The approximately 1330 map is a near-scenario cross-check only. The 1321/1326/1329 coin evidence and 1333 account are temporal context, not a boundary artifact.

No current record supplies an immutable, date-exact 1326 boundary artifact. Therefore no Alâiye polygon is generated.

## Hard gates

1. A temporal match is not entity identity.
2. Entity identity is not political control.
3. Political control is not province geometry.
4. A named place is not a boundary vertex.
5. Georeference success is not political-boundary verification.
6. A near-scenario map is not a 1326 relabelling target.
7. No undocumented tracing or synthetic/fallback geometry is admissible.
8. Canonical promotion remains blocked until boundary review, physical-land validation, and topology validation pass.

The machine-readable matrix is data/gis/1326/tier1-source-geometry-admissibility-matrix.json.

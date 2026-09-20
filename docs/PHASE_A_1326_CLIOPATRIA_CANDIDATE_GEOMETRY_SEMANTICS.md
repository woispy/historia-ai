# Phase A — 1326 Cliopatria Candidate Geometry Semantics Review

Date: 2026-09-20
Scenario: **1326-04-07**
Status: **source semantics documented; candidate geometry remains blocked**

## Scope

This review evaluates what a retained Cliopatria polygon means before any physical-land or topology validation is allowed.

## Source-level geometry semantics

Cliopatria documents that each row represents an entity for a range of years and contains a polygon geometry in EPSG:4326, an area value calculated in EPSG:6933, a Type value such as POLITY, FromYear and ToYear applicability, and associated entity identifiers.

For a target year, the source rule is to select a row whose interval contains that year.

Cliopatria also states that its maps represent one version of the territory held by past polities, and that border uncertainties and differing historical opinions about names, territorial changes and polity durations are common. It places responsibility on users to assess suitability for their own purposes.

Therefore: **Temporal applicability of a row does not by itself establish exact historical boundary authority.**

## Historia AI interpretation

For 1326-04-07, the existing extractor applies `FromYear <= 1326 <= ToYear` and preserves the source polygon unchanged.

The extractor deliberately records `geometryAuthorityStatus = candidate-evidence-only`. This is the correct state for the current forensic gate.

The following semantics remain unresolved until the actual candidate feature is reviewed:

1. whether the polygon represents effective control, nominal extent, maximal extent, or another source convention;
2. whether the polygon is intended as a precise boundary or a generalized historical depiction;
3. whether the source feature's temporal interval is sufficiently specific for the exact scenario date;
4. whether the Q12560 identity is semantically equivalent to Historia AI's `ottoman-beylik`;
5. whether the polygon's edges are compatible with the project's physical-land authority;
6. whether the polygon topology is valid for canonical ingestion.

## Important distinction

The Cliopatria dataset is valuable **candidate evidence**, not automatic canonical authority.

The source's own documentation explicitly acknowledges uncertainty in historical borders. Consequently, a successful temporal filter must not be interpreted as proof that the resulting polygon is an exact 1326 boundary.

This preserves the existing project rule:

> temporal match ≠ entity identity ≠ political control ≠ province geometry ≠ canonical authority.

## Current Ottoman gate

- source: `cliopatria-v0.2.0`;
- source entity: `Q12560`;
- source label: `Ottoman Empire`;
- project entity: `ottoman-beylik`;
- temporal interval: `1326–1332`;
- scenario date: `1326-04-07`;
- geometry state: `candidate`;
- geometry generation: `forbidden`;
- promotion: `BLOCKED`.

The separate Q12560 semantic review has already established that the source identity must not be silently renamed to `ottoman-beylik`.

## Validation order

1. Entity semantics — resolve Q12560 → project entity relationship.
2. Geometry semantics — document what the candidate polygon claims to represent.
3. Source geometry integrity — verify Polygon/MultiPolygon structure, CRS, coordinates and source retention.
4. Physical-land validation — compare against the existing physical-land authority without changing that authority.
5. Topology validation — validate rings, overlaps, containment and required dataset invariants.
6. Reviewed candidate staging — attach provenance, source hash, review decision and validation reports.
7. Canonical promotion — only after all required gates are GREEN.

## Explicit prohibitions

- No 1300 → 1326 relabeling.
- No 1400 → 1326 relabeling.
- No synthetic polygon generation.
- No undocumented coordinate editing.
- No snapping or repair to make a candidate pass.
- No canonical MapBin mutation.
- No `authorityStatus: canonical` from temporal matching alone.
- `SAFE TO DELETE = 0`.

## Current conclusion

The source-level geometry contract is now explicit: **Cliopatria provides temporally indexed historical polygon candidates, while acknowledging historical border uncertainty.**

This closes the source-semantics documentation step but does **not** close the geometry authority gate.

## Next executable step

Obtain and inspect the exact retained Q12560 candidate feature from the acquisition evidence, preserving its original geometry and source identity. The inspection should produce a provenance/geometry-integrity record before any physical-land or topology calculation is attempted.

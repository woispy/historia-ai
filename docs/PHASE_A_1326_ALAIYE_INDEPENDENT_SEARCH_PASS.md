# Phase A — 1326 Alâiye Independent Source Search Pass

Date: 2026-09-20
Scenario: **1326-04-07**
Status: **no date-specific machine-readable boundary artifact located; geometry remains blocked**

## Search objective

A fresh independent source pass was performed specifically for an Alâiye/Alanya boundary representation that could satisfy the Historia AI 1326 geometry gate.

The search targeted exact/near-date 1326 Alâiye cartography, Alâiye Beyliği boundary maps, historical political maps covering the early 14th century, and academic/institutional material that could identify a traceable map plate or digital geometry.

## Findings

### Historical context sources

TDV's *Alâiye Beyliği* confirms that Alâiye/Alanya was under Karamanid-affiliated beys after 1293 and remained a relevant polity across the 14th century. This supports the scenario-date historical context but contains no machine-readable 1326 boundary.

A Turkish-language educational source also places Alâiye Beyleri in Alanya from 1293 onward and describes their Mamluk relationship. This is secondary historical context, not boundary geometry.

### Cartographic search

The fresh search returned general Anatolian beylik maps and historical regional material, but no newly identified artifact that simultaneously satisfies:

1. exact or explicitly applicable date around 1326-04-07;
2. identifiable Alâiye political boundary;
3. retained digital artifact or reproducible machine-readable payload;
4. traceable provenance;
5. geometry semantics sufficient to distinguish political control from generalized/maximal extent.

The search therefore does **not** close the Alâiye geometry gate.

### Important distinction

A source describing Alâiye's existence, location, ruler, monetary authority or political affiliation is not equivalent to a boundary source.

Likewise:

- a 1300 map cannot become a 1326 map;
- an approximately-1330 map cannot silently become an exact 1326 map;
- a later Ottoman Alâiye map cannot become a medieval political boundary;
- a city-centre coordinate cannot become a polity polygon;
- a rendered historical map cannot be converted into production geometry without a documented reconstruction/provenance chain.

## Current Alâiye evidence state

| Evidence class | State |
| --- | --- |
| Historical existence at scenario date | **Supported** |
| Regional location | **Supported** |
| Political/control context | **Supported** |
| Exact 1326 boundary artifact | **Not located** |
| Machine-readable polygon | **Not acquired** |
| Raw artifact SHA-256 | **None** |
| Georeference proof | **Not started** |
| Physical-land validation | **Blocked** |
| Topology validation | **Blocked** |
| Canonical promotion | **Blocked** |

## Decision

This search pass is closed as another **negative machine-readable acquisition result**.

The absence of a newly located artifact is not evidence that Alâiye lacked a boundary. It means only that the current publicly traceable source set has not produced an admissible geometry artifact for the 1326 scenario.

The existing `tier1-cartographic-artifact-ledger.json`, `tier1-boundary-evidence-matrix.json`, `tier1-source-geometry-admissibility-matrix.json`, and `tier1-geometry-adapter-registry.json` remain authoritative for staging classification.

No polygon or coordinate is added by this pass.

## Next admissible source class

The next search should prioritize an actual retained map artifact or a documented historical reconstruction with explicit geometry provenance.

For Eşrefoğulları, the strongest currently indexed cartographic observation remains the Alperen-attributed map reproduced on printed p.211 of the 2017 paper; the original 2001 map page remains unresolved.

For Alâiye, the search remains at the **source-artifact acquisition** stage.

## Locks

- SAFE TO DELETE = 0
- no synthetic geometry;
- no 1300/1330/1400 relabeling;
- no undocumented tracing;
- no canonical MapBin mutation;
- promotion remains **BLOCKED**.

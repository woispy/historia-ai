# Phase A — 1326 Geometry Acquisition & Review

Status: **geometry authority remains BLOCKED; candidate/research sources identified, no polygon promoted**

Scenario date: **1326-04-07**

## Purpose

This note begins the geometry stage after the Tier-1 historical existence/control gap was closed.

It deliberately separates:

```
historical existence/control evidence
    ≠ cartographic evidence
    ≠ machine-readable geometry
    ≠ reviewed 1326 boundary
    ≠ canonical authority
```

No source listed below is treated as canonical geometry.

## Current Tier-1 geometry state

| Entity | 1326 identity/evidence | Cliopatria geometry | Current geometry action |
| --- | --- | --- | --- |
| Ottoman Beylik | Cross-polity Q12560 manual review | Candidate exists | Review candidate geometry against date/entity semantics |
| Eşrefoğulları | Historical existence supported | **Source gap** | Acquire independent geometry evidence |
| Alâiye | Historical existence supported | **Source gap** | Acquire independent geometry evidence |

The repository evidence matrix already marks all three as `geometryStatus: pending-source-acquisition`.

## Eşrefoğulları — candidate evidence

Independent research located a published historical map specifically depicting the Eşrefoğulları territorial extent:

- Beyşehir-focused academic study reproduces **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** and describes it as an approximate representation of the beylik's widest extent.
- The same study describes Beyşehir as the beylik centre and discusses its territorial/political context.
- A Wikimedia Commons reproduction identifies a dedicated Eşrefoğulları location map and its license as **CC BY-SA 2.5**.

These are useful **cartographic research candidates**, but they are not yet machine-readable 1326 geometry. In particular, an image showing the widest extent must not be silently converted into a precise 7 April 1326 polygon.

### Eşrefoğulları review rule

The next admissible step is to obtain the underlying cartographic source or a traceable digital representation, record provenance/license, and compare its temporal claim with the scenario date.

The October 1326 termination event remains a temporal boundary: later territorial changes cannot be projected backward into 7 April 1326.

## Alâiye — candidate evidence

Research located several geographically useful references:

- Euratlas Periodis includes **Alaiye** as a dated historical polity in its 1300 map material and places it in the wider Anatolian political context.
- The Turkish Historical Society catalogue contains a historical cartographic item titled **Alâiye**, at 1:400,000 scale, but it is an Ottoman-era 1915/16 map. It is therefore a geographic/cartographic reference, **not a 1326 political-boundary source**.
- Alanya's university GIS service provides modern/historical-site GIS layers for Alanya, but these concern local physical/historical structures rather than the 1326 beylik boundary.

### Alâiye review rule

None of these sources is sufficient by itself to create a 1326 political polygon.

The 1915/16 map can help with place-name/topographic reconciliation only. Modern Alanya GIS can provide coordinate/place anchors only. A 1326 boundary must come from date-appropriate historical evidence or a reviewed reconstruction whose assumptions are explicitly recorded.

## Euratlas handling

Euratlas is useful as a **historical political context cross-check**, not as an automatic source of province geometry.

Its 1300 material explicitly identifies both Eshref and Alaiye and provides map-level political context. That is valuable for regional reconciliation, but the project scenario is **1326-04-07**, so a 1300 map cannot be copied, relabeled, or promoted as a 1326 boundary.

## AtlasPI / historical-basemaps forensic result — 2026-09-19

The requested inspection of AtlasPI's raw/processed data and boundary-ingestion path is complete.

### AtlasPI raw/processed state

AtlasPI tracks `data/raw/historical-basemaps/` snapshots including `world_1300.geojson`, `world_1500.geojson`, `world_1700.geojson`, `world_1800.geojson`, and `world_1900.geojson`. There is no tracked `world_1326.geojson`.

AtlasPI's tracked `data/processed/` directory is empty apart from `.gitkeep`, so it does not contain a hidden second boundary dataset that would independently solve the 1326 gap.

AtlasPI's `src/ingestion/extract_boundaries.py` explicitly maps pre-1800 entities to aourednik/historical-basemaps snapshots. `src/ingestion/aourednik_match.py` applies name/variant matching and uses upstream `BORDERPRECISION` to influence confidence.

### Upstream snapshot coverage

The upstream `aourednik/historical-basemaps/index.json` was scanned across all timestamped snapshots for the target-name family.

Relevant results:

| Snapshot | Target labels found |
| --- | --- |
| 1279 | Byzantine Empire, Ilkhanate |
| 1300 | Byzantine Empire, Ilkhanate |
| **1326** | **No snapshot exists** |
| 1400 | Beylik of Aydin, Byzantine Empire, Ottoman Empire |
| 1492–1914 | Ottoman Empire |
| 1920 | Ottoman Sultanate |

Direct inspection of `world_1300.geojson` found 237 features. The only target-family polygons there are:

- `Ilkhanate` — `BORDERPRECISION=1`
- `Byzantine Empire` — `BORDERPRECISION=1`

There is no Ottoman, Eşrefoğulları, Alâiye, Karesi, Saruhan or Aydın polygon in that 1300 snapshot under the inspected labels.

The 1400 index does contain `Beylik of Aydin` and `Ottoman Empire`, but it is **74 years after the target date** and therefore cannot be relabelled as a 1326 boundary.

### Consequence for Historia AI

AtlasPI is now classified as:

**structured provenance/reference layer — NOT a direct 1326 geometry authority.**

Its upstream lineage is:

```
AtlasPI
  ↓
aourednik/historical-basemaps
  ↓
timestamped world_YYYY snapshot
  ↓
academic/approximate historical boundary
```

The upstream repository itself describes these maps as work in progress and instructs users to verify them against other sources before academic use. It also records WGS 84 / EPSG:4326 and exposes `BORDERPRECISION` to distinguish approximate from more precise boundaries.

This is directly compatible with the Historia AI rule that historical cartography must remain candidate evidence until temporal, entity, physical and topology review is complete.

### Generated-boundary exclusion

AtlasPI also contains a separate `approximate_generated` enrichment path that can construct a polygon from capital coordinates when no real polygon exists. This is explicitly marked as computational approximation.

That path is **forensically excluded** from Historia AI authority.

No capital-radius polygon, generated shape, jitter, Voronoi cell, or other synthetic filler may close the current geometry gap.

## Source classification

| Source/evidence | Role | 1326 geometry authority |
| --- | --- | --- |
| Cliopatria v0.2.0 | Candidate political-entity geometry | Candidate only |
| Eşrefoğulları map reproduced in Beyşehir study | Cartographic research evidence | Not yet |
| Wikimedia Commons Eşrefoğulları map | Secondary cartographic reproduction | Not yet |
| Euratlas 1300 | Historical political context | No |
| TTK Alâiye 1915/16 map | Geographic/cartographic reference | No |
| Alanya university GIS | Modern/local historical-site GIS | No |
| AtlasPI | Structured historical-geography/reference layer | No |
| aourednik/historical-basemaps 1300 | Upstream historical reference | No |
| aourednik/historical-basemaps 1400 | Later-period reference | No |

## Required geometry review record

Before any candidate can approach canonical promotion, record at minimum:

1. source identity and immutable reference;
2. license/provenance;
3. original map/data date and stated historical period;
4. scenario applicability to **1326-04-07**;
5. entity identity and aliases;
6. geometry format and CRS;
7. raw bytes/hash where a digital artifact exists;
8. whether the source depicts maximum extent, effective control, nominal suzerainty, administrative boundary, or another concept;
9. coastline/physical-land validation result;
10. topology validation result;
11. reviewer decision and confidence;
12. unresolved assumptions.

## Promotion locks

The following remain unchanged:

- no 1300 → 1326 copy/relabel;
- no synthetic Voronoi/jitter/anchor/filler authority;
- no generated capital-radius geometry as authority;
- no image-to-polygon conversion without traceable provenance and review;
- no candidate source promoted directly to canonical;
- `SAFE TO DELETE = 0`;
- `MIN_AREA = 0.00005`;
- canonical political-geography authority remains unchanged.

## Next executable gate

AtlasPI has now completed its useful role for this sub-stage: it established the upstream provenance chain and a **negative 1326-coverage result**.

The immediate work item is therefore:

**Acquire or identify traceable machine-readable geometry for Eşrefoğulları and Alâiye from an independent date-appropriate source, while separately reviewing the Cliopatria Ottoman candidate under the cross-polity rule.**

After candidate geometry is available:

```
source provenance
    ↓
scenario/entity reconciliation
    ↓
geometry inspection
    ↓
physical-land/coastline validation
    ↓
topology validation
    ↓
reviewed candidate
    ↓
canonical promotion review
```

No production geometry mutation is authorized by this document.

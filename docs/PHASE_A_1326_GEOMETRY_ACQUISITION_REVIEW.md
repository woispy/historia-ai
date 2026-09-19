# Phase A — 1326 Geometry Acquisition & Review

Status: **production integration can begin in staging; canonical geometry promotion remains BLOCKED until Tier-1 boundary evidence is complete**

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

## Production transition decision — 2026-09-19

The available evidence is now sufficient to begin the **production-side integration/staging work**: source manifests, candidate provenance, entity identities, temporal semantics, review records and fail-closed publication machinery can be wired into the production pipeline without changing canonical geometry.

This is intentionally **not** the same as declaring the 1326 political polygons authoritative.

The production transition is therefore split into two tracks:

1. **Production integration track — OPEN:** build/validate the reviewed-source contract, ingestion adapters, provenance manifests, candidate geometry staging and validation reports.
2. **Canonical geometry promotion track — BLOCKED:** Eşrefoğulları and Alâiye still lack an acquired, traceable 1326 machine-readable boundary artifact; the Ottoman Q12560 cross-polity mapping still requires explicit review.

This lets implementation proceed now without manufacturing missing historical geometry.


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
- An official Derbent district history page records the beylik's wider territorial claims and identifies the polity as ending after Süleyman Şah's killing; this is supporting historical/cartographic context, not a machine-readable boundary.

These are useful **cartographic research candidates**, but they are not yet machine-readable 1326 geometry. In particular, an image showing the widest extent must not be silently converted into a precise 7 April 1326 polygon.

### Eşrefoğulları review rule

The next admissible step is to obtain the underlying cartographic source or a traceable digital representation, record provenance/license, and compare its temporal claim with the scenario date.

The October 1326 termination event remains a temporal boundary: later territorial changes cannot be projected backward into 7 April 1326.

## Alâiye — candidate evidence

Research located several geographically useful references:

- Euratlas Periodis includes **Alaiye** as a dated historical polity in its 1300 map material and places it in the wider Anatolian political context.
- The Turkish Historical Society catalogue contains a historical cartographic item titled **Alâiye**, at 1:400,000 scale, but it is an Ottoman-era 1915/16 map. It is therefore a geographic/cartographic reference, **not a 1326 political-boundary source**.
- Alanya's university GIS service provides modern/historical-site GIS layers for Alanya, but these concern local physical/historical structures rather than the 1326 beylik boundary.
- A Salt Research item titled **Alanya (Alâiye)** provides an open-access digitized historical map, but its cartographic date/context is modern relative to the scenario and its rights statement restricts transformation. It is therefore a place/topography reference only, not a 1326 boundary artifact.

### Alâiye review rule

None of these sources is sufficient by itself to create a 1326 political polygon.

The 1915/16 and Salt Research maps can help with place-name/topographic reconciliation only. Modern Alanya GIS can provide coordinate/place anchors only. A 1326 boundary must come from date-appropriate historical evidence or a reviewed reconstruction whose assumptions are explicitly recorded.

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

## Phersu Atlas — independent candidate-source probe — 2026-09-19

A new independent historical-geography candidate was evaluated: **Phersu Atlas**.

The public Western Asia catalogue explicitly lists both **Eshrefids** and **Alaiye** under Anatolian Beyliks. The public Alaiye data page identifies Alaiye as a polity with a recorded span of **1294–1493** and exposes maps of political control over time, including maximal extension and territory-by-year views.

This is materially different from the AtlasPI result: Phersu has explicit polity-level temporal data for the two current source-gap entities.

However, this does **not** yet close the geometry gate.

### Why Phersu is a candidate, not an acquired geometry source

The public pages expose rendered/interactive maps and historical territorial data, but the currently accessible public material does not provide a directly downloadable, immutable GeoJSON/Shapefile payload for the **1326-04-07** geometry.

The public site also describes its map system as a historical atlas with daily-resolution data, while access to the complete historical atlas/API is subscription/API-key controlled. Therefore:

- no geometry bytes have been acquired;
- no raw SHA-256 can be claimed;
- no CRS/coordinate payload has been independently captured;
- no boundary vertex set has been imported;
- no polygon has been promoted.

Phersu is therefore recorded as a **high-value external candidate/reference source**, not as canonical authority.

### Temporal relevance

The Alaiye public record spans 1294–1493, which covers the Historia AI scenario date **1326-04-07**. The Phersu Western Asia catalogue also places Alaiye and Eshrefids within the Anatolian Beyliks group.

For Eshrefids, Phersu's public chronology material records the polity as an Anatolian frontier principality and separately records a termination/change event in 1327. This is temporally relevant to the scenario, but the exact historical end date and territorial reconstruction must remain subject to source reconciliation; Phersu is not allowed to override the project's independent historical evidence.

### Required next action

Do **not** convert a rendered Phersu map image into a polygon.

Instead, investigate whether a traceable machine-readable export can be obtained under an explicit public/API-access path and, if so, capture:

1. exact polity identifier;
2. exact scenario date or nearest supported date;
3. geometry payload;
4. CRS;
5. source/provenance metadata;
6. licensing/usage terms;
7. raw artifact SHA-256;
8. temporal/control semantics;
9. geometry precision/uncertainty;
10. reproducible acquisition command or endpoint.

If machine-readable access cannot be obtained without relying on a rendered image or an unverifiable extraction, Phersu remains a **reference-only source** and the geometry gate continues to the next independent source.

### Current classification

| Source | Entity coverage | Temporal relevance | Machine-readable geometry acquired | Authority |
| --- | --- | --- | --- | --- |
| Phersu Atlas | Eshrefids + Alaiye | Yes; Alaiye span covers 1326 | **No** | Candidate/reference only |

### Phersu machine-readable export probe — result

A targeted public-web probe was performed for an explicit Phersu API/GeoJSON export path. The accessible public results expose polity-level data and interactive territorial maps, but no public, immutable 1326 GeoJSON/Shapefile payload was identified.

The probe did establish a useful distinction:

- Phersu has a dedicated **Alaiye** polity record spanning **1294–1493** and exposes political-control maps over time. citeturn0search0turn0search4
- The Western Asia catalogue explicitly includes **Eshrefids**, **Ottoman Beylik**, and **Alaiye** among Anatolian Beyliks. citeturn0search12
- Phersu's chronology records Eshrefids as an Anatolian frontier principality and separately records a 1327 termination/change event in its chronology. citeturn0search11turn0search13

These findings strengthen temporal/entity provenance but still do not supply a traceable geometry artifact. Therefore the Phersu acquisition attempt is now **closed as a negative machine-readable acquisition result** for this sub-stage.

No image extraction, screen scraping, raster tracing, or synthetic reconstruction is authorized as a substitute.


## Additional cartographic probe — Eşrefoğulları digital map candidates — 2026-09-19

A second-pass search located two useful but non-authoritative digital map representations:

- Scribble Maps hosts a map titled **“Eşrefoğulları en geniş sınırlar”** / **“En geniş sınırlar”**. The public page exposes the map through an embedded viewer, but the accessible page did not expose a traceable GeoJSON/KML payload or provenance sufficient for canonical acquisition.
- Wikimedia Commons hosts an Eşrefoğulları location map whose metadata identifies the file as a CC BY-SA 2.5 derivative and describes it as a map of Turkmen principalities in late 13th/early 14th-century Anatolia. This confirms a reusable cartographic reference, but not a precise 1326 boundary.

An official Derbent district history page also states that Eşrefoğulları territory extended beyond Beyşehir/Seydişehir to areas including Ilgın, Bolvadin and Akşehir, with other settlements entering the borders at different times. This is useful as a **historical extent cross-check**, not as a polygon source.

The independent academic chronology remains important: a 2009 Süleyman Demirel University article states that Eşrefoğulları expanded to Seydişehir/Bozkır and north toward Doğanhisar/Şarkikaraağaç, acquired Bolvadin in 1320, and that II Süleyman was killed on 9 October 1326. These facts support temporal review but do not define a machine-readable boundary.

### Result

The new digital-map candidates improve the evidence chain but **do not close the geometry source gap**. No image is to be raster-traced or converted into canonical geometry.

## Source classification

| Source/evidence | Role | 1326 geometry authority |
| --- | --- | --- |
| Cliopatria v0.2.0 | Candidate political-entity geometry | Candidate only |
| Eşrefoğulları map reproduced in Beyşehir study | Cartographic research evidence | Not yet |
| Wikimedia Commons Eşrefoğulları map | Secondary cartographic reproduction | Not yet |
| Scribble Maps Eşrefoğulları map | Digital cartographic candidate | Not yet |
| Euratlas 1300 | Historical political context | No |
| TTK Alâiye 1915/16 map | Geographic/cartographic reference | No |
| Salt Research Alanya (Alâiye) map | Geographic/place-name reference | No |
| Alanya university GIS | Modern/local historical-site GIS | No |
| AtlasPI | Structured historical-geography/reference layer | No |
| aourednik/historical-basemaps 1300 | Upstream historical reference | No |
| aourednik/historical-basemaps 1400 | Later-period reference | No |
| Phersu Atlas | Structured historical-geography/reference candidate | No |

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

**Production staging may proceed now:** connect the acquired source/evidence manifests to the fail-closed reviewed-source pipeline and generate a non-canonical 1326 candidate dataset/report.

In parallel, the canonical geometry gate remains:

**obtain traceable 1326 geometry for Eşrefoğulları and Alâiye and complete explicit review of the Cliopatria Ottoman Q12560 cross-polity mapping.**

The staging dataset must remain explicitly marked `candidate-evidence-only` / `promotion: BLOCKED` and must never overwrite the canonical political-authority MapBin.


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

## Tier-1 geometry adapter implementation — 2026-09-19

The production staging track now has a dedicated adapter contract:

- `docs/PHASE_A_1326_TIER1_GEOMETRY_ADAPTER.md`
- `data/gis/1326/tier1-geometry-adapter-registry.json`
- `tools/tests/phase-a-1326-tier1-geometry-adapter.test.js`

The adapter registry deliberately carries the current three Tier-1 geometry states without inventing coordinates:

- Ottoman Beylik: `candidate`, Q12560 cross-polity manual review.
- Eşrefoğulları: `source-gap`, geometry acquisition/reconstruction pending.
- Alâiye: `source-gap`, geometry acquisition/reconstruction pending.

The adapter is compatible with the existing Province Source Studio but adds the 1326 historical-GIS provenance gate. A reviewed reconstruction must identify its historical sources, contribution of each source, reconstruction method, assumptions, uncertainty/confidence and reviewer status.

Map Studio georeferencing/control-point automation is explicitly treated as authoring infrastructure, not as historical evidence. If used for a reconstruction, control points and residuals become part of the proof artifact.

No adapter record may call the canonical publisher. The intended path is:

`adapter → provenance/temporal/entity review → source-document ring validation → physical-land validation → proof-group/topology → canonical review`.

This closes the **adapter architecture gate**. It does not close the **geometry evidence gate**.

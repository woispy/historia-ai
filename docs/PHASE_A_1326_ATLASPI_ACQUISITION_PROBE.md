# Phase A — 1326 AtlasPI Acquisition Probe

Status: **API/data model confirmed; AtlasPI upstream boundary path inspected; no target 1326 geometry acquired**

Scenario date: **1326-04-07**

## Probe result — 2026-09-19

AtlasPI's current public documentation identifies a structured historical-geography API with entity search, year snapshots, entity details, evolution, and GeoJSON export. It reports current version **v6.30.0**, and the project README describes the repository as containing source entity JSON, raw source data, processed data, and boundary extraction pipelines.

The repository's public `data/entities/` tree was directly inspected. The earlier Asia-batch scan found no occurrences of:

- Alaiye / Alâiye
- Eşref / Eshref
- Eşrefoğulları
- Ottoman
- Q12560

Repository-wide indexed searches likewise did not expose the target Eşrefoğulları/Alâiye spellings. This remains **repository-seed evidence only**; it is not evidence that the live API lacks the entities.

## Raw / processed / ingestion inspection

The requested AtlasPI pipeline inspection is now complete.

### `data/raw`

AtlasPI's tracked raw tree contains:

- `data/raw/historical-basemaps/`
- `data/raw/natural-earth/`
- `data/raw/unesco/`

The tracked `data/raw/historical-basemaps/` directory contains timestamped world GeoJSON snapshots, including:

- `world_1300.geojson`
- `world_1500.geojson`
- `world_1700.geojson`
- `world_1800.geojson`
- `world_1900.geojson`

There is **no tracked `world_1326.geojson` snapshot** in this AtlasPI raw tree.

### `data/processed`

The public repository's `data/processed/` directory is effectively empty apart from `.gitkeep`. Therefore the production boundary geometry is not stored there as a second independently versioned geometry authority.

### Boundary ingestion code

The inspected ingestion modules establish this chain:

```
AtlasPI entity
    ↓
aourednik/historical-basemaps matching
    ↓
timestamped world_YYYY.geojson
    ↓
matched geometry + confidence/provenance
```

`src/ingestion/extract_boundaries.py` explicitly maps pre-1800 entities to `historical-basemaps` snapshots and labels the resulting precision as academic/approximate.

`src/ingestion/aourednik_match.py` confirms that the upstream dataset is used for pre-1800 matching and that `BORDERPRECISION` affects the resulting confidence. It also documents the upstream license as **CC BY 4.0**.

`src/ingestion/enrich_boundaries.py` and `src/ingestion/boundary_generator.py` are especially important for our forensic gate: when a real polygon is unavailable, AtlasPI can generate an `approximate_generated` polygon around capital coordinates. That generated path is explicitly labelled as approximate and therefore **must not be treated as Historia AI authoritative geometry**.

## Upstream historical-basemaps coverage scan

The upstream `aourednik/historical-basemaps` `index.json` was scanned across all available timestamped snapshots for the Tier-1 target-name family.

The relevant hits are:

| Snapshot | Target labels found |
| --- | --- |
| 1279 | Byzantine Empire, Ilkhanate |
| 1300 | Byzantine Empire, Ilkhanate |
| **1326** | **No snapshot exists** |
| 1400 | Beylik of Aydin, Byzantine Empire, Ottoman Empire |
| 1492–1914 | Ottoman Empire |
| 1920 | Ottoman Sultanate |

The absence of Eşrefoğulları and Alâiye from this upstream index is consistent with the earlier AtlasPI seed scan: this particular historical-basemap lineage does not expose those two polities as named polygon features in the indexed snapshots inspected.

For 1300, direct inspection of `world_1300.geojson` found 237 features and only the following target-family polygons:

- `Ilkhanate` — `BORDERPRECISION=1`
- `Byzantine Empire` — `BORDERPRECISION=1`

No Ottoman, Eşrefoğulları, Alâiye, Karesi, Saruhan or Aydın polygon is present in that 1300 snapshot under those labels.

The 1400 index contains `Beylik of Aydin` and `Ottoman Empire`, but that snapshot is **74 years after the scenario date**. It is therefore a later-period cartographic reference, not a 1326 boundary source.

## Provenance finding

AtlasPI explicitly states that pre-1800 boundaries derive from **aourednik/historical-basemaps**, and the upstream project itself warns that its historical maps are work in progress and should be verified against other sources before academic use.

Therefore the provenance chain for any AtlasPI-derived geometry must remain:

```
AtlasPI record
    ↓
AtlasPI boundary provenance
    ↓
aourednik/historical-basemaps snapshot
    ↓
Historia AI candidate review
    ↓
temporal/entity/physical/topology validation
```

AtlasPI is consequently **not an independent historical boundary authority** for this gate. It is a structured access/matching layer over an upstream historical-basemap source whose own precision and uncertainty must remain visible.

## Important negative finding

The requested raw/processed inspection does **not** reveal a hidden 1326 geometry layer that can close the current blocker.

Instead, it establishes a stronger negative result:

> **AtlasPI cannot currently supply an exact 1326 Tier-1 boundary snapshot through its tracked historical-basemaps lineage.**

The nearest relevant upstream states are 1300 and 1400, but neither can be relabelled as 1326.

This is a useful forensic result because it prevents us from wasting time trying to derive a supposedly authoritative 1326 polygon from an AtlasPI endpoint that ultimately resolves to coarse, timestamped upstream snapshots.

## Current decision

The acquisition gate remains **OPEN but NOT PASSED**.

No AtlasPI geometry has been copied into Historia AI.

No synthetic Alâiye or Eşrefoğulları polygon has been created.

No 1300/1400 upstream polygon has been relabelled as 1326.

No canonical political-geography data has been changed.

## Next executable gate

AtlasPI is now downgraded from a possible direct geometry acquisition path to a **provenance/reference source** for this phase.

The next efficient work item is:

1. preserve the exact AtlasPI/upstream findings in the geometry review;
2. inspect independent machine-readable historical sources for **Eşrefoğulları and Alâiye**;
3. separately review the Cliopatria Ottoman candidate against the 1326-04-07 scenario;
4. only after an actual date-appropriate candidate exists, perform geometry, physical-land and topology validation.

Promotion remains **BLOCKED** and SAFE TO DELETE remains 0.

# Phase A — 1326 AtlasPI Acquisition Probe

Status: **API/data model confirmed; target entity geometry not yet acquired**

Scenario date: **1326-04-07**

## Probe result — 2026-09-19

AtlasPI's current public documentation identifies a structured historical-geography API with entity search, year snapshots, entity details, evolution, and GeoJSON export. It reports current version **v6.30.0**, and the project README describes the repository as containing source entity JSON, raw source data, processed data, and boundary extraction pipelines. citeturn0search0turn4search0turn4search3

The repository's public `data/entities/` tree is directly accessible through GitHub. The Asia batch was inspected because the target Anatolian entities should be geographically represented there if present. A direct text scan of `batch_02_asia.json` found **no occurrences** of:

- Alaiye / Alâiye
- Eşref / Eshref
- Eşrefoğulları
- Ottoman
- Q12560

Repository-wide GitHub code search likewise returned no indexed matches for the target Alaiye/Eşrefoğulları spellings.

This is **not evidence that the live API lacks the entities**. It only establishes that the inspected public seed files and indexed repository search did not expose the target records under those spellings.

## Provenance finding

AtlasPI explicitly states that pre-1800 boundaries derive from **aourednik/historical-basemaps**, and the upstream project is separately credited as a source. AtlasPI also states that imported datasets retain their original licenses. citeturn0search0turn4search0

Therefore any future AtlasPI geometry acquisition must preserve the two-level provenance chain:

AtlasPI record
    ↓
AtlasPI boundary provenance
    ↓
upstream historical-basemaps/source record
    ↓
Historia AI candidate review

AtlasPI itself should not be treated as an independent historical boundary authority merely because it exports GeoJSON.

## Current decision

The acquisition gate remains **OPEN but NOT PASSED**.

No AtlasPI geometry has been copied into Historia AI.

No synthetic Alâiye or Eşrefoğulları polygon has been created.

No canonical political-geography data has been changed.

## Next executable gate

The next efficient probe is to inspect AtlasPI's public **raw source / processed data directories and boundary-ingestion code** for the exact source record path and entity naming conventions, rather than repeatedly guessing live API queries.

If a target record is found, capture:

1. immutable GitHub commit/ref;
2. exact source file;
3. entity ID;
4. raw record;
5. boundary payload;
6. temporal semantics;
7. confidence;
8. upstream source/provenance;
9. applicable license;
10. SHA-256;
11. geometry format/CRS;
12. physical/topology validation result.

Only then may it enter the Historia AI candidate-source pipeline.

Promotion remains **BLOCKED** and SAFE TO DELETE remains 0.

# Phase A — 1326 AtlasPI Geometry Candidate Assessment

Status: **structured source candidate identified; no Historia AI source snapshot acquired**

Scenario date: **1326-04-07**

## Finding

AtlasPI is a public REST API / historical-geography database exposing structured entities, historical boundaries, confidence scores, academic citations, and GeoJSON export. Its project documentation states that the service is free, requires no API key, and is Apache-2.0 licensed. It also states that boundary provenance is tracked and that historical-basemap data are derived in part from aourednik/historical-basemaps. citeturn4search0turn4search1

This makes AtlasPI a materially stronger acquisition candidate than an image-only map.

## Critical provenance distinction

AtlasPI documentation states that its pre-1800 historical boundary layer derives from aourednik/historical-basemaps. The upstream historical-basemaps project itself describes its GeoJSON as global/continental-scale historical basemaps, warns that the maps require verification, and records approximate-border precision. It also exposes GeoJSON snapshots in WGS84/EPSG:4326. citeturn3search10turn2search0

Therefore AtlasPI must not automatically be treated as an independent historical authority.

The acquisition model should preserve:

upstream historical source
    ↓
AtlasPI ingestion / normalization
    ↓
AtlasPI entity + boundary record
    ↓
Historia AI candidate

The upstream source and AtlasPI transformation layer must remain distinguishable.

## Alâiye / Eşrefoğulları status

A targeted public search did not yet establish that AtlasPI exposes a specific Alaiye or Eşrefoğulları record through indexed pages.

The API documentation does, however, establish that entity search and GeoJSON export are available. The live API endpoint could not be directly fetched through the current web retrieval path, so no entity ID, geometry bytes, confidence score, or 1326-specific polygon has been claimed here. citeturn4search0turn4search1

Consequently:

- AtlasPI is a **high-value acquisition candidate**.
- No AtlasPI geometry has been imported.
- No Alâiye/Eşrefoğulları geometry has been asserted from AtlasPI.
- No SHA-256 or raw artifact exists in the Historia AI source snapshot set.
- Canonical authority remains unchanged.

## Historical-basemaps classification

The upstream historical-basemaps repository is useful because it stores machine-readable GeoJSON and exposes a temporal index. However, its own documentation says it is intended for world/continental-scale mapping, warns users to verify historical maps, and explicitly models border precision. It therefore fits Historia AI as **candidate/reference evidence**, not as an automatic province-boundary authority. citeturn3search10turn2search0

The repository also has an unresolved discussion about the license applicable to its GeoJSON data, so downstream licensing must be checked at acquisition time rather than inferred solely from the repository's software license. citeturn3search7

## Decision

AtlasPI
  ↓
structured historical-geography source
  ↓
GeoJSON export + provenance metadata documented
  ↓
specific 1326 entity/geometry not yet independently acquired
  ↓
candidate only
  ↓
NO import
  ↓
NO promotion

## Next executable gate

The next source-intake action is to obtain a reproducible AtlasPI response/export for the target entities, if available, and record:

1. exact API endpoint and query;
2. response timestamp;
3. AtlasPI release/version;
4. entity ID and entity name;
5. geometry payload;
6. geometry semantics and confidence;
7. upstream boundary provenance;
8. upstream source identity;
9. applicable license;
10. raw response SHA-256;
11. temporal applicability to **1326-04-07**;
12. physical-land/coastline and topology results.

Only after those fields are captured can AtlasPI move from research candidate to acquired candidate source.

Promotion remains **BLOCKED** and SAFE TO DELETE remains 0.

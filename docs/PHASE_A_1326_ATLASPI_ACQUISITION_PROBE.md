# Phase A — 1326 AtlasPI Acquisition Probe

Status: **API/data model confirmed; target entity geometry not yet acquired**

Scenario date: **1326-04-07**

## Probe result

AtlasPI documentation confirms a public REST API with no API key and explicit GeoJSON export. The documented endpoints include entity search, full entity lookup, year snapshots, evolution, and GeoJSON export. citeturn0search1turn0search2

The public documentation also states that historical boundary provenance is represented explicitly and identifies `aourednik/historical-basemaps` as the pre-1800 upstream boundary source. citeturn0search2

A direct retrieval of the live `/v1/search` and `/v1/snapshot/1326` endpoints was not available through the current retrieval path. Repository code search also did not surface indexed Alaiye, Eshref, or Ottoman entity records in the public AtlasPI repository.

Therefore no target entity ID or geometry bytes are claimed from this probe.

## What is now established

AtlasPI is stronger than a rendered-map-only source because:

- it exposes structured entity records;
- it exposes GeoJSON export;
- it carries confidence metadata;
- it records boundary provenance;
- it has a versioned software/data release and Zenodo DOI;
- its documentation distinguishes imported source licenses.

These properties make it suitable for a controlled acquisition attempt.

## What is still missing

Before Historia AI can retain AtlasPI geometry as candidate evidence, we need an actual response/export containing the target entity and must capture:

- exact request URL;
- response bytes;
- acquisition timestamp;
- AtlasPI version;
- entity ID/name;
- geometry;
- CRS;
- boundary provenance;
- confidence;
- temporal semantics;
- upstream source identity;
- applicable license;
- SHA-256.

Only then can the candidate enter geometry validation.

## Provenance rule

AtlasPI must remain a transformation layer in the evidence chain:

AtlasPI entity/boundary
    ↓
AtlasPI provenance metadata
    ↓
upstream historical-basemaps/source record
    ↓
Historia AI candidate review

AtlasPI's own documentation states that pre-1800 boundaries use aourednik/historical-basemaps. The upstream project describes its data as approximate historical basemaps requiring verification. citeturn0search2turn0search3

Consequently, even a successful AtlasPI acquisition does not automatically become canonical geometry.

## Decision

**Acquisition gate: OPEN for a controlled probe, but not yet passed.**

No geometry has been imported or promoted.

## Next executable step

Obtain a reproducible AtlasPI entity/export response for:

1. Alâiye;
2. Eşrefoğulları;
3. Ottoman Q12560 cross-polity review.

Then independently hash and archive the raw response before any geometry processing.

Promotion remains **BLOCKED** and SAFE TO DELETE remains 0.

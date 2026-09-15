# 1326 Cliopatria Data Ingestion

## Purpose

Define the reproducible ingestion boundary for the pinned Cliopatria v0.2.0 source used as historical evidence for the 1326-04-07 scenario.

## Source contract

- Source ID: `cliopatria-v0.2.0`
- Provider: Seshat Global History Databank
- Dataset: Cliopatria
- Version: v0.2.0
- Scenario date: `1326-04-07`
- Candidate temporal rule: `FromYear <= 1326 <= ToYear`
- Candidate type: `POLITY` only
- Authority status: `evidence-only`

The acquisition manifest is the single source of source metadata. The candidate CLI resolves the Cliopatria source from that manifest rather than duplicating release metadata.

## Pipeline

```text
cliopatria.geojson
        |
        v
extract-cliopatria-candidates
        |
        +--> temporal applicability
        +--> POLITY filter
        +--> source identity preservation
        |
        v
HistoricalEntityReconciliation
        |
        +--> resolved
        +--> unresolved
        +--> ambiguous
        |
        v
candidate artifact
        |
        v
geometry evidence inventory
        |
        v
cross-source geometry reconciliation
        |
        v
manual historical review
        |
        v
canonical political geography
```

## Required preservation

Each candidate retains the source feature ID, source name, Wikidata/Seshat identifiers when present, source-reported area, temporal interval, type, and original geometry. The ingestion layer does not simplify, union, clip, repair, or otherwise reinterpret the source polygon.

## Reconciliation rules

Stable source identifiers are preferred over names. A name-only match is not sufficient for automatic canonical promotion. Multiple matching canonical entities remain ambiguous. Entity reconciliation establishes identity only; it does not establish historical control or canonical boundaries.

The current repository intentionally leaves the 1326 `entity-reconciliation.json` source-match arrays unresolved until the real v0.2.0 records are inspected. This prevents guessed Wikidata/Seshat identifiers from becoming project facts.

## Promotion boundary

The candidate artifact must remain `evidence-only` and `not-promoted`. No candidate may enter the canonical political dataset until all applicable temporal, identity, geometry provenance, cross-source review, confidence, topology, and physical-boundary gates pass.

In particular:

- no 1300 geometry may be copied or relabeled;
- later events in 1326 may not be projected backward to April 7;
- missing geometry remains missing;
- synthetic Voronoi, jitter, anchor, or filler geometry is prohibited;
- broad polity existence does not prove a province polygon;
- political geometry remains separate from dynamic control/occupation state.

## External archive handling

The repository records the pinned archive metadata in `data/gis/1326/acquisition-manifest.json`, but the external binary archive is not committed to Git. A local extracted `cliopatria.geojson` is an ingestion input, not canonical project data.

When the real archive is acquired, its recorded filename, size/hash metadata, acquisition snapshot, and local input path must remain traceable to the manifest. Any mismatch must fail the ingestion process rather than silently replacing the source.

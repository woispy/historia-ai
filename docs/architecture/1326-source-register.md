# Historia AI — 1326 Historical Source Register

## Status

This document defines the evidence pool for the canonical `1326-04-07` scenario. It is a source/reconciliation contract, not a political geography dataset.

The repository must not promote a source polygon to canonical political authority merely because it exists or covers the correct year.

## Production rule

```text
source
  -> evidence extraction
  -> temporal normalization
  -> entity reconciliation
  -> geometry reconciliation
  -> topology validation
  -> provenance / confidence
  -> review
  -> canonical geography
```

Missing evidence remains missing. The pipeline must not use Voronoi, jitter, anchor, or other synthetic fallback geometry to manufacture historical boundaries.

## Priority regions

### Tier 1

- Anatolia
- Byzantine Empire
- Balkans
- Black Sea
- Caucasus
- Iran
- Iraq
- Syria
- Egypt

### Tier 2

- Europe
- Central Asia
- North Africa
- South Asia
- China

### Tier 3

More distant regions may remain lower-detail without preventing the 1326 scenario from being playable.

## Candidate evidence sources

### Cliopatria

**Role:** global political-entity evidence.

Cliopatria is a global geospatial dataset covering 3400 BCE-2024 CE. Its records use GeoJSON geometries in EPSG:4326 and temporal `FromYear`/`ToYear` intervals. The project explicitly warns that its maps represent one historical interpretation and that border, naming, territorial-change, and duration uncertainties exist. Therefore Historia AI treats it as evidence for entity/extent reconciliation, not as an automatic canonical boundary source.

Official repository: https://github.com/Seshat-Global-History-Databank/cliopatria

### Digital Atlas of Dioceses and Ecclesiastical Provinces in Late Medieval Europe

**Role:** European late-medieval boundary context.

The public data supplement covers 1200-1500 and provides polygon data in Shapefile/GeoJSON-related formats under CC BY 3.0. These are ecclesiastical jurisdictions, so they cannot be treated as political province authority. They are useful as corroborating historical geography evidence in Europe.

Dataset record: https://geodata-cdn.lib.utexas.edu/catalog/stanford-rh195hm5975

### OpenHistoricalMap

**Role:** historical feature and boundary evidence.

OpenHistoricalMap provides historical geospatial data through downloads/APIs. Its general data dedication is CC0 except for individually tagged features carrying other open licenses. License tags must therefore be preserved and checked for any material used. OHM is collaborative and uneven in historical coverage, so it is evidence rather than automatic 1326 political authority.

Export: https://www.openhistoricalmap.org/export
Copyright/licensing: https://www.openhistoricalmap.org/copyright

### World Historical Gazetteer

**Role:** historical place identity, reconciliation, and provenance evidence.

WHG is useful for linking historical place identities and source-linked records. It is not treated as a single authoritative 1326 province layer.

Website: https://whgazetteer.org/

## Explicit exclusions

### 1300 historical-basemaps data

Existing 1300 assets remain reference/regression material. They must not be renamed to 1326 or copied into 1326 merely to fill missing coverage.

### Paid 1300 Euratlas data

The paid Euratlas 1300 GIS product is not part of the free-source production pipeline.

## Evidence record requirements

Every promoted historical geometry must retain, at minimum:

- scenario/date applicability;
- source provider;
- dataset/version or source snapshot;
- source feature identity;
- source URL where applicable;
- license/usage classification;
- historical interpretation notes;
- confidence;
- review status;
- reconciliation notes;
- canonical entity identity.

## Authority separation

Political geometry is static canonical data. Political owner/controller/occupation are scenario state and may change during simulation. A source describing control at one historical moment must not mutate canonical geometry.

Physical geography remains a separate authority layer from political geography.

## Current state

The 1326 source registry is established, but no authoritative 1326 political runtime asset has been promoted yet. The next production task is source acquisition and reconciliation, beginning with Tier 1 evidence and the highest-confidence entities rather than generating a synthetic global polygon set.

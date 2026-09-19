# Phase A — 1326 Phersu API Acquisition Assessment

Status: **research candidate only; no source snapshot acquired; no geometry imported**

Scenario date: **1326-04-07**

## Finding

Phersu Atlas publicly describes a historical map API with structured historical political boundaries and MapLibre/Mapbox integration. Its public materials describe 178 historical dates, historical political boundaries, and a data model built from thousands of historical sources. citeturn0search4turn0reddit15

This materially confirms that Phersu is a structured historical-geography source and not merely a static map-image site.

However, the available public API is an application/API product rather than an openly downloadable raw geometry archive. The public announcement describes an API-key based style endpoint, and the public atlas restricts some historical dates/features behind its access model. citeturn0reddit15turn0search7

Therefore the current evidence does **not** satisfy Historia AI's source-intake requirement for an immutable raw geometry snapshot.

## Alaiye relevance

The previously identified Phersu Alaiye polity record remains a useful entity-level candidate. Its existence in the structured atlas makes Phersu valuable for cross-source reconciliation.

But the following required acquisition fields remain unresolved:

- raw geometry bytes;
- exact geometry format;
- CRS;
- immutable downloadable artifact reference;
- raw SHA-256;
- license terms applicable to the geometry artifact;
- reproducible extraction procedure;
- exact semantics of the polygon at **1326-04-07**.

The existence of a map/API representation does not close these gaps.

## Decision

Phersu structured polity evidence
        ↓
historical source candidate
        ↓
API/map product confirmed
        ↓
raw geometry snapshot unavailable under current access path
        ↓
NOT ACQUIRED
        ↓
NOT IMPORTED
        ↓
NOT CANONICAL

No attempt should be made to reconstruct a polygon from screenshots, rendered tiles, or undocumented application responses merely to close the source gap.

## Eşrefoğulları

No equivalent machine-readable geometry artifact has yet been verified.

The current academic/cartographic evidence remains research evidence only. The project must not convert an approximate “widest extent” map into an exact 1326-04-07 polygon without a traceable source and explicit reconstruction assumptions.

## Next gate

Continue source acquisition research in two parallel tracks:

1. identify an openly downloadable, provenance-traceable geometry source for **Alâiye** and **Eşrefoğulları**;
2. review the existing **Cliopatria Ottoman Q12560** candidate geometry without treating the cross-polity label as automatic entity equivalence.

For any newly found source, capture before import:

source identity
→ immutable reference
→ license/provenance
→ raw artifact
→ SHA-256
→ format / CRS
→ temporal semantics
→ entity semantics
→ geometry review
→ physical/topology validation

Promotion remains **BLOCKED** and SAFE TO DELETE remains 0.

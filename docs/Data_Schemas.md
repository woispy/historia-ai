# Data Schemas

Version: 2.0
Status: Active schema guidance
Last reviewed: 2026-09-17

---

# Purpose

This document describes the stable schema principles shared by Historia AI's scenario, historical-evidence, runtime-world and map-data layers.

It is intentionally **not** a claim that every runtime JSON object has the same shape. Different layers have different contracts and must not be flattened into one universal entity schema.

The most important rule is:

```text
Historical Evidence
    ≠
Candidate Political Geometry
    ≠
Canonical GIS Geometry
    ≠
Mutable Runtime State
    ≠
GPU / MapBin Representation
```

---

# General Rules

- Stable identifiers are strings at the semantic/data-model level.
- References use stable identifiers rather than array position.
- Canonical historical data is immutable after authority approval.
- Candidate data must remain distinguishable from canonical data.
- Provenance and confidence must not be discarded when data moves between layers.
- Runtime representations may use numeric IDs, typed arrays and binary offsets for performance.
- GPU/MapBin fields are transport representations and are not historical authority.
- Unknown fields should not be silently reinterpreted as authoritative semantics.

---

# Country / Political Entity

A political entity represents a state or polity used by simulation and scenario systems.

At the semantic layer, its stable identifier is the primary key. Historical ownership is date-dependent and must not be confused with permanent country identity.

Typical conceptual fields include:

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable political entity identifier |
| `name` | string | Display name |
| `color` | string | Visual identity where applicable |
| `playable` | boolean | Scenario/gameplay availability where applicable |
| historical metadata | object | Date/provenance information where applicable |

The exact scenario schema is defined by the active scenario validators and data files; this document does not override those contracts.

---

# Province Identity

A province is a simulation/geographic identity, not merely a polygon.

Conceptually:

```text
province identity
      ↓
historical ownership / attributes
      ↓
date-specific political surface
      ↓
runtime geometry representation
```

The current map runtime uses an `identity.id` for province identity and an ownership object containing an `ownerId` in the runtime data path.

Example shape used by the runtime family:

```json
{
  "identity": {
    "id": "bithynia"
  },
  "ownership": {
    "ownerId": "byzantium"
  }
}
```

The exact object may contain additional scenario/runtime fields; consumers must use the active runtime contract rather than assuming this example is exhaustive.

---

# Province Geometry Identity

Geometry has its own identity and must be traceable back to the province.

The runtime GIS representation can associate geometry through fields such as:

```json
{
  "identity": {
    "provinceId": "pontus-amisos"
  }
}
```

A province may also carry a geometry reference such as:

```json
{
  "references": {
    "geometryId": "..."
  }
}
```

This separation is intentional. A province identity must remain stable even when date-specific geometry is rebuilt or when multiple representations (canonical GIS, MapBin, GPU LOD) exist.

---

# Historical Evidence Schema Principles

Historical evidence should retain at least:

- source/provenance reference
- scenario/date
- entity or anchor identity
- evidence type
- confidence
- temporal validity where known
- whether the result is evidence, candidate, reviewed or canonical

Historical city coordinates are evidence/anchor information. They must not automatically become modern administrative boundaries.

---

# Anchor Graph Schema — T3-A

Anchor nodes connect historical evidence to candidate political reconstruction.

Conceptual fields:

```json
{
  "id": "anchor_bursa_1326",
  "date": "1326-04-07",
  "controller": "ottomans",
  "historicalRegion": "bithynia",
  "confidence": {
    "location": "high",
    "controller": "high",
    "extent": "medium"
  },
  "provenance": []
}
```

Edges use controlled relationship types, including:

```text
POLITICAL_ADJACENCY
FRONTIER
REGIONAL_PROXIMITY
ROAD_CORRIDOR
RIVER_CORRIDOR
MOUNTAIN_BARRIER
LAKE_BARRIER
COASTAL_ACCESS
STRATEGIC_PASS
STRATEGIC_CROSSING
```

Confidence is independent by evidence type.

---

# Candidate Political Surface — T3-B

T3-B outputs candidate political geometry.

Candidate records must remain distinguishable from canonical records until the relevant review and GIS authority gates pass.

A candidate geometry may be derived from weighted partitioning and constrained by physical geography, but the computational method itself is not historical authority.

---

# Physical Geography Data

Physical authority is separate from political data.

Relevant domains include:

- land polygons
- lakes/hydrography
- rivers
- terrain/DEM
- route/cost constraints
- mountain/ridge constraints

Physical data may constrain political geometry, but political geometry must not redefine physical authority.

---

# Runtime Map Geometry

The runtime GIS layer can contain multiple polygons per province. This is a representation detail and does not imply multiple province identities.

Runtime geometry should preserve:

- province linkage
- polygon coordinates
- provenance/version where provided
- scenario/date context
- geometry validity

Generated runtime GIS files are build artifacts unless explicitly designated as distributable source data.

---

# MapBin Schema

The current binary map transport is versioned and uses typed arrays.

Conceptual layout:

```text
Header
Province fields
Tile index
Geometry Float32 data
LOD ranges
City blocks
Palette
```

The current encoder uses a versioned MapBin header and stores geometry as `Float32` values. The runtime loader exposes immutable zero-copy typed-array views.

This representation is optimized for runtime transport and must not be treated as the historical source of truth.

---

# Runtime / Simulation State

Simulation state is mutable and should remain separate from immutable scenario definitions and canonical map data.

Examples of mutable domains include:

- ownership
- population
- economy
- diplomacy
- military state
- laws/reforms
- dynasty/characters
- religion/culture
- events

A runtime mutation must not silently rewrite canonical historical evidence or canonical geometry.

---

# Identifier and Reference Rules

Semantic references should use stable identifiers:

```text
Country → Province owner
Province → Geometry reference
City → Province
Army → Country / location
Anchor → Historical evidence
```

Runtime binary layers may replace semantic identifiers with numeric indices for performance, but the mapping back to stable semantic identity must remain deterministic.

---

# Validation and Versioning

Schema changes must be accompanied by:

1. focused validation/tests,
2. provenance documentation where relevant,
3. migration notes for incompatible changes,
4. updates to dependent documentation.

A schema version must describe the contract actually consumed by the active system. Examples in this document are conceptual unless explicitly identified as runtime fields.

---

# 1326 Rule

The production scenario date is:

```text
1326-04-07
```

1300-era data may remain in the repository for legacy research and forensic replay, but it must not be silently substituted for 1326 data.

---

# Conclusion

Historia AI uses layered data contracts rather than one universal schema. Stable identities, historical evidence, candidate geometry, canonical GIS, runtime simulation state and GPU transport must remain traceable without being conflated.

The goal is a data model that can scale from the current historical reconstruction work to 15,000+ provinces while preserving provenance, deterministic builds and runtime performance.

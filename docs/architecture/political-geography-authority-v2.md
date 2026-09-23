# Historia AI - Political Geography Authority v2

Status: proposed architecture contract
Scope: Anatolia and surrounding regions first; world-scale compatible by design

## 1. Decision

Production political province geometry is an authoritative, versioned dataset. It is not generated at runtime from province centroids, anchors, jitter, Voronoi sites or fallback polygons.

`AnatoliaPhase2DGeometryBuilder` remains available as legacy/research/forensic tooling only. It must not become the production geometry authority again.

The production flow is:

```text
source dataset
  -> normalization
  -> provenance capture
  -> topology construction
  -> physical and political validation
  -> LOD generation
  -> compiled map pack
  -> runtime renderer
```

## 2. Authority boundaries

### Physical Geography Authority

Owns:

- land masks
- coastlines
- oceans and seas
- lakes
- rivers and river networks
- terrain and elevation
- physical topology

Physical geography constrains political geometry but does not automatically generate political borders.

### Political Geography Authority

Owns:

- province faces and rings
- political vertices and shared edges
- regions
- countries and sea zones
- declared political coverage
- historical geometry versions

Political geometry may reference physical geography, but it never becomes the physical geography authority.

### Political State Authority

Owns dynamic values only:

- owner
- controller
- occupation
- culture
- religion
- war/front state
- selection and visibility state

Political state changes must never rebuild immutable geometry or topology.

## 3. Geometry and metadata contract

Province metadata is descriptive and historical. It is not a geometry generator input.

```json
{
  "provinceId": "bithynia-prusa",
  "geometryId": "anatolia-1300-v1:bithynia-prusa",
  "regionId": "bithynia",
  "historicalName": "Prusa",
  "centroid": [29.06, 40.19],
  "confidence": "high",
  "historicalValidity": { "from": 1300, "to": null }
}
```

Geometry records carry provenance and versioning:

```json
{
  "geometryId": "anatolia-1300-v1:bithynia-prusa",
  "provinceId": "bithynia-prusa",
  "geometryVersion": 1,
  "source": "curated-historical-reconstruction",
  "sourceVersion": "anatolia-1300-v1",
  "sourceReferences": [],
  "reviewStatus": "verified",
  "confidence": "high",
  "coverageId": "anatolia-1300",
  "rings": []
}
```

`reviewStatus` values are `draft`, `reviewed`, and `verified`. A production map pack may contain only `reviewed` or `verified` geometry.

## 4. Political topology

Political topology is shared-edge/face based:

```text
PoliticalVertex
  -> PoliticalEdge
      -> ProvinceFace A
      -> ProvinceFace B
```

A political edge has one canonical coordinate sequence. Province faces reference the edge direction instead of storing divergent copies of the same border.

Political topology owns political boundaries and adjacency. Physical topology is separate:

```text
PhysicalTopology
  - land boundary
  - coastline
  - lake boundary
  - river network

PoliticalTopology
  - political vertex
  - political edge
  - province face
  - adjacency
```

A political edge may reference a physical feature, but a river running through a province is not automatically a political border.

## 5. Coverage and validation

Validation applies to declared political coverage, not to the entire planet unless a dataset declares world coverage.

Required checks:

- closed rings and finite coordinates
- positive area and no self-intersections
- zero positive-area overlap inside declared coverage
- zero unowned internal gap inside declared coverage
- canonical shared-edge consistency
- symmetric adjacency
- stable province and geometry IDs
- physical land/water constraints
- antimeridian-safe normalization
- deterministic build output
- provenance completeness

The outside of a coverage is explicitly `undefined`, `ocean`, or `future-dataset`; it is not an accidental validation gap.

## 6. Anatolia proof dataset

The first production proof dataset is `anatolia-1300` with 38 provinces. It is a constitutional proof of the world-scale architecture, not a throwaway regional implementation.

Promotion criteria:

- 38 authoritative province geometries
- `fallbackProvinceCount = 0`
- zero internal overlap
- zero internal gap
- 100% shared-edge consistency
- complete provenance for every geometry
- deterministic map pack
- correct province picking
- owner mutation without geometry rebuild
- physical coast/lake/river validation
- CI validation green

Until this gate is green, Phase 2D cannot be promoted to production authority and scaling work cannot begin.

## 7. Compiled runtime representation

`world.mapbin` remains the compiled transport, not the source authority. Its future sections should separate:

```text
physical geometry
political geometry
political topology
LOD and spatial index
static metadata
```

Dynamic political state remains outside the immutable map pack:

```text
provinceId -> owner/controller/occupation/war state
```

The GPU renderer consumes persistent geometry buffers and dynamic state buffers. Ownership changes update state buffers only.

## 8. LOD and global scaling

The data contract is global even though Anatolia is first:

```text
LOD 0: world country/coast/major hydrography
LOD 1: regional borders, terrain, major rivers
LOD 2: provinces, lakes, cities, province borders
LOD 3: detailed coast, minor rivers, passes, settlements
```

Scaling gates are 38 -> 500 -> 1,000 -> 5,000 -> 15,000+ provinces. Each gate must preserve topology, deterministic builds, bounded memory, stable picking and dynamic-owner updates.

World physical geography is not postponed until after Anatolia. The physical authority, coverage model, LOD contract and tile/map-pack interfaces must be world-compatible from the first implementation.

## 9. Map Studio boundary

A future Map Studio edits source datasets, never runtime buffers:

```text
Map Studio -> versioned source dataset -> validation -> build -> map pack -> runtime
```

Initial implementation order is dataset, topology, validation, builder and runtime. Editor tooling follows only after the contract is proven.

## 10. License and provenance

Open-Historia is an AGPL-3.0 project. Its architecture is a reference, not code or asset input. Historia AI implementations must be independently authored, and every external GIS source must retain its own license and provenance metadata.

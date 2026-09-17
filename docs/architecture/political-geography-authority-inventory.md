# Political Geography Authority v2 - Existing Authority Inventory

Status: inventory baseline
Date: 2026-09-13

This document records which existing systems can be promoted into Political Geography Authority v2 and which systems must remain diagnostic or derived.

## P3/P4/P5 political topology

### Promote as foundation

- `tools/historical-gis/province/AuthoritativeArcGenerator.js`
  - Canonical shared arc registry.
  - Stable wrapped-longitude node and arc identity.
  - Reverse traversals reuse one geometry record.
- `tools/historical-gis/province/FaceRingAssembler.js`
  - Directed face-ring assembly from arc references.
  - Fails on open or ambiguous rings instead of inventing topology.
- `tools/historical-gis/province/FullFaceAssembly.js`
  - Reconstructs complete face rings from incident authoritative arcs.
  - Preserves honest failure semantics for incomplete graphs.
- `tools/historical-gis/province/PlanarTopology.js`
  - Planar validation and Euler characteristic checks.
- `tools/tests/p3-authoritative-arcs.test.js`
- `tools/tests/p3-authoritative-face-rings.test.js`
- `tools/tests/p3-multi-arc-graph-assembly.test.js`
- `tools/tests/p5-full-face-assembly.test.js`

### Current limitation

These components prove the topology contracts with solver paths and fixtures. They do not yet consume a reviewed `anatolia-1300` political boundary dataset. They may assemble authoritative input, but they must not infer missing historical borders.

## P6 physical boundary evidence

### Promote as evidence only

- `tools/historical-gis/P62BoundarySolver.js`
  - Evidence scoring for ridge, river, hierarchy and historical adjacency.
  - Explicitly returns `authoritative: false` unless a future READY gate is satisfied.
- `tools/historical-gis/P62RiverEvidenceAdapter.js`
  - Natural Earth 10m river centerline evidence.
  - Explicitly non-authoritative for political borders.
- `tools/historical-gis/province/CopernicusDemCostSampler.js`
  - DEM sampling for terrain and boundary evidence.
- `tools/historical-gis/province/TerrainRidgeAnalysis.js`
  - Ridge/divide evidence.
- `tools/tests/p6.2-boundary-solver.test.js`
- `tools/tests/p6.2-river-evidence-integration.test.js`
- `tools/tests/anatolia-seed-physical-cost-stress.test.js`
- `tools/tests/adaptive-ridge-boundary-quality.test.js`

### Authority rule

P6 evidence can constrain or review a political boundary. It cannot create a political province boundary by itself. The P6.2 fail-closed behavior is correct and must remain.

## Physical geography authority

### Current authority

- `src/map/data/AnatoliaPhysicalAtlas.js`
- `src/map/data/AnatoliaPhysicalAtlasRuntime.js`
- `src/map/physical/WorldPhysicalAtlas.js`
- `src/map/data/generated/anatolia-hydrography-10m.json`
- generated Natural Earth geometry assets under `src/world/map/assets/geometry/`
- `tools/tests/physical-geography-1300.test.js`
- `tools/tests/hydrography-10m.test.js`

Physical land, coastline, lake and river data remain independent from political geometry. World expansion must extend this authority through the same source, normalization, validation and LOD contracts rather than by copying the Anatolia-specific builder.

### Global foundation measurement

The existing generated Natural Earth country geometry set currently contains:

- 242 country geometry assets
- 1,620 polygon rings
- 99,432 polygon vertices
- 0 non-finite or structurally invalid polygons in the inventory probe

This is sufficient as a global physical/current-admin basemap and topology stress foundation. It is not a historical province authority and must not be used to claim 1300 political borders.

## Legacy political geometry

### Must not be promoted

- `tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`
  - Uses metadata anchors and Voronoi/fallback reconstruction.
  - Retained for research, forensic comparison and legacy regression only.
  - Does not satisfy authoritative geometry provenance or shared-edge requirements.
- `src/map/data/AnatoliaProvinceMetadata.js`
  - Metadata, confidence and historical context only.
  - Never a production polygon source.

## Runtime/build representation

- `tools/historical-gis/cli/import-1300.js` currently writes a historical runtime JSON and invokes legacy Phase 2D.
- `tools/build/build-mapbin.js` compiles runtime JSON into `public/assets/world.mapbin`.
- `src/map/runtime/MapBinLoader.js` and `src/map/runtime/BinaryMapAssetSource.js` are transport/runtime consumers.

The mapbin pipeline can be retained, but its source must move from legacy Phase 2D output to the versioned authoritative political dataset. The browser must never become the geometry authority.

## Missing authority pieces

1. Reviewed `anatolia-1300` province boundary source.
2. Political vertex/edge/face source dataset.
3. Declared coverage boundary and internal-gap semantics.
4. Geometry provenance records and review workflow.
5. Golden fixture with zero fallback geometry.
6. Builder that consumes authoritative topology without synthesizing missing borders.
7. Mapbin sections for political topology and LOD metadata.
8. Dynamic owner/controller state buffer contract.

## Promotion gate

No legacy Phase 2D output is promoted until the 38-province golden dataset satisfies the contract in `political-geography-authority-v2.md`:

- zero fallback geometry
- zero internal overlap
- zero internal gap
- 100% shared-edge consistency
- complete provenance
- deterministic compiled output
- physical validation
- correct picking
- owner mutation without geometry rebuild

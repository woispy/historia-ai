# Changelog

All notable changes to Historia AI will be documented here.

---

# Unreleased — 1326 Migration / Forensic Closure Track

## Current direction

- Production scenario target is now **1326-04-07**.
- 1300 remains a legacy/research/forensic pipeline and must not silently supply 1326 geometry.
- Historical evidence, physical geography, political candidates, canonical GIS and GPU transport remain separate authority boundaries.
- The migration lifecycle remains `Evidence → Candidate → Reviewed → Canonical`.

## Forensic work

### B4

- Completed B4 forensic calibration against the canonical full political seed universe.
- Confirmed Nicomedia and Nicaea power-cell equivalence under the calibrated comparison.
- Isolated canonical-land versus shared physical-authority water/invalid endpoint divergence without changing production authority.

### A1

- Kept A1 open as a provenance/stage-lineage investigation.
- Preserved `MIN_AREA = 0.00005` unchanged.
- Did not reinterpret historical audit discrepancies as permission to alter geometry.

### A2

- Added immutable checkpoint replay tooling for the Amisos `2.27e-13` anomaly.
- Replayed historical Phase 2D producer paths with pinned physical/hydrography preparation.
- Confirmed that the currently replayed Phase 2D producer path does not reproduce the target tiny area.
- Narrowed the remaining investigation to the runtime representation and downstream serialization/transport path: `runtime.json → MapBin → binary Float32 representation → runtime decoder → GPU/LOD`.
- Kept forensic harnesses isolated from production geometry.

### C

- Retained Amasya Edge-3 as a separate real replay/authority-binding task.
- Lake/shoreline recovery semantics remain distinct from final physical-land validation.

## Map architecture

- Established the current architecture around Historical Evidence, T3-A Anchor Graph, T3-B Candidate Political Surface, Physical Authority, Boundary Solver, Topology, Canonical GIS, MapBin and GPU runtime layers.
- Explicitly documented that renderer/GPU data is transport/representation and not historical authority.
- Documented immutable canonical data versus mutable simulation state.

## Documentation

- Replaced the stale high-level architecture description with the active architecture in `docs/ARCHITECTURE.md`.
- Updated `README.md` to reflect the 1326 migration, current map pipeline, forensic governance and performance direction.

---

# Unreleased — Phase 2D Physical Coast & Water Geometry Refinement

## Added

### Physical geometry constraints

- Political control sites now require physical-land membership.
- Added deterministic coastline barrier sites that participate in tessellation without becoming provinces.
- Added internal sea and lake barrier sites so water bodies cannot be painted by province cells.
- Increased coastline sampling density.
- Added a small inward coastal control field to preserve detailed province geometry near the shore.
- Added polygon-centroid validation against the physical land/water authority.

### Runtime geometry

- Phase 2D geometry version advanced to `2`.
- Runtime asset metadata now reports political-site and barrier-site counts.
- The geometry builder no longer treats the numeric Anatolia bounding box as sufficient evidence of usable land.

### Validation

- Strengthened `test:anatolia-phase2d` to validate physical land centroids and the presence of a substantial barrier field.

## Cartographic policy

The physical coastline is a hard cartographic constraint. This refinement does not claim cadastral precision for uncertain medieval political borders. Historical ownership remains separate in the Phase 2B metadata layer.

---

# Unreleased — Phase 2D Historical Province Geometry

## Added

### Anatolia runtime geometry

- Added a deterministic 38-province Phase 2D geometry builder.
- Replaced the coarse Anatolia source-province presentation at runtime while preserving the 1300 historical GIS source for research and the rest of the world.
- Added dense land control sites, coastline control sites and historical GIS shape anchors.
- Added a stable WGS84 cartographic envelope that keeps Constantinople and Adrianopolis outside the Anatolia override while retaining Sinop, Trebizond and the eastern Black Sea coast.
- Added multi-polygon province assets so complex cartographic shapes can be represented without introducing duplicate province entities.

### Rendering

- Province fills no longer draw their own border stroke.
- Shared province/country borders are now visually owned by the topology layer, preventing internal geometry fragments from creating false borders.
- Existing physical land-mask and water-layer ordering remains authoritative.

### Validation

- Added `test:anatolia-phase2d`.
- CI now runs Phase 2D geometry tests, geometry-builder syntax checks, GIS generation and runtime validation.

## Cartographic policy

Phase 2D is a deterministic cartographic reconstruction, not a claim of medieval cadastral precision. Historical ownership remains separate from geometry and continues to use the Phase 2B confidence model. Future source-backed boundary corrections should be added as builder constraints rather than hard-coded screen coordinates.

---

# Unreleased — Phase 2C Anatolia Geometry & Geography Refinement

## Added

### Cartographic refinement

- Stable WGS84 anchor coordinates for all 38 Phase 2B Anatolia province identities.
- Broad terrain classes with deterministic movement, defense, winter and agriculture metadata.
- Relative settlement-density tiers for the 1300 presentation layer.
- Symmetric historical adjacency hints independent from uncertain polygon edges.
- Nine strategic passes / movement corridors.
- Seven selected river-crossing anchors covering the Sakarya, Gediz, Büyük Menderes, Kızılırmak, Yeşilırmak and Seyhan systems.

### Runtime GIS policy

- Broad hand-drawn Phase 2B political regional overlays are now research-only.
- Runtime province geometry remains source-derived from the 1300 historical GIS layer until Phase 2D.

### Validation

- Added `test:anatolia-phase2c`.
- CI checks Phase 2C metadata, adjacency symmetry, strategic geography, coordinate ranges and terrain profiles.

---

# Unreleased — Phase 2B Anatolia Reconstruction

## Added

- Ten-region 1300 Anatolia reconstruction profile.
- Historical polity context with start/end years, confidence levels and temporal notes.
- Province-level historical control metadata separated from mutable runtime ownership.
- Phase 2B province-to-region and city-to-province identity layer.
- Dedicated Phase 2B historical reconstruction tests.

### Historical corrections

- Aydinid ownership is no longer projected backward onto the 1300 start date.
- Hamidid control around Uluborlu/Eğirdir is represented as an early 1300–1301 transition.
- Sinop is represented through the Pervâneoğulları context in 1300 rather than the later Candarid state.
- Kütahya anchors the Germiyanid reconstruction.
- Mylasa and Peçin anchor the Menteşe reconstruction.
- Nicomedia, Nicaea and Prusa anchor Byzantine Bithynia.

### Map / City identity

- Anatolia city atlas now references stable Phase 2B province ids.
- Constantinople and Adrianopolis are intentionally outside the Anatolian province vocabulary.

---

# v0.1.0 — Foundation Complete

## Added

### Engine

- GameSession runtime model
- GameBootstrap startup pipeline

### Scenario System

- Immutable ScenarioDefinition
- ScenarioLoader
- ResourceLoader
- Layered ScenarioValidator

### Architecture

- Entity-per-file scenario structure
- Immutable scenario definitions
- Generic resource loading
- Layered validation pipeline

# Changelog

All notable changes to Historia AI will be documented here.

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

### Documentation

- Added `docs/architecture/anatolia-phase2d-geometry.md`.
- Updated the roadmap to distinguish Phase 2C metadata from Phase 2D actual runtime geometry.

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
- Historical polity context with start/end dates and confidence levels.
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

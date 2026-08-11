# Changelog

All notable changes to Historia AI will be documented here.

---

# Unreleased — Phase 2B Anatolia Reconstruction

## Added

### Historical GIS

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

### Validation

- CI now runs `test:anatolia-phase2b` before GIS generation and production build.

## Documentation

- Added `docs/architecture/anatolia-phase2b-reconstruction.md`.
- Updated roadmap with Phase 2A, Phase 2B and Phase 2C boundaries.

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

### World

- Data-driven WorldFactory

### Architecture

- Entity-per-file scenario structure
- Immutable scenario definitions
- Generic resource loading
- Layered validation pipeline

### Documentation

- Architecture documentation
- ADR documentation
- Development roadmap
- Changelog

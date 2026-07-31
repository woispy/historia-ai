# ADR-005 - Single Runtime Model

## Status

Accepted

## Date

2026-07-31

---

## Context

During the foundation phase, Historia AI contained two top-level runtime models:

- GameState
- GameSession

GameState was originally responsible for storing runtime information, world data,
player data and settings.

As the architecture evolved, GameSession became the central runtime object.

Maintaining both models created duplicated responsibilities and increased
migration complexity.

---

## Decision

GameSession becomes the single runtime model of the engine.

Every gameplay system, UI component and engine subsystem must operate on
GameSession.

Runtime-only information is stored inside:

GameSession.state

using the RuntimeState model.

The legacy GameState model is deprecated and will be removed during the
migration process.

---

## Runtime Structure

GameSession

- scenario
- world
- state
- player
- settings
- statistics

RuntimeState

- time
- timeline
- pendingActions

---

## Consequences

### Positive

- Single source of truth
- Simpler save/load architecture
- Cleaner APIs
- Consistent data flow
- Easier testing
- Lower coupling

### Negative

- Requires migration of existing UI and systems.
- Legacy APIs are removed.

---

## Migration Strategy

Migration is performed incrementally.

Each migration removes one legacy dependency.

No compatibility layer will be added.

Once a subsystem has been migrated,
legacy code should be removed instead of maintained.

---

## Principles

- One runtime model
- One initialization pipeline
- One world model
- No duplicated ownership
- No legacy compatibility layer
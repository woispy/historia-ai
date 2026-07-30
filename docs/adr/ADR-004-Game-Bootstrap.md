# ADR-004 - Game Bootstrap Architecture

## Status

Accepted

## Date

2026-07-30

---

## Context

As the engine architecture evolved, creating a playable game session required
multiple independent steps:

1. Load a scenario.
2. Validate the scenario.
3. Create the runtime world.
4. Create the game session.

Calling these systems manually from different parts of the application would
duplicate logic and make future changes more difficult.

A single entry point was needed.

---

## Decision

Introduce a dedicated GameBootstrap layer.

GameBootstrap is responsible only for orchestrating the engine startup
pipeline.

It does not contain simulation logic, game rules, economy, diplomacy,
AI, or rendering.

Its only responsibility is coordinating the initialization process.

Current pipeline:

ScenarioLoader
    ↓
ScenarioValidator
    ↓
WorldFactory
    ↓
GameSession

Future versions may also include:

ScenarioLoader
    ↓
ScenarioValidator
    ↓
ModLoader
    ↓
SaveLoader
    ↓
WorldFactory
    ↓
GameSession

---

## Consequences

### Positive

- Single engine entry point.
- Easier testing.
- Centralized startup logic.
- Cleaner architecture.
- Future systems can be added without changing application code.

### Negative

- Adds one orchestration layer.
- Startup pipeline becomes more explicit.

---

## Alternatives Considered

### Creating the session manually

Rejected because every caller would need to duplicate:

- loading
- validation
- world creation
- session creation

### Putting bootstrap logic into GameSession

Rejected because GameSession represents runtime state,
not engine initialization.

Keeping orchestration separate follows the Single Responsibility Principle.

---

## Notes

GameBootstrap should remain intentionally small.

Its responsibility is orchestration only.

Gameplay systems such as:

- Economy
- Population
- Diplomacy
- War
- AI
- Events

must never be implemented inside GameBootstrap.
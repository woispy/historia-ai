# Historia AI

Historia AI is a data-driven grand strategy engine focused on historical simulation.

The long-term goal is to provide a flexible engine capable of running multiple historical scenarios while remaining highly moddable.

---

# Vision

Historia AI separates:

- Engine
- Game Data
- Runtime
- User Interface

This allows gameplay content to evolve independently from the engine itself.

---

# Current Architecture

GameBootstrap
    ↓
ScenarioLoader
    ↓
ScenarioValidator
    ↓
WorldFactory
    ↓
GameSession
    ↓
GameEngine (planned)

---

# Folder Structure
src/
engine/
world/
state/
scenarios/

data/
scenarios/

docs/
adr/

---

# Current Status

## Foundation

- ✅ GameSession
- ✅ ScenarioDefinition
- ✅ ScenarioLoader
- ✅ ResourceLoader
- ✅ ScenarioValidator
- ✅ WorldFactory
- ✅ GameBootstrap

---

# Roadmap

Phase 1 — Foundation ✅

Phase 2 — Runtime

- GameEngine
- Time System
- Save / Load

Phase 3 — Simulation

- Economy
- Population
- Trade
- Diplomacy
- War

Phase 4 — Characters

- Dynasty
- Rulers
- Advisors
- Generals

Phase 5 — Artificial Intelligence

- Country AI
- Military AI
- Economic AI
- Diplomatic AI

---

# Design Principles

- Data-driven architecture
- Immutable scenario definitions
- Mutable runtime world
- Small, focused modules
- Single Responsibility Principle
- Engine-first development

---

# Contributing

Every feature is implemented in small, self-contained architectural sprints.

Each sprint should:

- Solve one responsibility.
- Keep the project buildable.
- Preserve architectural consistency.

<!-- P1 CI trigger: historical political map suite follows the current head. -->

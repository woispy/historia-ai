# Historia AI Architecture

Version: 1.0

---

# Purpose

Historia AI is not designed as a single historical strategy game.

Its primary objective is to build a reusable historical simulation engine capable of supporting multiple historical scenarios, modular gameplay systems and long-term extensibility.

Every architectural decision is made with maintainability, scalability and separation of responsibilities in mind.

---

# Core Philosophy

The engine is built before the game.

Gameplay systems must never dictate engine architecture.

Instead, the engine provides reusable systems capable of supporting different historical periods and future expansions.

Examples include:

- 1300 – Rise of the Ottomans
- 1453 – Fall of Constantinople
- 1914 – The Great War
- Community-created scenarios

---

# Architectural Layers

Historia AI follows a layered architecture.

```
User Interface

↓

Render Engine

↓

Query Layer

↓

World Model

↓

Game Systems

↓

Scenario Data
```

Each layer has a single responsibility.

Communication always flows downward.

Lower layers never depend on upper layers.

---

# Layer Responsibilities

## User Interface

Location

```
src/components/
```

Responsibilities

- User interaction
- Menus
- Panels
- HUD
- Windows
- Overlay

Rules

- Never modifies world data directly.
- Never contains gameplay logic.

---

## Render Engine

Location

```
src/map/
```

Responsibilities

- Rendering the world
- SVG rendering
- Province rendering
- Camera
- Zoom
- Selection
- Visual effects

Rules

- Reads world data.
- Never modifies world state.

---

## Query Layer

Location

```
src/world/queries/
```

Responsibilities

Read-only access to world data.

Examples

- getProvince()
- getCountry()
- getCity()
- getTerrain()

Rules

- No mutations.
- No side effects.

---

## Mutation Layer

Location

```
src/world/mutations/
```

Responsibilities

Controlled world modifications.

Examples

- setCityUnderSiege()
- changeProvinceOwner()

Rules

- Never render UI.
- Never contain business logic.

---

## World Model

Location

```
src/world/
```

Responsibilities

Stores every entity in the simulation.

Examples

- Countries
- Provinces
- Cities
- Armies
- Diplomacy
- Terrain

Rules

Contains data only.

No React.

No rendering.

---

## Game Systems

Location

```
src/systems/
```

Responsibilities

Simulation rules.

Examples

- Economy
- Military
- Diplomacy
- AI
- Timeline
- Population
- Trade

Rules

Game systems operate on the World Model.

---

## Scenario Data

Location

```
data/
```

Responsibilities

Historical content.

Examples

```
data/

scenarios/

1300/

1453/

1914/
```

Contains

- Countries
- Armies
- Population
- Economy
- Religion
- Culture

Rules

Contains data only.

No code.

---

# Data Flow

```
Scenario

↓

World

↓

Systems

↓

Queries

↓

Render Engine

↓

User Interface
```

The UI never reads raw data directly.

All access should go through the Query Layer.

---

# Rendering Pipeline

```
GameShell

↓

MapView

↓

WorldMap

↓

Layers

↓

Province

↓

SVG
```

Future layers include

- Province Layer
- Country Layer
- City Layer
- Army Layer
- Route Layer
- Effect Layer
- UI Layer

---

# Design Principles

## Single Responsibility Principle

Every module should have one responsibility.

---

## Separation of Concerns

Rendering, simulation and data must remain independent.

---

## Data Driven Design

Historical content belongs inside data files.

Engine code must remain reusable.

---

## Modular Architecture

Every system should be independently replaceable.

---

## Incremental Development

Development follows small, testable milestones.

---

## Documentation First

Every major system must have documentation before implementation.

---

# Folder Structure

```
historia-ai/

docs/
public/
src/
data/

package.json
vite.config.js
```

Future folders

```
tests/
tools/
scripts/
```

---

# Long-Term Goals

The engine should support

- Multiple historical scenarios
- AI-driven world simulation
- Save & Load
- Modding
- Map Editor
- Localization
- Dynamic historical events
- Multiplayer-ready architecture

---

# Development Workflow

Every sprint follows the same workflow.

1. Define objective

2. Design architecture

3. Identify affected files

4. Review existing implementation

5. Update complete files

6. Test

7. Git Commit

No implementation should skip this process.

---

# Conclusion

Historia AI is developed as a reusable grand strategy engine rather than a single game.

Long-term maintainability always takes priority over short-term implementation speed.
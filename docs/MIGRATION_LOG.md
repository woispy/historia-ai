# Historia AI — Migration Log

This document records structural migrations in Historia AI.

## Migration 1 — GameSession Runtime

Status: **Completed**

The application now creates a `GameSession` through `createGame()` and stores it as the active runtime object.

Pipeline:

```text
NewGame
  ↓
Validation
  ↓
Scenario Loader
  ↓
World Bootstrap
  ↓
RuntimeState
  ↓
GameSession
  ↓
Current Game
  ↓
Save
```

## Migration 2 — Runtime Simulation

Status: **Completed**

Runtime information is owned by `GameSession.runtime` / `RuntimeState`.

Implemented simulation processors:

- Time
- Player actions
- Economy
- Population
- Diplomacy
- Military
- Events
- Timeline

## Migration 3 — World Runtime

Status: **Completed**

World information is exposed through `GameSession.world`, including repositories for countries, cities, provinces, characters, families, knowledge and selection, plus map geometry.

## Migration 4 — Map Rendering

Status: **Completed / Iterating**

The map uses a single SVG rendering root with camera and layer composition. Generated Geometry Assets are loaded through the Geometry Runtime rather than the legacy importer.

## Migration 5 — Legacy Cleanup

Status: **Completed for the current migration scope**

Removed obsolete compatibility code:

- `src/world/map/ProvinceFactory.js`
- `src/world/map/importer/*`
- obsolete `GeometryFactory`
- legacy Province bootstrap helper

## Migration 6 — Living Scenario Foundation

Status: **Completed / Foundation**

The 1300 scenario now has playable Ottoman and Byzantine country definitions and a working scenario selection flow. The runtime initializes treasury, stability, prestige, population and military power from scenario data.

The turn engine now supports:

- 1 week
- 1 month
- 6 months
- 1 year
- arbitrary day-based advancement through the Action API

Player actions can currently affect:

- taxation
- construction
- diplomacy
- attacks and sieges

The simulation also generates economic, population, diplomatic, military and event consequences over time.

## Architectural Rules

1. `GameSession` is the root runtime object.
2. Runtime state belongs only to `GameSession.runtime`.
3. World state belongs only to `GameSession.world`.
4. Scenario data remains immutable source data.
5. Generated map assets are separated from gameplay entities.
6. Simulation processors operate on sessions and return the next session.
7. New gameplay systems must not reintroduce the legacy `GameState` model.

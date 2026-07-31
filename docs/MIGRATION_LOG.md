# Historia AI - Migration Log

This document records every architectural migration performed during the
development of Historia AI.

Unlike the CHANGELOG, this document focuses on structural and architectural
changes rather than gameplay features.

Each migration should leave the project in a fully buildable state.

Legacy code is removed progressively instead of being maintained through
compatibility layers.

---

# Migration 1 — GameShell → GameSession

Status: Planned

## Objective

Replace the legacy GameState initialization with the new GameSession runtime
pipeline.

## Scope

- GameShell
- GameBootstrap
- Runtime initialization

## Expected Result

- GameSession becomes the application's runtime object.
- createGame() becomes the only initialization entry point.
- createInitialGameState() is no longer used.

## Legacy Removed

- Legacy GameState initialization pipeline

## Commit

(Not yet)

---

# Migration 2 — Runtime Systems

Status: Planned

## Objective

Move every runtime system to RuntimeState.

## Scope

- ActionSystem
- TurnSystem
- RuntimeState

## Expected Result

Every gameplay system reads and writes through:

GameSession.state

instead of

GameState

## Legacy Removed

- GameState runtime ownership

## Commit

(Not yet)

---

# Migration 3 — World Systems

Status: Planned

## Objective

Move world rendering to the GameSession model.

## Scope

- MapView
- WorldMap
- World hooks

## Expected Result

All world information is accessed through:

GameSession.world

## Legacy Removed

- gameState.world

## Commit

(Not yet)

---

# Migration 4 — User Interface

Status: Planned

## Objective

Remove legacy runtime props from UI components.

## Scope

- TopBar
- OverlayManager
- GameShell UI

## Expected Result

UI components receive:

session

instead of individual runtime values.

## Legacy Removed

- currentDate
- timeline
- pendingActions
- gameState props

## Commit

(Not yet)

---

# Migration 5 — Legacy Cleanup

Status: Planned

## Objective

Remove every remaining legacy runtime component.

## Scope

- GameState
- createInitialGameState
- Legacy imports
- Deprecated helpers

## Expected Result

GameSession becomes the only runtime model.

## Legacy Removed

Everything related to GameState.

## Commit

(Not yet)

---

# Migration Principles

Every migration must satisfy the following rules.

1. The project must remain buildable.

2. Legacy code is removed instead of preserved.

3. No compatibility layer is introduced.

4. Every subsystem has a single owner.

5. GameSession is the only runtime model.

6. Runtime information belongs only to RuntimeState.

7. World information belongs only to World.

8. New systems must never depend on GameState.
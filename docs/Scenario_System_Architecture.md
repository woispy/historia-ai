# Scenario System Architecture

Version: 1.0

---

# Purpose

The Scenario System is responsible for providing the historical content used by the Historia AI engine.

The engine itself should never contain historical data.

Instead, every playable world is created from a scenario.

Examples include:

- 1300 – Rise of the Ottomans
- 1453 – Fall of Constantinople
- 1914 – The Great War
- Community-created scenarios

This separation allows the engine to remain reusable while historical content stays completely data-driven.

---

# Core Philosophy

The Scenario System does not simulate the world.

It only describes the initial state of the world.

The simulation begins only after the scenario has been loaded into the engine.

Scenario

↓

World

↓

Simulation

↓

Rendering

---

# Responsibilities

The Scenario System is responsible for:

- Loading scenario data
- Validating scenario files
- Preparing data for the engine
- Providing the initial world state

The Scenario System is NOT responsible for:

- Simulation
- Rendering
- AI
- Economy
- Military logic
- Diplomacy logic

---

# Scenario Lifecycle

The complete loading process follows this pipeline.

Game Start

↓

Scenario Loader

↓

Scenario Validator

↓

Scenario Factory

↓

World Factory

↓

Game Systems

↓

Render Engine

---

# Components

## Scenario Loader

Location

```
src/scenarios/ScenarioLoader.js
```

Responsibilities

- Load scenario files
- Read data from the data directory
- Merge scenario resources
- Return raw scenario data

Rules

- Never creates world objects.
- Never performs validation.
- Never modifies data.

---

## Scenario Validator

Location

```
src/scenarios/ScenarioValidator.js
```

Responsibilities

- Validate scenario structure
- Check required files
- Detect invalid references
- Report missing entities

Examples

- Missing country
- Invalid province id
- Missing capital
- Duplicate identifiers

Rules

The validator reports problems.

It never fixes them automatically.

---

## Scenario Factory

Location

```
src/scenarios/ScenarioFactory.js
```

Responsibilities

Convert validated scenario data into a structure expected by the engine.

Future responsibilities may include:

- Default values
- Version migrations
- Compatibility support
- Performance preprocessing

Rules

Factory creates engine-ready scenario objects.

It never performs simulation.

---

# Relationship with World

The World is generated from a scenario.

The World never knows where the data came from.

Possible sources include:

- Historical scenario
- Save file
- Random world generator
- Multiplayer session
- Future editor

This keeps the World completely independent.

---

# Scenario Structure

Future scenarios will be stored under:

```
data/

scenarios/

1300/

1453/

1914/
```

Each scenario may contain independent data files.

Example

```
1300/

scenario.json

countries.json

cities.json

provinces.json

armies.json

population.json

economy.json

religions.json

cultures.json

laws.json

diplomacy.json
```

This modular structure allows individual systems to evolve independently.

---

# Scenario Metadata

Every scenario should include metadata.

Example

```json
{
  "id": "1300",
  "name": "Rise of the Ottomans",
  "startDate": "1300-01-01",
  "version": 1
}
```

Future metadata may include:

- Description
- Authors
- Supported engine version
- Required mods
- Optional mods
- Preview image

---

# Validation Rules

A valid scenario should guarantee:

- Every country exists.
- Every province has a valid owner.
- Every city belongs to an existing province.
- Every army belongs to an existing country.
- Every identifier is unique.

The engine should never start with invalid scenario data.

---

# Save Game Compatibility

Saved games should behave like scenarios.

Instead of creating a new loading pipeline, save files will reuse the Scenario System.

Game Start

↓

Scenario

or

Save File

↓

Scenario Factory

↓

World Factory

↓

Simulation

This minimizes duplicated logic.

---

# Mod Support

The Scenario System is designed to support community-created content.

Future mods may:

- Replace scenarios
- Extend scenarios
- Override data
- Add countries
- Add provinces
- Add events

The engine should not require code changes to load valid scenario mods.

---

# Future Expansion

The Scenario System is expected to support:

- Multiple start dates
- Alternative history
- Randomized scenarios
- Dynamic campaigns
- Generated worlds
- Historical bookmarks

No engine redesign should be required.

---

# Design Principles

The Scenario System follows the same engineering principles as the rest of Historia AI.

- Data-driven design
- Single Responsibility Principle
- Layered architecture
- Modular design
- Extensibility
- Validation before execution

---

# Conclusion

The Scenario System separates historical content from engine logic.

The engine focuses on simulation.

The Scenario System focuses on historical data.

This separation ensures that Historia AI remains scalable, maintainable and capable of supporting multiple historical experiences without changing the core engine.
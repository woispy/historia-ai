# Historia AI Architecture

Version: 2.0
Status: Active architecture reference
Last reviewed: 2026-09-17

---

## Purpose

Historia AI is a reusable historical grand-strategy simulation engine. The architecture is designed for multiple historical scenarios while keeping historical evidence, physical geography, simulation state, runtime representation, and rendering concerns separate.

The current production direction is the **1326 scenario**, beginning on **1326-04-07** after the conquest of Bursa. The 1300 map pipeline remains available only as legacy/forensic material during migration and must not be copied into the 1326 canonical world.

---

## Core Architectural Rules

1. **Historical evidence is not runtime geometry.**
2. **Physical geography is not political geography.**
3. **Province identity is not polygon identity.**
4. **Renderer/GPU data is a representation, never an authority.**
5. **Candidate geometry is not canonical geometry.**
6. **Historical uncertainty must remain explicit in data.**
7. **Static canonical data is immutable at runtime; simulation state is mutable.**
8. **No migration step may silently reuse 1300 geometry for 1326.**
9. **Forensic tooling must not mutate production authority.**
10. **No destructive cleanup is allowed until provenance is established. SAFE TO DELETE = 0.**

The canonical evidence flow is:

```text
Historical Evidence
        ↓
Historical Anchor Graph (T3-A)
        ↓
Candidate Political Surface (T3-B)
        ↓
Physical / Route / Terrain Constraints
        ↓
Boundary Solver
        ↓
Authoritative Arcs
        ↓
Directed Rings
        ↓
Full Face Assembly
        ↓
PlanarTopology / Euler Validation
        ↓
Cartography
        ↓
Canonical GIS
        ↓
MapBin / GPU Transport
        ↓
Runtime Renderer
```

The evidence lifecycle is:

```text
Evidence → Candidate → Reviewed → Canonical
```

---

# Architecture Layers

## 1. Historical Evidence Layer

Locations include:

```text
data/historical/
data/gis/1326/
```

Responsibilities:

- Historical source registers
- Historical map evidence
- Date-specific political evidence
- Historical city/settlement anchors
- Provenance and confidence
- Evidence reconciliation

This layer describes what the historical record supports. It does not directly define renderable polygons.

---

## 2. Historical Anchor Graph — T3-A

The Anchor Graph is the bridge between evidence and candidate political geometry.

A node may contain:

- anchor ID
- scenario/date
- controller
- historical region
- location
- extent confidence
- controller confidence
- provenance
- physical constraints
- strategic routes
- frontier status

Edges use a controlled vocabulary such as:

```text
POLITICAL_ADJACENCY
FRONTIER
REGIONAL_PROXIMITY
ROAD_CORRIDOR
RIVER_CORRIDOR
MOUNTAIN_BARRIER
LAKE_BARRIER
COASTAL_ACCESS
STRATEGIC_PASS
STRATEGIC_CROSSING
```

Confidence is independent by evidence type. A city can have high location confidence while its exact historical political extent remains medium or low confidence.

---

## 3. Physical Geography Authority

Physical geography is an independent authority layer.

It includes:

- physical land polygons
- lakes and hydrography
- rivers
- terrain/DEM
- mountain and ridge constraints
- route/cost fields

Political geometry may be constrained by physical geography, but physical geography must never be inferred from political geometry.

Lake interiors are not physical land. Geometry-boundary recovery may use shoreline semantics, but final geometry must satisfy the final physical-land contract.

---

## 4. Candidate Political Surface — T3-B

T3-B reconstructs a date-specific political surface from historical evidence and constraints.

Conceptually:

```text
Anchor Graph
    ↓
Weighted Partition
    ↓
Historical Constraints
    ↓
Physical Clipping
    ↓
Frontier / Route Constraints
    ↓
Province Candidates
```

Outputs are **candidate** data until review and authoritative gating are complete.

Voronoi/power-cell methods are computational mechanisms only. They are not historical authority and must not be used as visual filler where historical boundary evidence is absent.

---

## 5. Province Model

A province has at least three distinct identities:

```text
Province Identity
      ≠
Historical Surface
      ≠
Runtime Geometry
```

A province can therefore retain stable simulation identity while its date-specific political surface evolves.

Historical city anchors are not modern administrative boundaries.

---

## 6. Topology and Boundary Solver

The production topology chain is:

```text
Cost / A*
   ↓
Authoritative Arc
   ↓
Directed Rings
   ↓
Full Face Assembly
   ↓
PlanarTopology
   ↓
Euler = 2
   ↓
Cartography
```

P6.1 provides candidate physical/historical adjacency diagnostics. P6.2 provides terrain, river, and boundary-solver contracts. These components remain separately testable and are not automatically canonical political geography.

---

## 7. Canonical GIS / Build Layer

The GIS build layer converts reviewed historical candidates into canonical runtime assets only after authority gates pass.

Legacy 1300 generation remains useful for forensic reproduction. It is not the 1326 production source.

Generated runtime GIS assets are build artifacts unless explicitly approved as distributable source data.

---

## 8. MapBin Transport Layer

The map runtime uses a versioned binary representation:

```text
Historical Runtime JSON
        ↓
MapBin Encoder
        ↓
world.mapbin
        ↓
MapBin Loader
        ↓
BinaryMapAssetSource
```

The current MapBin implementation uses typed arrays and zero-copy runtime views. Geometry transport is a performance representation and must not become the source of historical truth.

The binary layer is also a forensic boundary: any historical geometry anomaly must be traceable across JSON → encoder → binary bytes → decoder before the GPU layer is blamed.

---

## 9. GPU / Rendering Layer

The renderer consumes immutable runtime representations.

Responsibilities:

- camera and world wrap
- visibility/culling
- GPU buffers
- province rendering
- terrain rendering
- selection/picking
- LOD
- diagnostics

The GPU layer must not invent or repair historical political boundaries.

The 144 Hz work is benchmark evidence for the tested environment, not a universal hardware guarantee.

---

## 10. Runtime Simulation Layer

Simulation remains independent from GIS production.

Planned/active domains include:

- time
- population
- economy
- trade
- diplomacy
- warfare
- laws and reforms
- dynasty and characters
- religion and culture
- espionage
- events and timeline
- AI-controlled states

Simulation state is mutable. Scenario definitions and canonical map data are immutable inputs.

---

## 11. User Interface Layer

UI consumes queries and runtime state rather than mutating world data directly.

Responsibilities:

- game shell
- map controls
- province/country panels
- decisions and actions
- timeline/event notifications
- AI interaction panel

No UI component is a source of historical geography authority.

---

# Performance Architecture

The long-term target is 15,000+ active provinces with high visual fidelity and a 144+ FPS target on suitable hardware.

The architecture therefore favors:

- immutable canonical data
- visible-subset processing
- multiresolution geometry
- typed-array transport
- deterministic builds
- GPU-side culling where appropriate
- bounded allocations
- reusable buffers
- explicit lifecycle ownership
- zero-copy binary views where safe

The 15K target does **not** imply that every high-resolution polygon must be resident in every GPU pass.

---

# Memory / Lifecycle Rules

Every long-lived resource must have an explicit owner and release path.

Avoid:

- per-frame object creation for stable geometry
- duplicated polygon copies across layers
- uncontrolled event listeners
- stale GPU buffers
- repeated ArrayBuffer cloning
- hidden caches without invalidation policy

Canonical data must be treated as immutable. Runtime caches may be evicted or rebuilt without changing canonical truth.

---

# Scenario Architecture

The first production scenario is:

```text
1326-04-07
```

The initial historical focus is Anatolia/Byzantine frontier geography, while the world scenario remains extensible.

Historical timing must be represented explicitly. For example, Bursa is available to the Ottoman state at the scenario opening, while Nicaea and Nicomedia have later historical transitions and must not be backdated into the 1326 state.

Scenario data should remain separate from the reusable engine.

---

# Migration / Forensic Governance

Migration follows this order:

```text
B4
 ↓
A1 / A2 / C forensic closure
 ↓
EARG / T3-A
 ↓
T3-B candidate surface
 ↓
Physical authority migration
 ↓
Boundary / topology solver
 ↓
1326 candidate geometry
 ↓
1586 shadow comparison
 ↓
Authoritative GIS gate
 ↓
Single canonical map
 ↓
Local convergence
```

Current forensic policy:

- B4 calibration is forensic-only.
- A1 remains a provenance/stage-lineage investigation.
- A2 current runtime → MapBin → GPU → LOD replay is cleared for the reported anomaly; the historical `2.27e-13` artifact remains unresolved at the producer/provenance lineage level.
- C requires a real Amasya Edge-3 replay and authoritative binding, not merely a semantic unit test.
- `MIN_AREA = 0.00005` remains locked until forensic closure.
- No 1300 → 1326 geometry copying.
- No synthetic Voronoi filler as production authority.
- SAFE TO DELETE = 0.

---

# Repository Workflow

Every significant change follows:

1. Define the objective.
2. Identify the authority boundary.
3. Inspect existing implementation and history.
4. Identify affected files and provenance.
5. Implement the smallest isolated change.
6. Run focused tests.
7. Run relevant CI gates.
8. Compare canonical and candidate outputs.
9. Record evidence and update documentation.
10. Merge only when the authority gate is satisfied.

Branches used for forensic experiments are laboratories. The canonical integration branch is the production integration line.

---

# Documentation Rule

Documentation is part of the architecture contract.

When implementation changes materially, the corresponding Markdown documentation must be reviewed in the same work cycle.

Stale documents must be corrected rather than silently treated as current.

---

# Long-Term Goals

- 15,000+ provinces
- dynamic population and economy
- historical events and timelines
- AI-driven world simulation
- detailed map layers
- high-fidelity character and world presentation
- save/load
- modding
- localization
- multiplayer-ready boundaries between systems

The architecture should achieve these goals without sacrificing historical provenance or turning rendering code into historical authority.

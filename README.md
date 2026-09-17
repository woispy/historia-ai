# Historia AI

Historia AI is a data-driven grand-strategy simulation engine focused on historical simulation, historical geography, and long-running dynamic world state.

The long-term goal is a reusable, highly moddable engine capable of supporting multiple historical scenarios without coupling historical content to rendering or simulation implementation.

---

# Vision

Historia AI separates four major concerns:

- **Engine** — reusable simulation and runtime infrastructure
- **Game Data** — historical scenario and evidence data
- **Runtime** — mutable game state and efficient map representations
- **User Interface** — player interaction and presentation

The map architecture adds an explicit fifth boundary inside the data/runtime flow:

- **Historical / Physical Authority** — evidence, terrain, hydrography and reviewed geographic truth

Rendering consumes representations of that truth; it does not define it.

---

# Current Production Scenario

The production migration target is:

```text
1326-04-07
```

This is the post-conquest Bursa starting state. The 1300 pipeline remains as legacy/forensic material and must not be used as a silent fallback for 1326.

---

# Current Architecture

```text
Historical Evidence
        ↓
Anchor Graph (T3-A)
        ↓
Candidate Political Surface (T3-B)
        ↓
Physical / Terrain / Hydrography Constraints
        ↓
Boundary Solver
        ↓
Authoritative Arcs
        ↓
PlanarTopology / Cartography
        ↓
Canonical GIS
        ↓
MapBin
        ↓
GPU / WebGL / WebGPU Runtime
        ↓
UI + Simulation Queries
```

The evidence lifecycle is:

```text
Evidence → Candidate → Reviewed → Canonical
```

Historical political geography, physical geography, province identity and GPU geometry are intentionally separate concepts.

---

# Repository Areas

```text
data/
  historical/       Historical evidence and provenance
  gis/1326/         1326 GIS manifests and candidate data
  scenarios/       Scenario definitions

docs/               Architecture and migration documentation
adr/                Architectural decisions
src/world/          World model and runtime state
src/systems/        Simulation systems
src/map/            Map runtime and rendering
tools/              GIS/build/validation/forensic tooling
.github/workflows/  CI contracts and gates
```

---

# Map Architecture Status

### Established

- Historical evidence and provenance separation
- Physical land / hydrography / terrain authority boundaries
- P6.1 adjacency candidate graph and telemetry
- P6.2 terrain, river and boundary-solver contracts
- deterministic MapBin transport
- immutable zero-copy binary runtime views
- GPU province pack infrastructure
- 15K-scale and rendering diagnostics
- 144 Hz benchmark evidence on the tested hardware configuration

### Under controlled migration

- A1 provenance closure
- A2 historical `2.27e-13` artifact provenance/stage-lineage closure; the currently replayed runtime → MapBin → GPU → LOD path is cleared for the anomaly
- C / Amasya Edge-3 authoritative binding
- shared physical authority extraction
- EARG / T3-A integration
- T3-B 1326 candidate political surface
- authoritative GIS gate

### Locked rules

- `MIN_AREA = 0.00005` remains unchanged during forensic work.
- No synthetic Voronoi/fallback geometry as historical authority.
- No 1300 → 1326 geometry copy.
- No production authority mutation from forensic tooling.
- `SAFE TO DELETE = 0` until provenance establishes otherwise.

---

# Simulation Roadmap

The reusable engine is intended to support:

- Time progression
- Population
- Economy
- Trade
- Diplomacy
- Warfare
- Laws and reforms
- Dynasty and characters
- Religion and culture
- Espionage
- Historical events and timeline
- Country AI
- Military AI
- Economic AI
- Save / Load
- Modding
- Localization

Simulation state is mutable. Scenario definitions and canonical map data are immutable inputs.

---

# Performance Direction

The long-term target is **15,000+ provinces** with high map detail and a **144+ FPS target on suitable hardware**.

The performance strategy is not to render every high-resolution polygon every frame. It uses:

- multiresolution geometry
- visible-subset processing
- typed arrays
- deterministic builds
- GPU culling where appropriate
- bounded allocations
- explicit resource ownership
- reusable buffers
- zero-copy binary views where safe

The existing 144 Hz benchmark is evidence for its tested environment, not a universal hardware guarantee.

---

# Development Discipline

Every substantial change should:

1. Define the objective.
2. Identify the authority boundary.
3. Inspect current implementation and history.
4. Check related branches, commits and CI evidence.
5. Make the smallest isolated change.
6. Run focused tests.
7. Run relevant CI gates.
8. Record provenance/evidence.
9. Update affected documentation.
10. Merge only after the appropriate gate passes.

Forensic branches are laboratories. The integration branch is the canonical integration line.

---

# Current Migration Order

```text
B4
 ↓
A1 / A2 / C forensic closure
 ↓
EARG / T3-A
 ↓
T3-B
 ↓
Physical Authority
 ↓
Boundary / Topology Solver
 ↓
1326 Candidate Surface
 ↓
1586 Shadow Comparison
 ↓
Authoritative GIS Gate
 ↓
Single Canonical Map
 ↓
Local Convergence
```

This order is intentional: historical geometry is not promoted to canonical status until its evidence, physical constraints, topology and validation gates are traceable.

---

# Documentation Policy

Markdown documentation is treated as part of the engineering contract. When architecture or migration state changes materially, the corresponding documentation must be updated in the same work cycle.

For current architectural truth, see `docs/ARCHITECTURE.md`.

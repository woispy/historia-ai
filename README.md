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


### Production pipeline finding — 2026-09-18

A concrete Phase A mismatch was identified independently of the parked A2 forensic work: the canonical `build` path still invokes the legacy 1300 GIS importer, and the MapBin builder defaults to the 1300 runtime when no explicit input is supplied. Because production is defined as 1326-04-07, this must be repaired before 1326 geometry can be treated as a production build input. GitHub Issue #107 tracks the fail-closed 1326 source/build migration. No 1300 geometry is being copied into 1326.
The Phase A build contract is recorded in `docs/PHASE_A_1326_PRODUCTION_BUILD_CONTRACT.md`. The MapBin builder now requires an explicit runtime input, while `build:legacy-map` is the named 1300 path and `build:production` is fail-closed until the provenance-qualified 1326 runtime exists.

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
- A2 historical anomaly remains a forensic/provenance discontinuity; the replayed runtime → MapBin → GPU → LOD path is cleared for the anomaly, and the unresolved numeric observation is parked rather than treated as a production target
- C / Amasya Edge-3 authoritative binding
- shared physical authority extraction
- EARG / T3-A integration
- T3-B 1326 candidate political surface
- authoritative GIS gate

### A2 forensic truth as of 2026-09-17

The historical A2 observation is classified as a **provenance discontinuity**, not a demonstrated renderer/GPU normalization failure. The pinned V15 forensic source at `3575c1bccf94a322fed175958ce786531b142497` was instrumented by the retained A2 telemetry harness and produced an Amisos raw/normalized area of `0.5023951571206453`, with no collapse below `MIN_AREA`. A separate canonical stage trace reproduced the historical `0.006755373858482017` raw cell, but also produced no tiny-area hit. The telemetry harness itself operates on the pinned V15 source tree and records the V15 `partition-raw` → `normalize-output` chain; its captured raw value is therefore a different geometric lineage from the canonical `0.006755...` observation. The repository does not contain a producer record that demonstrates `0.006755... → ~2.27e-13`. Therefore the remaining task is to identify the historical artifact/representation that supplied the tiny-area observation and reconcile its provenance before any production mutation is considered.

### A2 forensic correction

The earlier migration wording that described a direct `0.006755 → ~2.27e-13` V15 normalization collapse is **not supported by the current artifact evidence**. PR #89's telemetry workflow explicitly pins the V15 source tree and runs the instrumented V15 builder, while the resulting telemetry records the `0.5023951571206453` Amisos raw/normalized polygon. The `0.006755373858482017` value comes from the separate canonical stage trace. These observations must remain separate until a common source artifact and transformation lineage is proven.

### A2 Run #24 artifact verification

The historical execution associated with PR #89's **Run #24** was traced to GitHub Actions workflow run `34398688728` (workflow run number `11`) on head `78c70ec516852c461c42ceee18c7e64e904843ac`. Its retained artifact `phase2.8-c-a2-amisos-edge-telemetry` is still available and has digest `sha256:cc697c0973a5a8ed4efb8b305dba013f782b9f85d03a91a5588ee734663920f9`. The artifact records the pinned V15 source SHA `3575c1bccf94a322fed175958ce786531b142497`, `rawArea = 0.5023951571206453`, `normalizedArea = 0.5023951571206453`, and `collapseObserved = false`. Therefore the exact retained Run #24 artifact does **not** contain the claimed `~2.27e-13` collapse. This is stronger evidence that the `~2.27e-13` observation originated from a different historical artifact, representation, or execution lineage that has not yet been identified. The provenance search remains open; no production mutation is authorized by this finding.

### A2 forensic disposition — 2026-09-18

The historical `~2.27e-13` observation is not reproduced by the retained canonical producer, V15 producer, checkpoint replay, MapBin/runtime, or GPU evidence. It is therefore **not a production acceptance target**. The forensic evidence remains retained, but further producer archaeology is parked unless new evidence identifies the original artifact/execution or a reproducible production failure depends on it. Production work resumes on the source → importer → dataset builder → authority validator → publisher → runtime chain for the 1326 scenario.

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

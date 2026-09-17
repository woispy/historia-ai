# Historia AI Roadmap

---

# Phase 1 — Foundation ✅

- [x] GameSession
- [x] ScenarioDefinition
- [x] ScenarioLoader
- [x] ResourceLoader
- [x] ScenarioValidator
- [x] WorldFactory
- [x] GameBootstrap

---

# Phase 2 — Map & Historical GIS Foundation 🚧

## Phase 2A — GIS core ✅

- [x] World 1300 historical GIS source integration
- [x] Physical land / sea authority
- [x] Source-derived province runtime layer
- [x] Province topology and adjacency
- [x] Province/country border hierarchy
- [x] EU5-inspired zoom LOD
- [x] City hierarchy and camera focus

## Phase 2B — Anatolia reconstruction ✅

- [x] Ten-region 1300 Anatolia reconstruction vocabulary
- [x] Bithynia / Byzantine urban core
- [x] Sangarios / Ottoman frontier
- [x] Mysia / Karasi
- [x] Lydia / Ionia / Saruhan context
- [x] Caria / Menteşe
- [x] Inner Western Anatolia / Germiyan / Hamid / Eşref context
- [x] Central Anatolia / Karaman / Ilkhanid suzerainty context
- [x] Pontus / Pervâneoğulları / Candar / Trebizond context
- [x] Eastern Anatolia / Ilkhanid frontier context
- [x] Cilicia / Taurus context
- [x] Historical confidence and temporal ownership rules
- [x] City-to-province cartographic identity
- [x] Dedicated Phase 2B validation suite

## Phase 2C — Province geography refinement metadata ✅

- [x] Stable WGS84 anchors for every Phase 2B province
- [x] Terrain, movement, defence, winter, agriculture and settlement modifiers
- [x] Symmetric historical adjacency hints
- [x] Strategic passes and movement corridors
- [x] River-crossing anchors
- [x] Physical geography remains authoritative
- [x] Dedicated Phase 2C validation suite

## Phase 2D — Historical province geometry (legacy/research) 🚧

- [x] Replace coarse Anatolia source polygons at runtime (legacy transition output)
- [x] Deterministic 38-province cartographic geometry layer
- [x] Dense land control field
- [x] Historical GIS shape anchors
- [x] Province fill separated from shared topology borders
- [x] Physical coastline barrier field
- [x] Internal sea/lake barrier field
- [x] Political control sites constrained to physical land
- [x] Polygon-centroid physical-land validation
- [x] Higher-density coastal control sampling
- [x] Dedicated Phase 2D validation suite
- [x] CI/build integration
- [ ] Hand-reviewed historical boundary anchors for the most important provinces
- [ ] Province-specific river and mountain boundary constraints
- [ ] Higher-resolution Aegean/Marmara coastal reconstruction
- [ ] Historical city hinterland polygons
- [ ] Final cartographic audit against primary/secondary sources

### Phase 2D rule

The generated geometry is a deterministic cartographic reconstruction, not a claim of medieval cadastral precision. Exact political control remains in the historical metadata layer. Phase 2D is retained for legacy, research and forensic comparison; it is not the production political geometry authority. No new Voronoi, jitter, anchor or fallback feature may be added to promote it.

## Phase 2E — Political Geography Authority v2 ⏳

- [ ] Freeze the Political Geography Authority v2 contract
- [ ] Define physical, political, topology, provenance and political-state authority boundaries
- [ ] Create the `anatolia-1300` 38-province golden dataset fixture
- [ ] Build shared political vertex/edge/face topology
- [ ] Add declared-coverage overlap, internal-gap and shared-edge validation
- [ ] Add provenance, confidence, review status and geometry version validation
- [ ] Compile authoritative geometry/topology/LOD into the map pack
- [ ] Validate owner mutation without geometry rebuild
- [ ] Pass the Authority Promotion Gate before scaling beyond Anatolia

### Phase 2E promotion gate

Phase 2E becomes production authority only when the 38-province proof dataset has zero fallback geometry, zero internal overlap, zero internal gap, complete provenance, deterministic builds, correct picking, physical validation and green CI. Until then, Phase 2D remains legacy/research tooling and no 500+ province migration begins.

The contract is world-compatible from the first implementation. Physical geography, sea/coast/lake/river layers and LOD interfaces must support global coverage even while the first authoritative political dataset is Anatolia and its surroundings.

---

# Phase 3 — Runtime

- [ ] GameEngine
- [ ] Time System
- [ ] Save System
- [ ] Load System

---

# Phase 4 — Simulation

- [ ] Population
- [ ] Economy
- [ ] Production
- [ ] Trade
- [ ] Diplomacy
- [ ] War

---

# Phase 5 — Character Systems

- [ ] Characters
- [ ] Dynasty
- [ ] Government
- [ ] Advisors
- [ ] Generals

---

# Phase 6 — Artificial Intelligence

- [ ] Country AI
- [ ] Military AI
- [ ] Economy AI
- [ ] Diplomacy AI

---

# Phase 7 — User Interface

- [ ] World Map
- [ ] Notifications
- [ ] Panels
- [ ] Menus
- [ ] Tooltips

---

# Long-Term Goals

- Multiple scenarios
- Full mod support
- Save compatibility
- Multiplayer-ready architecture
- Scenario editor
- Modding tools

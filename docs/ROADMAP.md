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

## Phase 2D — Historical province geometry 🚧

- [x] Replace coarse Anatolia source polygons at runtime
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

The generated geometry is a deterministic cartographic reconstruction, not a claim of medieval cadastral precision. Exact political control remains in the historical metadata layer. Future hand-reviewed boundary constraints must modify builder inputs rather than introduce screen-coordinate hacks or a second rendering system.

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

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

# Phase 2 — Map & Historical GIS Foundation ✅

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

## Phase 2C — Province geometry & geography refinement ✅

- [x] Reconcile runtime policy so broad approximate regional overlays no longer compete with source-derived province geometry
- [x] Add stable WGS84 anchors for every Phase 2B province
- [x] Add deterministic broad terrain modifiers
- [x] Add relative historical settlement-density tiers
- [x] Add symmetric historical adjacency hints
- [x] Add strategic passes and major movement corridors as map metadata
- [x] Add selected river-crossing anchors
- [x] Preserve coastline and physical geography as authoritative
- [x] Add dedicated Phase 2C validation suite
- [x] Document the boundary between defensible cartography and future source-backed polygon overrides

### Deferred cartography rule

Individual medieval province polygons will only replace source-derived geometry when a defensible historical geometry source is available. Phase 2C deliberately does not manufacture cadastral-looking borders from uncertain evidence.

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

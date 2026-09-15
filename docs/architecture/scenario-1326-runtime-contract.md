# Historia AI — 1326 Historical Runtime Contract

## Status

Design contract for the canonical playable `1326` scenario.

The production scenario date is **1326-04-07**. The existing `1300` scenario and its historical GIS assets remain reference/legacy material and are not relabeled as 1326.

The engineering stabilization gate is **GREEN**: the current acquisition branch completed the full **83-step** validation/build/scalability workflow successfully on workflow run `35020661408`. The active blocker is therefore no longer CI/lint stabilization; it is authoritative 1326 historical source acquisition, reconciliation, review, and canonical geography production.

## Runtime dependency

A dated scenario is loaded through:

```text
scenario.json
  -> ScenarioLoader
  -> ScenarioValidator
  -> WorldBootstrap
  -> RepositoryBootstrap
  -> HistoricalProvinceRepositoryLoader
  -> HistoricalRuntimeManifestLoader
  -> historical runtime asset
```

`HistoricalRuntimeManifestLoader` normalizes a scenario date to its four-digit year and loads:

```text
src/world/map/assets/historical/{year}/runtime.json
```

The historical province repository requires that runtime asset to contain a `provinces` array. The historical geometry repository consumes the same runtime asset's `geometries` array.

Therefore a `1326` scenario cannot safely be enabled by changing only UI labels or scenario metadata. A valid `1326` historical runtime asset must exist first.

## Required runtime schema

The established historical runtime contract is:

```json
{
  "schemaVersion": 3,
  "assetType": "historical-runtime",
  "historicalDate": "1326-04-07",
  "source": {
    "provider": "...",
    "dataset": "...",
    "projection": "EPSG:4326"
  },
  "counts": {
    "provinces": 0,
    "geometries": 0,
    "polygons": 0
  },
  "provinces": [],
  "geometries": []
}
```

The exact counts are intentionally not populated until the 1326 source evidence has been reconciled and validated.

## 1326 scenario contract

The canonical scenario must use:

```json
{
  "id": "1326",
  "startDate": "1326-04-07",
  "world": "earth"
}
```

The scenario's historical state must represent the world at the scenario start date, not a retrospective reconstruction of later territorial outcomes.

## Bursa opening state

Bursa's 6 April 1326 capture is treated as a completed historical event immediately before the scenario start. At `1326-04-07` the canonical state must therefore represent Bursa as Ottoman-controlled.

The capture should be represented through scenario historical/event data rather than by mutating map geometry at runtime.

The opening player-facing event is:

```text
Bursa'nın Fethi
```

The subsequent capital choice is a game decision/state transition:

```text
Bursa'yı başkent yap
veya
Mevcut merkezi koru
```

The decision must update simulation state; it must not be implemented as narrative-only UI text.

## Data authority rules

1. `1300` data is historical/reference material only.
2. No `1300` polygon is renamed or copied into `1326` merely to fill coverage.
3. Missing historical evidence remains missing until supported by evidence.
4. Political geometry and political control are separate concepts.
5. Geometry is static canonical data; owner/controller/occupation are dynamic state.
6. Provenance and confidence must travel with reconstructed historical geography.
7. The physical map remains independent from political province geometry.
8. The production map must continue to use the established physical/coastline/terrain pipeline rather than a scenario-specific renderer.

## Import pipeline

The legacy `import-1300.js` remains available as a regression/reference path. The year-agnostic `import-historical.js` accepts an explicit year and GeoJSON input and writes an **evidence-only** runtime asset under the requested historical year. It does not promote source polygons to canonical political authority. The separate `acquire-historical-source.js` path records source identity, version, license classification, acquisition metadata, temporal filtering, and an input SHA-256 when provided. fileciteturn595file0

The generic asset builder propagates the requested historical year/date into asset identity and headers. This prevents a future 1326 import from silently producing `1300` asset IDs or metadata while preserving the existing 1300 default behavior of legacy callers.

Example:

```text
pinned source snapshot
      ↓
acquire-historical-source.js
      ↓
1326 temporal evidence
      ↓
Cliopatria candidate extraction
      ↓
entity reconciliation
      ↓
geometry reconciliation
      ↓
canonical political geography
      ↓
production runtime/mapbin
```

Acquisition output remains evidence-only. The source registry explicitly forbids copying 1300 geometry, back-projecting later 1326 territorial changes to April 7, synthetic fallback geometry, or treating broad polity existence as proof of a province polygon. fileciteturn597file0

## Engineering stabilization gate

The production acquisition branch has passed the engineering stabilization gate.

Verified workflow:

```text
workflow: 35020661408
result: SUCCESS
validation/build/scalability steps: 83/83
```

The successful workflow includes lint; historical source acquisition, Cliopatria candidate extraction, entity reconciliation, entity evidence audit, geometry evidence inventory, cross-source geometry reconciliation; physical geography; topology; P3/P4/P5; P6.1/P6.2; cartography; GPU pack; runtime/startup; production build; repository cleanliness; and 15K+ scalability/diagnostics checks.

The terrain diagnostics contract remains fail-closed until the streamed DEM mesh passes visual validation at every LOD.

## 1326 source evidence gate

The source registry is established at:

```text
data/gis/1326/registry.json
data/gis/1326/acquisition-manifest.json
docs/architecture/1326-source-register.md
```

The registry and acquisition manifest are evidence-only. They do not constitute canonical political geography.

Current candidate evidence classes include:

- global political-entity evidence from Cliopatria;
- late-medieval European ecclesiastical boundary evidence from the Digital Atlas of Dioceses and Ecclesiastical Provinces;
- historical feature/boundary evidence from OpenHistoricalMap;
- historical place identity and reconciliation evidence from World Historical Gazetteer;
- Byzantine historical-geography reference evidence from Tabula Imperii Byzantini.

These sources have different purposes and limitations. None is automatically authoritative for every 1326 political boundary.

## Acceptance gates before enabling 1326

- `data/scenarios/1326/scenario.json` exists and declares `1326-04-07`.
- `src/world/map/assets/historical/1326/runtime.json` exists.
- Runtime asset schema is valid and contains both `provinces` and `geometries`.
- 1326 source provenance is recorded.
- Historical province repository loads successfully for `1326-04-07`.
- Scenario validation passes with no structural errors.
- New-game flow selects `1326` without a hard-coded 1300 dependency.
- Country selection displays the 1326 scenario date/title dynamically.
- Bursa starts under Ottoman control.
- `Bursa'nın Fethi` is present in the opening historical/event state.
- Capital decision changes the actual simulation state.
- Regression tests explicitly reject accidental reversion to `1300` as the production default.

## Current blocker

**Authoritative 1326 historical geography is not present yet.** The engineering pipeline is ready, but the pinned Cliopatria archive still has to be acquired into the local evidence workflow, its actual 1326 candidate records inspected, and those candidates reconciled against independent historical evidence before any canonical geography is promoted.

No binary source archive is committed to the repository. The intended workflow is to acquire the pinned external snapshot locally, verify its recorded identity/hash, extract the GeoJSON, run the evidence-only acquisition/extraction tools, and commit only the compact provenance/evidence artifacts required by the project.

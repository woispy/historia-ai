# Historia AI — 1326 Historical Runtime Contract

## Status

Design contract for the canonical playable `1326` scenario.

The production scenario date is **1326-04-07**. The existing `1300` scenario and its historical GIS assets remain reference/legacy material and are not relabeled as 1326.

The engineering stabilization gate is now **GREEN**: the current canonical branch completed the full 77-step validation/build/scalability workflow successfully on commit `e3d5acb6a4203738f7f41f972fc5f777629576da` (workflow run `34995090171`).

The active blocker is therefore no longer CI/lint stabilization. The active blocker is authoritative 1326 historical source acquisition, reconciliation, review, and canonical geography production.

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

The legacy `import-1300.js` remains available as a regression/reference path. A new year-agnostic `import-historical.js` accepts an explicit year and GeoJSON input and writes an **evidence-only** runtime asset under the requested historical year. It does not promote source polygons to canonical political authority.

The generic asset builder now propagates the requested historical year/date into asset identity and headers. This prevents a future 1326 import from silently producing `1300` asset IDs or metadata while preserving the existing 1300 default behavior of legacy callers.

Example:

```text
1326 GeoJSON evidence
      ↓
import-historical.js --year 1326 --input <source.geojson>
      ↓
evidence-only runtime
      ↓
historical reconciliation
      ↓
canonical political geography
      ↓
production runtime/mapbin
```

## Engineering stabilization gate

The production branch has now passed the engineering stabilization gate.

Verified workflow:

```text
commit: e3d5acb6a4203738f7f41f972fc5f777629576da
workflow: 34995090171
result: SUCCESS
validation/build/scalability steps: 77/77
```

The successful workflow included lint, physical geography, historical GIS, topology, P3/P4/P5, P6.1/P6.2, cartography, GPU pack, runtime/startup, production build, repository cleanliness, and 15K+ scalability/diagnostics checks.

The terrain diagnostics contract remains fail-closed until the streamed DEM mesh passes visual validation at every LOD.

## 1326 source evidence gate

The source registry is now established at:

```text
data/gis/1326/registry.json
docs/architecture/1326-source-register.md
```

The registry is evidence-only. It does not constitute canonical political geography.

Current candidate evidence classes include:

- global political-entity evidence from Cliopatria;
- late-medieval European ecclesiastical boundary evidence from the Digital Atlas of Dioceses and Ecclesiastical Provinces;
- historical feature/boundary evidence from OpenHistoricalMap;
- historical place identity and reconciliation evidence from World Historical Gazetteer.

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

**Authoritative 1326 historical geography is not present yet.** The next production work is source acquisition and reconciliation, beginning with Tier 1 evidence and highest-confidence historical entities. The generic importer and runtime architecture are ready; the canonical dataset must still be produced and validated before the 1326 scenario can replace 1300 as the production scenario.

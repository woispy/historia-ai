# Historia AI — 1326 Historical Runtime Contract

## Status

Design contract for the canonical playable `1326` scenario.

The production scenario date is **1326-04-07**. The existing `1300` scenario and its historical GIS assets remain reference/legacy material and are not relabeled as 1326.

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

The repository currently contains a dedicated 1300 historical importer and 1300 source/runtime assumptions. No authoritative 1326 runtime asset is present yet. The correct next step is therefore **1326 source acquisition/reconciliation and runtime generation**, not a string replacement of `1300` with `1326`.

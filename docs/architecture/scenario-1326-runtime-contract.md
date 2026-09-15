# Historia AI — 1326 Historical Runtime Contract

## Status

Design contract for the canonical playable `1326` scenario.

The production scenario date is **1326-04-07**. The existing `1300` scenario and its historical GIS assets remain reference/legacy material and are not relabeled as 1326.

The current engineering gate remains **CI/lint baseline stabilization before authoritative 1326 data promotion**.

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

Before authoritative 1326 geography is promoted, the production branch must first reach a clean lint baseline and then complete the full validation workflow.

The latest observed workflow attempt before the current cleanup commits checked out `bca4dd8594544db9d82069d63aaf799ef649f756` and failed at the ESLint step with **45 errors and 0 warnings**. Because the subsequent cleanup commits were made after that run, that 45-error result is a historical CI snapshot, not proof of the current branch's exact lint count.

The workflow contains 77 validation/build/scalability steps after setup. Since lint is an early gate, a lint failure skips the later map, GIS, runtime, build, and 15K+ scalability checks. A green result therefore requires observing the workflow on the current branch after lint reaches zero.

The current cleanup pass remains behavior-preserving and includes:

- remove genuinely unused triangulation constants/locals without changing thresholds or algorithms;
- remove unused terrain renderer imports while retaining the dynamic telemetry import and terrain buffers;
- avoid reading React refs during render in `MapStudioEditor`;
- remove unused physical-geography accumulators without changing classification behavior;
- clean runtime, reference-layer, visual-regression, and proof-group test/CLI bindings while preserving their assertions and validation paths;
- keep legacy/reference GIS paths intact unless repository usage proves they are dead;
- do not introduce new Voronoi, jitter, anchor, or fallback geometry generation;
- keep terrain diagnostics fail-closed until the streamed DEM mesh passes visual validation at every LOD;
- update this contract whenever the acceptance state changes.

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

The generic evidence importer is now in place, but **no authoritative 1326 runtime asset is present yet**. The immediate engineering blocker is CI/lint baseline stabilization; after that, the remaining data blocker is source acquisition/reconciliation and canonical historical geography production, not importer architecture. The production scenario must remain on 1300 until those acceptance gates are satisfied.

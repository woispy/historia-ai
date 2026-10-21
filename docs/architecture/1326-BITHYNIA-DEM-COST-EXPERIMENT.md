# Historia AI — Bithynia DEM / Terrain-Cost Experiment Contract

## Status

- Scenario under review: `1326-04-07`
- Workstream: PR #109 / `work/phase-a-1326-t3b-candidate-surface`
- Status: **SPECIFIED — NOT RUN FOR THE Nicaea–Lefke route**
- Authority: diagnostic physical-geography analysis only
- Political-boundary authority: **NONE**
- Canonical promotion: **BLOCKED**
- Last reviewed: 2026-10-21

This document defines the minimum reproducibility contract for evaluating the Nicaea–Lefke–Sangarius accessibility hypothesis. It is not a claim that a route-cost result has already been calculated.

## Why a dedicated run is still required

The current pilot edge `nicaea-lefke-route-1326` cites John France's description of the 1097 First Crusade approach to Nicaea. That source supports route/terrain context in the 11th century; it does not establish route use in 1326 or a measured lower travel cost.

The repository contains a terrain-cost solver and DEM sampling machinery, and the CI suite passed on commit `8f278b590b197ffd515c3d9038e86bb5e406e0cb`. Those general contract/stress tests do **not** constitute a route-specific Nicaea–Lefke result.

A second provenance distinction must remain explicit:

- `tools/historical-gis/province/CopernicusDemCostSampler.js` consumes `CopernicusDemSource` from `tools/asset-builder/dem/CopernicusDemSource.js`, which reads a public COG tile-list/bucket and caches tiles locally.
- The separate P6.2 acquisition contract pins `COP-DEM_GLO-30-DGED/2024_1` through Copernicus Data Space, while `src/world/map/source/physical/copernicus-glo30.manifest.json` currently has `tiles: []`.

These are not interchangeable provenance records merely because both names contain “Copernicus GLO-30”. Before the experiment, choose and pin the actual raster authority, exact source release/URL, and per-tile checksum. Do not describe an unpinned COG cache as the pinned DGED 2024_1 release.

## Endpoint registry audit (2026-10-21)

The current `data/gis/1326/anchor-candidate-registry.json` contains a Nicaea/İznik candidate city point at `[29.721111, 40.428611]`, supported by GeoNames and Wikidata coordinate references. It is explicitly `candidate-evidence-only`; a city point is not a trailhead or route corridor endpoint.

The current machine-readable candidate registry does **not** contain a Lefke/Leukai/Osmaneli, Geyve/Kabeia, or Sangarius/Sakarya endpoint record. The research document `docs/architecture/1326-anchor-authority-research.md` describes Geyve as a research candidate around `[30.296, 40.517]`, but that is not a sealed production registry record and remains corridor/reference context only. It cannot silently be copied into this experiment as an authoritative endpoint.

**Result: `BLOCKED_ENDPOINT_PROVENANCE`.** No route-cost solver run should be started until the corridor endpoint(s) are reconciled into a machine-readable, source-backed record with explicit coordinate source, uncertainty, temporal applicability, and physical-reference-only semantics. This is an evidence/provenance block, not a request to promote a new political anchor.

## Required experiment design

### 1. Freeze endpoints from the project evidence

- Resolve Nicaea, Lefke/Leukai/Osmaneli, and any Sangarius corridor endpoint from the existing historical anchor/place-identity records.
- Record each endpoint's canonical ID, coordinates, coordinate source, coordinate uncertainty, and source record.
- Do not infer or silently hardcode endpoints from a place name.
- If the current anchor registry cannot justify an endpoint, stop and record `BLOCKED_ENDPOINT_PROVENANCE`.

### 2. Pin and validate raster inputs

Record, at minimum:

- dataset/provider and exact release/version;
- source product/tile IDs and original URLs;
- source and acquired file SHA-256 per tile;
- horizontal CRS, vertical datum/CRS, pixel interpretation, nodata handling, grid spacing and raster dimensions;
- the decoder/validation code revision;
- whether the source tiles are original inputs or derived/cache files.

Fail closed if a required tile is missing, the manifest checksum does not match, georeferencing is inconsistent, or a tile's vertical CRS/semantics are unknown.

### 3. Make the cost model explicit

Run a **baseline geodesic/direct-route diagnostic** and at least two declared terrain-cost scenarios. For each scenario, record:

- graph bounds and dimensions/resolution;
- slope sampling interval and how degree distances are converted to metres;
- slope, ridge, mountain, river, lake and coast channels, including exact formulas;
- every weight and its rationale/source;
- hard-blocking rules, river-crossing policy, and whether paths may traverse water;
- solver name, heuristic/minimum-cost lower bound, iteration cap and tie-breaking;
- endpoint-to-grid-node snapping method and its maximum displacement.

Do not tune weights to make the path pass through a preferred historical hypothesis. A numerically cheaper path is a model result conditional on assumptions, not evidence that medieval travellers used it.

### 4. Report reproducible outputs

The output JSON must contain:

- schema/version and timestamp;
- endpoint records and snapping deltas;
- all input tile IDs, URLs, SHA-256 hashes and semantic validation results;
- code commit SHA and configuration hash;
- graph and solver parameters;
- baseline and scenario path costs, path lengths, iteration counts and success/failure reason;
- sampled elevation/slope summaries and no-data coverage;
- a checksum of the canonicalized result payload;
- limitations and a classification of `DIAGNOSTIC_ONLY`.

Preserve raw solver paths as diagnostic artifacts. Do not turn the result into a province boundary, controller inference, or review binding.

### 5. Sensitivity and acceptance

At minimum, compare the declared cost scenarios and a coarser/finer grid. Report whether the route ranking is stable. If the preferred route changes under reasonable weight/resolution changes, classify the result as **SENSITIVE / INCONCLUSIVE** rather than selecting one output.

A terrain-cost result can support only physical accessibility analysis. It cannot by itself establish:
- that a route was historically used in 1326;
- which polity controlled either side;
- a political border or a boundary centerline;
- the legal/historical extent of any province or state.

## Current gates

| Gate | Current status |
|---|---|
| T3-B source revision and immutable references | Pinned |
| Cambridge claim's date scope | Audited: 1097 context, not 1326 proof |
| DEM/cost pipeline general CI contracts | Passed on `8f278b5` |
| Route-specific endpoint provenance | **BLOCKED_ENDPOINT_PROVENANCE** — Nicaea city point exists; Lefke/Geyve/Sangarius endpoint is not in the candidate registry |
| One exact raster authority/release + per-tile hashes | Not yet pinned for this experiment |
| Nicaea–Lefke route-specific reproducible run | Not run |
| Numeric solver weight from this hypothesis | Prohibited until the run is reviewed |
| Political boundary / controller inference / canonical promotion | Blocked |

## Next operation

1. Inspect the existing 1326 anchor/place registry for source-backed endpoint coordinates.
2. Resolve the DEM source provenance mismatch before sampling.
3. Implement/run the experiment only after endpoint and raster input gates pass.
4. Record results and sensitivity; if inputs or endpoints cannot be verified, preserve the block and seek better evidence.


## Endpoint and raster provenance follow-up — 2026-10-21

### Place identity is not a route endpoint

External coordinate cross-checking did not justify unblocking the experiment:

- Historical literature already cited in this repository (Öztürk 2021, printed pp. 2–3; TIB 13, printed pp. 215–216) supports the historical place-name relationship Leukai/Lefke → modern Osmaneli and a retrospective 1304/05 Sangarios-corridor narrative. It does not specify a surveyed 1326 trailhead, river crossing, or cost-sampling endpoint.
- Modern locality references place Osmaneli around 40.3591 N, 30.0166 E (Mapcarta/OpenStreetMap-backed place record), while a general reference gives rounded coordinates 40.350 N, 30.017 E. These are modern town-location references, not independently verified medieval route points.
- Geyve has a material point-type ambiguity: GeoNames' Geyve İlçesi administrative-division record reports 40.51701 N, 30.29645 E, whereas the Geyve town/locality record reports approximately 40.50906 N, 30.29025 E. The earlier approximate value [30.296, 40.517] therefore corresponds to a district-level reference, not a validated town point or gorge crossing.
- The historical mention of Absu/Hypsu in Geyve Gorge remains a research lead. Neither a district centroid nor a modern town point can be silently substituted for that historical feature.

No anchor was added to `anchor-candidate-registry.json`: the available evidence does not yet identify a single physical endpoint with an explicit point type and acceptable independent coordinate provenance. This is intentional fail-closed behavior, not a claim that these places are unknown.

### Raster release clarified; tile inputs still unpinned

Official Copernicus Data Space documentation identifies `COP-DEM_GLO-30-DGED/2024_1` as a distinct release and documents one-degree grid-cell IDs and OData discovery by dataset and grid ID. This clarifies how the pinned CDSE product should be acquired, but it does not supply this experiment's exact tile list or file checksums.

The repository's separate public COG tile-list/cache path remains a different acquisition/provenance chain. No tile from that cache is accepted as a substitute for a CDSE 2024_1 tile until product identity, source URL, bytes and SHA-256 are reconciled.

### Gate ruling

**Still `BLOCKED_ENDPOINT_PROVENANCE`; raster gate also remains open.** The external coordinate checks narrow the ambiguity but do not resolve it. No route solver was run, no weights were tuned, and no political geometry/controller/review binding was changed.

Required next evidence:
1. Select the physical feature intended by the historical claim (town reference, gorge feature, or river crossing) and record why that feature is the experiment endpoint.
2. Obtain two coordinate-source types for that exact feature, record coordinate disagreement/uncertainty and retain the historical source separately from coordinate sources.
3. Query the official CDSE catalogue for the exact `2024_1` grid cells intersecting the approved experiment bounds; save product IDs, original download URLs, downloaded bytes and SHA-256 values.
4. Only then perform a route-specific run and sensitivity comparison.

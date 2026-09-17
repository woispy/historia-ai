# A2 — Historical Fallback Geometry Fingerprint

Status: **Forensic evidence / not production authority**  
Date: **2026-09-18**

## Finding

The retained exact-head historical-builder lineage artifact from workflow run `35267020164` contains an Amisos result at checkpoint:

```
e67cdd3f7a3b89631c497f0d2ec1ac9d24444364
```

The result is:

```
vertexCount = 6
area        = 0.00001040999984525115
```

with polygon:

```
[
  [35.96245, 41.13693],
  [35.96145, 41.13866],
  [35.95945, 41.13866],
  [35.95845, 41.13693],
  [35.95945, 41.13519],
  [35.96145, 41.13519]
]
```

## Geometric fingerprint

This polygon is a regular six-vertex fallback hexagon with an effective radius of approximately `0.002` coordinate units.

For a regular hexagon generated as:

```
x = cx + cos(angle) * r
y = cy + sin(angle) * r
```

its theoretical area is:

```
(3 * sqrt(3) / 2) * r^2
```

For `r = 0.002`, this is approximately:

```
1.0392304845e-5
```

The retained polygon area is `1.040999984525115e-5`, which is consistent with the documented historical six-vertex fallback construction after coordinate serialization/rounding. The vertex spacing and six-fold structure independently identify this as fallback-family geometry rather than a normal five-vertex Voronoi cell.

## Corrected candidate-center lineage

The fallback fingerprint can be traced one level deeper: the observed center is not arbitrary and is not the Amisos metadata centroid itself.

Amisos metadata carries centroid:

```
[36.33, 41.29]
```

The retained `e67cdd3f...` fallback center is approximately:

```
[35.96045, 41.13693]
```

The displacement from the metadata centroid is approximately:

```
dx ≈ -0.36955
dy ≈ -0.15307
radius ≈ 0.400000
```

### Important correction

The exact `e67cdd3f...` builder source uses:

```
FALLBACK_RADII = [0.001, 0.002, 0.004, 0.008, 0.015, 0.025, 0.05, 0.1, 0.2, 0.4, 0.8]
FALLBACK_DIRECTIONS = 64
```

Therefore the observed coordinate corresponds to the `0.4` radial candidate at **direction index 36 of the 64-direction grid**, because:

```
36 / 64 * 360° = 202.5°
```

and:

```
36.33 + cos(202.5°) * 0.4 ≈ 35.960448186995485
41.29 + sin(202.5°) * 0.4 ≈ 41.13692662705396
```

which matches the retained center after serialization/rounding.

An earlier forensic note associated the same geometric point with `direction=18` in a 32-direction search pass. That association describes the earlier historical search configuration, but **it is not the exact e67 source configuration**. The exact e67 source has 64 directions, so the provenance-safe statement is:

```
e67 source
  → historical centroid [36.33, 41.29]
  → radius 0.4
  → direction index 36 / 64
  → angle 202.5°
  → candidate ≈ [35.96045, 41.13693]
  → fallback hexagon r≈0.002
```

This correction matters because the forensic record must distinguish the historical search configuration that produced the coordinate from an earlier configuration that happens to describe the same angular position.

## Historical code correlation

Commit `0dd1dadb90103b5706fd87c470b8d4a6dc85f496` introduced `createAnchorFallbackPolygon()` and generated six-vertex fallback polygons.

Later history changed the fallback acceptance path and candidate search. The exact `e67cdd3...` source contains deterministic radial candidate generation and a six-vertex `buildFallbackPolygon()` using radii beginning at `0.002`.

The historical structure is:

```
historical centroid
      ↓
deterministic radial search
      ↓
accepted physical-land candidate
      ↓
regular six-vertex fallback
      ↓
round/serialize
```

The retained e67 geometry therefore has a direct numerical fingerprint of the fallback family and its candidate-center search behavior.

## What this proves

It proves that the historical builder lineage can enter a fallback representation whose area is approximately `1.04e-5`, and that this representation was actually observed for `pontus-amisos` at checkpoint `e67cdd3f...`.

It also proves, from the exact e67 source configuration, that the observed center is consistent with the `r=0.4`, `direction=36/64` candidate of the 64-direction deterministic radial search.

It does **not** prove that this fallback generated the original `2.27e-13` observation.

The original target is approximately:

```
2.27e-13
```

For the same regular-hexagon construction, that area would correspond to an effective radius of approximately:

```
sqrt(2.27e-13 / (3*sqrt(3)/2)) ≈ 2.96e-7
```

That is roughly four orders of magnitude smaller than the `0.002` fallback radius fingerprint observed at `e67cdd3f...`.

This makes the next question more precise: **did a later fallback/serialization stage reduce an already-fallback polygon toward an effective radius near `3e-7`, or did the original `2.27e-13` artifact come from a different degenerate representation?**

## Canonical comparison

The same forensic lineage artifact records canonical `6b7424125eee4a1c72925b7a1780c68e695e9ba3` Amisos geometry as:

```
vertexCount = 5
area        = 0.0067547530500178254
```

Thus the historical `e67cdd3f...` result is not a small numerical perturbation of the canonical polygon. It is a different geometric representation and a different spatial footprint.

## Locked interpretation

```
e67 checkpoint
    ↓
Amisos historical centroid [36.33, 41.29]
    ↓
radial search: radius=0.4, direction=36/64, angle=202.5°
    ↓
accepted physical-land candidate ≈ [35.96045, 41.13693]
    ↓
6-vertex fallback, r≈0.002
    ↓
area ≈ 1.04e-5
```

This is now a **confirmed historical fallback-family observation with candidate-center provenance**, with the candidate-direction configuration corrected to match the exact e67 source.

The A2 root cause remains **PROVENANCE / HISTORICAL ARTIFACT DISCONTINUITY** until the `2.27e-13` artifact itself is reproduced or its exact serialized representation is identified.

No production geometry, `MIN_AREA`, MapBin, GPU, or runtime behavior is changed by this finding.

## Next forensic action

Follow the exact historical fallback candidate into every downstream representation and compare the first point at which its geometry changes:

- accepted candidate center,
- six-vertex construction,
- physical-land validation,
- coordinate rounding,
- polygon deduplication,
- asset JSON serialization,
- any import/export transformation,
- binary conversion, and
- area calculation.

In parallel, inspect later historical changes to the fallback radii/search configuration and any alternate producer that could create an effective radius near `2.96e-7`.

The acceptance target remains an exact numerical chain ending at `~2.27e-13`, not merely another small fallback polygon.

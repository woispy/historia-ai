# A2 — Historical Fallback Geometry Fingerprint

Status: **Forensic evidence / not production authority**  
Date: **2026-09-17**

## Finding

The retained exact-head historical-builder lineage artifact from workflow run `35267020164` contains an Amisos result at checkpoint:

```text
e67cdd3f7a3b89631c497f0d2ec1ac9d24444364
```

The result is:

```text
vertexCount = 6
area        = 0.00001040999984525115
```

with polygon:

```text
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

```text
x = cx + cos(angle) * r
y = cy + sin(angle) * r
```

its theoretical area is:

```text
(3 * sqrt(3) / 2) * r^2
```

For `r = 0.002`, this is approximately:

```text
1.0392304845e-5
```

The retained polygon area is `1.040999984525115e-5`, which is consistent with the documented historical six-vertex fallback construction after coordinate serialization/rounding. The vertex spacing and six-fold structure independently identify this as fallback-family geometry rather than a normal five-vertex Voronoi cell.

## Historical code correlation

Commit `0dd1dadb90103b5706fd87c470b8d4a6dc85f496` introduced `createAnchorFallbackPolygon()` and generated six-vertex fallback polygons. fileciteturn418file0L3-L7

Later history explicitly changed the fallback radii to `[0.004, 0.002, 0.001]` in commit `2edad3f177b2294af950a29a74b109e409f7b949`. fileciteturn423file0L3-L11

Therefore the `e67cdd3f...` geometry is not merely “a small polygon”: its exact six-vertex structure and area provide a direct numerical fingerprint of the historical fallback family, specifically the `0.002` radius candidate.

## What this proves

It proves that the historical builder lineage can enter a fallback representation whose area is approximately `1.04e-5`, and that this representation was actually observed for the `pontus-amisos` forensic target at checkpoint `e67cdd3f...`.

It does **not** yet prove that this fallback generated the original `2.27e-13` observation.

The original target is approximately:

```text
2.27e-13
```

For the same regular-hexagon construction, that area would correspond to an effective radius of approximately:

```text
sqrt(2.27e-13 / (3*sqrt(3)/2)) ≈ 2.96e-7
```

That is roughly four orders of magnitude smaller than the `0.002` fallback radius fingerprint observed at `e67cdd3f...`.

This makes the next question precise: **did a later fallback/serialization stage reduce an already-fallback polygon toward an effective radius near `3e-7`, or did the original `2.27e-13` artifact come from a different degenerate representation?**

## Canonical comparison

The same forensic lineage artifact records canonical `6b7424125eee4a1c72925b7a1780c68e695e9ba3` Amisos geometry as:

```text
vertexCount = 5
area        = 0.0067547530500178254
```

Thus the historical `e67cdd3f...` result is not a small numerical perturbation of the canonical polygon. It is a different geometric representation and a different spatial footprint.

## Locked interpretation

```text
e67 checkpoint
    ↓
6 vertices
    ↓
regular fallback hexagon
    ↓
r ≈ 0.002
    ↓
area ≈ 1.04e-5
```

This is now a **confirmed historical fallback-family observation**.

The A2 root cause remains **PROVENANCE / HISTORICAL ARTIFACT DISCONTINUITY** until the `2.27e-13` artifact itself is reproduced or its exact serialized representation is identified.

No production geometry, `MIN_AREA`, MapBin, GPU, or runtime behavior is changed by this finding.

## Next forensic action

Trace the fallback-family history after `0dd1dadb...`, with particular attention to every change in:

- fallback radius,
- candidate-center selection,
- clipping/physical-land validation,
- coordinate rounding,
- polygon deduplication,
- serialization, and
- any later area calculation.

The next acceptance target is an exact numerical chain ending at `~2.27e-13`, not merely another small fallback polygon.

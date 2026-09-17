# A2 — Historical Fallback Spatial Identity Finding

Status: **Forensic / not production authority**  
Date: **2026-09-17**

## Finding

The historical Amisos checkpoint at `e67cdd3f7a3b89631c497f0d2ec1ac9d24444364` is a six-vertex regular fallback hexagon:

```text
area        = 0.00001040999984525115
vertices    = 6
center      ≈ [35.96045, 41.13693]
radius      ≈ 0.002
```

The geometry is therefore consistent with the historical fallback family rather than a normal Voronoi-derived political cell.

## Historical fallback evolution

`0dd1dadb90103b5706fd87c470b8d4a6dc85f496` introduced a fallback that constructed a six-vertex polygon around the metadata centroid, attempted `clipCellToLand()`, then accepted the clipped polygon when its centroid passed the physical-land check.

Later revisions changed the representation substantially:

- fallback radii were reduced to small deterministic values;
- centroid-only / envelope checks replaced stricter polygon-wide checks in some revisions;
- candidate-center radial searches were introduced;
- later fallback hierarchy prioritized explicit physical anchors, historical centroids, and physical-land candidate searches.

The historical code therefore contains multiple materially different fallback representations. They must not be treated as one continuous algorithm.

## Spatial identity implication

The e67 checkpoint center `[35.96045, 41.13693]` is materially displaced from the canonical Amisos producer representation observed at approximately `[36.19593–36.28132, 40.9858–41.09303]` and from the pinned V15 producer's distinct Amisos site/anchor lineage.

This means the historical fallback evidence is not merely a smaller rendering of the canonical Amisos polygon. It represents a different spatial construction and potentially a different site/anchor selection path.

The displacement must therefore be tracked as **identity/provenance evidence**, not corrected geometrically during forensic work.

## Numerical implication for `~2.27e-13`

For a regular six-vertex hexagon, an area near `2.27e-13` would imply an effective radius of roughly `2.96e-7`, far below the documented historical fallback radius near `0.002`.

Therefore the e67 fallback itself does not explain the historical tiny value. To reach the target, a later representation boundary would have to introduce a very large scale reduction, degeneracy, or a different polygon entirely.

## Current conclusion

The fallback family is now established as a real historical representation family, but it is **not** the proven source of `~2.27e-13`.

The next forensic test must preserve site/anchor identity while comparing:

```text
historical metadata centroid
        ↓
selected candidate center
        ↓
raw fallback hexagon
        ↓
clipCellToLand (where applicable)
        ↓
uniquePoints / centroid sort
        ↓
roundPolygon
        ↓
serialized/imported ring
        ↓
area calculation
```

The first representation that changes area toward `~2.27e-13` is the required forensic boundary.

## Locked constraints

- `MIN_AREA = 0.00005` remains unchanged.
- No fallback geometry is promoted to authoritative production geography.
- No MapBin/GPU/rendering mutation is authorized from this finding.
- `SAFE TO DELETE = 0`.
- Local ↔ GitHub convergence remains blocked until the authoritative `1586/1586 GREEN` GIS gate.

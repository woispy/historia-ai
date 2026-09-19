# Phase A — Historical Control-Point Proof Contract

## Purpose

Bind the 1326 Tier-1 historical-anchor registry to the existing georeference automation without turning historical places into automatic polygon vertices.

## Contract

A historical anchor can participate in georeferencing only as a **source-backed correspondence candidate**:

```
historical source
  -> anchor identity
  -> geographic coordinate
  -> visible map correspondence
  -> pixel/geo pair
  -> affine calibration
  -> residual
  -> review
```

The existing ControlPointAutomation contract supports deterministic extent-derived corners/midpoints, city-anchor sanity validation, two-click extent solving, and fail-closed rejection of inconsistent/mislabeled correspondences.

For Historia AI 1326, the following additional rules apply:

1. `locationConfidence` and `politicalExtentConfidence` remain independent.
2. A historical anchor with `politicalExtentConfidence = none/low` may validate map georeferencing but cannot define a political boundary.
3. A named place is never automatically a polygon vertex.
4. A correspondence must retain `sourceRef`, `anchorId`, pixel coordinates, geographic coordinates, and calibration residual.
5. A two-point solution is provisional; independent visible anchors must pass the sanity gate.
6. A three-point-or-more inconsistency must fail closed.
7. Georeference success does not imply political-boundary correctness.
8. The proof artifact remains `evidence-only` until historical boundary review, physical-land validation, and topology validation pass.

## Required proof record

```json
{
  "entityId": "esrefogullari",
  "scenarioDate": "1326-04-07",
  "authorityStatus": "constraint-evidence-only",
  "anchorId": "beysehir-centre",
  "sourceRef": "source-id",
  "correspondence": {
    "pixel": [0, 0],
    "geo": [0, 0]
  },
  "calibration": {
    "method": "affine",
    "rmsResidual": null,
    "validation": "pending"
  },
  "politicalExtentConfidence": "none",
  "boundaryRole": "not-a-boundary-vertex"
}
```

The example coordinates above are placeholders only and must never be committed as historical geometry.

## Gate

`ready=true` from georeference automation means only that the map transformation is internally consistent with its declared correspondences and sanity anchors.

It does **not** mean:

- historical boundary verified;
- political control verified;
- physical land verified;
- topology verified;
- canonical geometry approved.

Canonical promotion remains blocked.

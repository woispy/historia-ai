# Phase A 1326 — C Physical Boundary Root-Cause Binding

## Scope

This note binds the known historical Amasya failure edge to the **current production-side physical authority contract** without importing the older forensic authority implementation.

## Known forensic edge

- provinceId: `pontus-amasya`
- edgeIndex: `3`
- start: `[34.828390856782086, 41.01264370368176]`
- end: `[35.31959064327484, 41.25286549707603]`

The older forensic record reported:

- start: `isPhysicalLandPoint = true`
- end: `isPhysicalLandPoint = false`

Those values are retained as historical forensic observations, not as a new execution result.

## Current authority contract

The current staging branch exposes `isPhysicalLandPoint` from:

`tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`

Its semantics are:

1. reject points inside the current water envelope;
2. otherwise accept points inside the curated Anatolia land polygon;
3. otherwise accept a point only within the configured coastal tolerance of the land boundary.

The water envelope itself combines the current curated sea polygons and the runtime generated 10m lake dataset.

Therefore a point can be geometrically adjacent to a physical shoreline and still fail `isPhysicalLandPoint` when it lies inside a mapped lake interior. This is intentionally different from the older recovery distinction that allowed a separate geometry-boundary semantic.

## C root-cause conclusion

The Amasya edge demonstrates a **contract distinction**, not yet a geometry-authority defect:

- `isPhysicalLandPoint` answers: "is this point final physical land under the current runtime land/water mask?"
- historical forensic recovery additionally needed a boundary-recovery semantic for points that may lie on an authoritative water/land boundary while remaining valid as geometry-boundary points.

The older recovery implementation contained:

- `isPhysicalGeometryBoundaryPoint`
- `isFinalPhysicalGeometryBoundaryPoint`
- `resolvePhysicalGeometryBoundaryPoint`

but that module is not present on the current staging branch and must not be silently restored or copied from the old forensic branch.

## Required closure proof

The C gate remains open until the current authority exposes or explicitly rebinds the boundary-recovery contract. The admissible proof must classify the Amasya edge into:

- endpoint final-physical-land status;
- endpoint geometry-boundary status;
- sampled-edge final-physical-land status;
- sampled-edge geometry-boundary status;
- source containment;
- repair eligibility.

No automatic repair is allowed during this proof.

## Decision

**Root distinction identified:** YES  
**Current authority semantics bound:** YES  
**Amasya current executable closure:** PENDING  
**Authority mutated:** NO  
**Canonical geometry mutated:** NO  
**SAFE TO DELETE:** 0  
**Promotion:** BLOCKED

## Next step

Implement a read-only Amasya C probe against the current physical atlas/runtime authority. The probe must expose the missing boundary-recovery distinction rather than invent a replacement repair rule. If the current runtime has no explicit boundary semantic, record that as the remaining architecture gap and do not modify production authority.

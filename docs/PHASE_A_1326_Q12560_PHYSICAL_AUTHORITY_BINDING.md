# Phase A 1326 — Ottoman Q12560 Physical Authority Binding

## Purpose

This record closes the next forensic sub-gate for the unchanged Cliopatria Q12560 candidate: identify the **actual current physical-land authority** before any physical-land result is recorded.

## Finding — 2026-09-20

The reviewed-staging branch does **not** contain the older forensic recovery module:

`tools/historical-gis/recovery/physical-land-authority.mjs`

The current production-side physical-land predicate is instead exported directly by:

`tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`

Its `isPhysicalLandPoint(point)` contract is derived from:

- `ANATOLIA_PHYSICAL_ATLAS.landPolygons`
- `ANATOLIA_PHYSICAL_ATLAS.seas`
- runtime 10m hydrography lakes from `AnatoliaPhysicalAtlasRuntime`
- the existing coastal tolerance and Anatolia envelope

The runtime hydrography authority is loaded from:

`src/map/data/generated/anatolia-hydrography-10m.json`

That generated runtime asset is not directly present through the repository file interface on this staging ref. Therefore this investigation must **not** substitute the old forensic authority, recreate lake geometry, or infer a physical-land result from a different dataset.

## Q12560 consequence

The unchanged candidate already has:

- source: Cliopatria v0.2.0;
- feature: `Ottoman Empire`;
- Wikidata: Q12560;
- scenario date: 1326-04-07;
- geometry: one valid closed Polygon;
- topology: no self-intersection;
- promotion: BLOCKED.

Its physical-land gate therefore remains:

`BLOCKED_PENDING_AUTHORITY_BINDING`

This is an architecture/instrumentation gap, not a candidate-geometry failure.

## Required implementation gate

The next admissible implementation is a **read-only physical-authority binding test** that imports the current production-side predicate without changing it and evaluates:

1. every candidate vertex;
2. sampled points along every candidate edge;
3. lake-interior exclusions through the current runtime hydrography;
4. final pass/fail evidence with source and authority identities.

The test must execute after the normal physical/hydrography asset preparation path is available. It must never:

- copy the old forensic `physical-land-authority.mjs`;
- alter `ANATOLIA_PHYSICAL_ATLAS`;
- alter hydrography;
- repair/snap/simplify the candidate;
- write canonical geometry or MapBin;
- reinterpret Q12560 as Ottoman Beylik.

## Contract distinction

The older forensic lineage used a richer distinction between:

- `isPhysicalLandPoint`;
- `isPhysicalGeometryBoundaryPoint`;
- `isFinalPhysicalGeometryBoundaryPoint`.

The current production-side builder exposes only `isPhysicalLandPoint`. Consequently, no claim about the older **final physical geometry boundary** semantics may be imported into this staging result until that contract is explicitly rebound to the current authority.

## Decision

**Physical authority identified:** YES  
**Executable reproducible binding on current staging workflow:** PENDING  
**Candidate geometry mutated:** NO  
**Canonical geometry mutated:** NO  
**Promotion:** BLOCKED  
**SAFE TO DELETE:** 0

## Next gate

Bind the read-only Q12560 physical-land test to the existing asset preparation/runtime hydrography path, execute it in CI, retain the evidence artifact, and then update the Q12560 diagnostic with the actual vertex/edge results.

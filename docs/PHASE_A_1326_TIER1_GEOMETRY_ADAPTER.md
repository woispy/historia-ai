# Phase A — 1326 Tier-1 Geometry Adapter Contract

Status: **adapter layer OPEN; geometry promotion BLOCKED**

Scenario date: **1326-04-07**

## Objective

Bridge the historical evidence layer into the existing Province Source Studio without conflating historical existence/control evidence, source identity, cartographic interpretation, reconstructed geometry, and canonical authority.

## Adapter states

- `source-gap`: no traceable geometry artifact acquired.
- `candidate`: machine-readable candidate geometry exists, but review is incomplete.
- `reviewed-reconstruction`: geometry explicitly authored from documented multi-source evidence with method and assumptions recorded.
- `reviewed`: geometry passed source/temporal/entity review but still awaits physical/topology gates.
- `canonical`: forbidden at adapter stage; only the canonical publisher may assign this state.

## Required record

Every adapter record must contain entityId, scenarioDate, sourceIdentity, temporalApplicability, entityReconciliation, geometry, provenance, review, and promotion.

## Geometry provenance rules

A `reviewed-reconstruction` record must state which historical sources were used, what each contributes, the reconstruction method, explicit assumptions, uncertainty/confidence, and reviewer status.

It must not claim that a reconstructed boundary is an exact surviving historical boundary.

## Current Tier-1 adapter registry

### Ottoman Beylik
- entity: `ottoman-beylik`
- Cliopatria candidate: Wikidata `Q12560`, source label `Ottoman Empire`
- state: `candidate`
- blocker: cross-polity label review
- geometry generation: forbidden

### Eşrefoğulları
- entity: `esrefogullari`
- Cliopatria: source gap
- independent historical/cartographic evidence exists
- state: `source-gap`
- geometry: pending traceable acquisition or explicitly authored reconstruction

### Alâiye
- entity: `alaye`
- Cliopatria: source gap
- independent historical/cartographic evidence exists
- state: `source-gap`
- geometry: pending traceable acquisition or explicitly authored reconstruction

## Reconstruction policy

A reconstruction may only be authored in a separate reviewed document. The adapter must reference that document by immutable repository path/commit or retained artifact identity.

The adapter must reject image-to-polygon conversion without documented georeference and provenance; 1300 geometry relabelled as 1326; 1400 geometry relabelled as 1326; capital-radius/generated polygons; Voronoi/fallback cells; jitter/anchor/filler geometry; undocumented hand-authored coordinates.

The existing map-studio georeferencing and control-point automation are admissible authoring infrastructure, not historical evidence by themselves. If used, their control points and residuals become part of the reconstruction proof.

## Gate sequence

adapter record → source/temporal/entity checks → geometry method/provenance check → Province Source Studio ring validation → physical-land validation → proof-group/topology validation → canonical review

No adapter output directly calls the canonical publisher.

## Decision

The project can now begin authoring a reviewed reconstruction for the two source-gap entities without changing the canonical authority contract. The first geometry artifact must be a reviewable source document, not a runtime MapBin.
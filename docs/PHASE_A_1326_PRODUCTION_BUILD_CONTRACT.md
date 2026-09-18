# Phase A — 1326 Production Build Contract

Status: **blocked on authoritative 1326 runtime input**  
Date: **2026-09-18**  
Canonical branch: `integration/phase-a-h-production`

## Purpose

Make the production map selection explicit before any 1326 political geometry is promoted.

The production scenario is:

```text
1326-04-07
```

The 1300 GIS pipeline remains legacy/forensic material. It must never become an implicit input to the 1326 production build.

## Current evidence

The canonical repository already contains a 1326 evidence intake area:

```text
data/gis/1326/
  acquisition-manifest.json
  evidence-matrix.json
  registry.json
```

The 1326 registry declares `authorityStatus = evidence-registry-only` and `canonicalGeometry.status = not-promoted`. The acquisition manifest likewise keeps source acquisition and canonical promotion separate.

There is currently no:

```text
src/world/map/assets/historical/1326/runtime.json
```

Therefore the production runtime is not yet available and must remain blocked.

## Contract

`data/scenarios/production.json` is the explicit production selection contract.

Required values:

- scenario ID: `1326`
- start date: `1326-04-07`
- production date: `1326-04-07`
- runtime: `src/world/map/assets/historical/1326/runtime.json`
- authoritative geometry required: `true`

## Build separation

The repository now has two explicit map build paths:

- `npm run build:production` — requires the 1326 runtime and canonical authority; it fails closed when the runtime is absent or non-canonical.
- `npm run build:legacy-map` — explicitly generates the legacy 1300 map and passes its runtime to MapBin by path.

The generic MapBin builder no longer defaults to any historical year. It requires either an explicit `--input` path or `HISTORIA_MAP_RUNTIME_JSON`.

The ordinary `npm run build` remains temporarily tied to the explicit legacy path so existing CI does not silently reinterpret 1300 output as 1326 production. This is an intentional migration state, not completion of Issue #107.

## Promotion gate

The following sequence is required before `build:production` can succeed:

```text
1326 source acquisition
      ↓
temporal normalization to 1326-04-07
      ↓
entity reconciliation
      ↓
geometry reconciliation
      ↓
review / provenance / confidence
      ↓
topology + physical validation
      ↓
canonical political authority
      ↓
src/world/map/assets/historical/1326/runtime.json
      ↓
production MapBin
      ↓
runtime
```

No step may copy or relabel 1300 geometry.

## Acceptance tracking

GitHub Issue #107 remains open until:

1. A provenance-qualified 1326 source/runtime input exists.
2. Production build selects 1326 explicitly.
3. Legacy 1300 generation is available only through explicitly named legacy commands.
4. MapBin cannot silently fall back to 1300.
5. CI validates production scenario year and source identity.

Current state: **items 3 and 4 are now structurally enforced; item 1 is still the blocking dependency, so item 2 remains intentionally gated.**

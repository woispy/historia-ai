# T3-C — EARG / ARPG

EARG (Evidence-Aware Adaptive Reference Geometry) is the reference-geometry layer for Tier 3. ARPG (Adaptive Reference Point Graph) is its first executable point-selection engine.

## Contract

T3-C consumes already extracted/georeferenced source geometry plus historical/topological anchors and constraints. It does **not** infer political control and does **not** publish canonical geometry.

```text
source map metadata
        ↓
source detail profile
        ↓
source feature geometry
        ↓
mandatory / shape / constraint candidates
        ↓
hybrid importance scoring
        ↓
adaptive selection
        ↓
T3-C candidate reference point graph
```

## Source detail

Point density is not a fixed `10–15 points per border` rule. The engine derives a deterministic detail profile from:

- explicit source detail level, when supplied;
- map scale denominator;
- source pixel size/resolution.

The profile controls target spacing and bounded point counts. Local geometry can still promote high-value bends and constraints.

## Point classes

- `mandatory`: endpoints and explicit historical anchors. Locked.
- `shape`: characteristic geometry points selected from bend, sinuosity, effective-area and spacing signals.
- `constraint`: topology/historical/route constraints. Retained ahead of ordinary shape points.

## Importance model

The engine records separate components for:

```text
geometry
historical
 topology
source
scale
```

These are provenance/selection signals, not claims that a political boundary exists at the selected point.

## Non-authoritative rule

The returned graph is always:

```text
authoritative = false
status = candidate
```

T3-C must never turn source geometry into political truth by itself. Canonical publication remains downstream and requires physical clipping, shared-edge assembly, topology validation, historical validation and provenance checks.

## Next slices

1. T3-B/T3-C source-map metadata and georeference contract.
2. Historical-map feature extraction with semantic line classes.
3. Multi-source reference envelope/consensus.
4. Integration with the existing physical-land authority and shared-edge topology pipeline.
5. Multi-LOD output from one canonical geometry.

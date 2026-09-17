# Anatolia 1300 Golden Dataset Fixture

This directory is the contract fixture for Political Geography Authority v2.

It intentionally contains no generated or guessed province polygons yet. A province may enter the production authority only after its reviewed geometry, provenance and shared-edge topology are supplied.

Required future files:

- `coverage.json` - declared political coverage and boundary semantics.
- `provinces.json` - 38 province metadata/geometry references.
- `topology.json` - canonical political vertices, shared edges and faces.
- `provenance.json` - source references, confidence and review status. The current source review is explicitly blocked because the available 1300 GIS contains coarse polity features, not province boundaries.
- `lod.json` - deterministic geometry simplification references.

Promotion is blocked until the fixture reports:

```text
fallbackProvinceCount = 0
overlapCount = 0
internalGapCount = 0
sharedEdgeMismatchCount = 0
provenanceErrorCount = 0
```

The existing Phase 2D runtime output is not an acceptable fixture source. It remains legacy/research output until replaced by reviewed authoritative geometry.

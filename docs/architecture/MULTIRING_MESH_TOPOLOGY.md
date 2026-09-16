# Multi-ring Mesh Topology Gate

The mesh pipeline now distinguishes three states:

1. `simple`: one valid outer ring; deterministic simple-ring triangulation is allowed.
2. `requires-multiring-triangulation`: holes or islands exist; geometry is valid enough to classify, but mesh generation must stop until a hole-aware triangulator exists.
3. `invalid`: a ring is too small or a hole/island lies outside the outer ring.

This is intentionally a gate rather than a workaround. Filling a historical lake hole or dropping an island because the renderer lacks a triangulator would convert a presentation limitation into corrupted map geometry.

## Required future implementation

A hole-aware stage must:

- preserve `provinceId` and `geometryId`;
- preserve outer/hole/island topology;
- produce deterministic indexed triangles;
- verify triangle-area coverage against signed ring area with hole subtraction;
- reject self-intersections and overlapping rings;
- keep all source rings immutable;
- remain a renderer derivative and never write to canonical historical geometry.

Only after those tests are green should the mesh representation be considered for mapbin/GPU integration.

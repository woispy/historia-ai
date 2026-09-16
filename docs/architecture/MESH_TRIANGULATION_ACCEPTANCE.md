# Mesh Triangulation Acceptance Gate

A triangulator is not eligible for mapbin/GPU integration until all of the following are proven by automated tests:

- deterministic output for identical input;
- convex and concave outer rings;
- reversed winding;
- one or more holes;
- narrow corridors around holes;
- islands as independent filled components;
- self-intersection rejection;
- ring overlap rejection;
- no source-ring mutation;
- triangle-area conservation: outer area minus hole areas plus island areas;
- stable provinceId/geometryId propagation;
- no frame-time triangulation dependency.

The adversarial suite is intentionally a pre-integration gate. A failing geometry case must fail the build/test stage rather than fall back to triangle fan or silently fill a hole.

## Current status

The simple-ring triangulator is isolated and testable. The current hole bridge implementation is experimental and is **not yet accepted** as production mesh generation. The adversarial suite exists to expose bridge failures before any renderer integration.

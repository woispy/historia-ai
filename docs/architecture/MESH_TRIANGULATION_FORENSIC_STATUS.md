# Mesh Triangulation Forensic Status

## Current finding

The experimental hole-aware triangulator must not be treated as production-ready merely because it returns triangles. A bridge can create a self-intersecting or overlapping effective ring, and triangle-area conservation alone is insufficient to prove valid coverage.

## Required validation order

1. Validate each source ring.
2. Validate ring-to-ring containment and pairwise intersection rules.
3. Construct deterministic bridge candidates.
4. Validate the bridged ring again for self-intersection and winding.
5. Triangulate.
6. Validate every triangle is non-degenerate.
7. Validate triangle edges do not cross except at shared endpoints.
8. Validate triangle-area sum against the intended filled area.
9. Validate source rings remained unchanged.
10. Only then expose an indexed mesh to downstream consumers.

## CI evidence

The current mesh-branch commits have no GitHub Actions workflow runs or status checks attached yet. Therefore this document records implementation state only; it does not claim PASS/GREEN.

## Production gate

No mapbin/GPU integration is authorized until the full acceptance suite is independently GREEN. Canonical production remains unchanged.

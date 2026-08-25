# Historical GIS Recovery

Deterministic recovery helpers for historical anchors that fall outside the physical-land authority used by the Phase 2D generator.

## Architecture

- Historical anchors remain immutable source data.
- Recovery produces a geometry-only seed for generation.
- The physical-land authority is owned by the V15/V16 geometry layer.
- Recovery must never introduce a second coastline or polygon authority.
- Generated geometry must be validated against the same authority used by production.

Keep scenario-specific exceptions out of the core builder. Add reusable recovery behavior here instead.

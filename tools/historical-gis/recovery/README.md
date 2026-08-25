# Historical GIS recovery contract

Historical province anchors are immutable research inputs. Geometry recovery is temporary generation state.

## Authority

`physical-land-authority.mjs` is the single physical-land authority for recovery and V15 generation. It combines the curated physical land atlas with explicit coastline corrections and excludes runtime lake geometry.

## Recovery

`resolveGeometryAnchor()` first preserves a valid historical anchor, then performs deterministic local recovery, and finally validates a nearest boundary candidate. It either returns a point accepted by `isPhysicalLandPoint()` or throws a deterministic error.

No province-specific recovery rule belongs in the V15 builder or adapter.

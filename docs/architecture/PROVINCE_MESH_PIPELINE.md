# Province Mesh Pipeline

## Purpose

Define the renderer-only derivative between canonical historical polygon geometry and GPU draw buffers.

## Ownership

```text
Historical source/evidence
        ↓
Canonical political geometry
        ↓
Runtime polygon geometry
        ↓
Province mesh builder
        ↓
Indexed GPU mesh
        ↓
Renderer
```

Mesh generation is deterministic and presentation-only. It must never write back into canonical geometry, province ownership, historical control, or physical-land authority.

## Current stage

The first implementation supports one simple outer ring. It intentionally refuses holes and islands until a hole-aware topology stage is implemented.

## Identity

Every mesh must retain both `provinceId` and `geometryId`. Mesh vertex/index buffers are derivatives and are not authoritative identifiers.

## Performance target

Triangulation belongs in the build pipeline, not the frame loop. The renderer should consume precomputed indexed geometry and reserve per-frame work for visibility/culling, state updates, and drawing.

## Safety gates

- Reject self-intersecting rings.
- Reject degenerate rings.
- Preserve source coordinate order semantically; normalization must not mutate the canonical source object.
- Validate triangle-area sum against source polygon area within deterministic tolerance.
- Refuse unsupported holes/islands instead of silently filling them.

## Future

Implement multi-ring topology using the existing physical/historical geometry contracts. Only after that stage is proven should mesh data be integrated into mapbin or WebGPU buffers.

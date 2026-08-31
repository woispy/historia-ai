# Historia AI

## Phase C GPU geometry architecture

The historical HMAP/GIS data remains authoritative. Rendering consumes deterministic derived HGPU packs containing indexed vertices, indices, tile metadata, and four LOD ranges per province.

Runtime backend policy:

1. Prefer WebGPU when available.
2. Use compute frustum/LOD culling to populate indexed indirect commands.
3. Render with `drawIndexedIndirect` on WebGPU.
4. Fall back to WebGL2 indexed `drawElements`.
5. Province interaction is GPU-ID based; SVG/raster province interaction is not part of the GPU backend contract.

Phase C is not considered final until browser-backed rendering/picking, visual regression, full CI, production build, and repository cleanliness are green.

# Historia AI — GPU Map Engine v2

## Decision

The map runtime is now defined as a single GPU surface. React remains an application/UI orchestration layer; it is not the owner of camera-frame rendering.

### Runtime boundaries

- `ProvinceSoA`: typed-array province state and stable ID indexing.
- `QuadtreeIndex`: spatial candidate lookup for viewport/interaction work.
- `MapCameraRig`: frame-driven pan inertia, logarithmic zoom and pitch/yaw clamps.
- `GpuMapRenderer`: WebGL2 production compositor with an offscreen ID framebuffer for province picking and explicit GPU resource destruction.
- `WebGPUMapRenderer`: backend boundary for the next GPU backend; it is deliberately isolated from gameplay/UI.
- `MapEngineV2`: one React host canvas. Camera/hover/click work stays imperative.

## What changes compared with the previous renderer

The previous map combined an SVG world scene with a WebGL2 province texture compositor. Even when province fills were hidden, SVG paths remained part of the interaction/layout tree. Viewport culling was also a linear scan over province bounds.

The v2 entry point mounts one Canvas surface. Province selection is obtained from an offscreen ID target rather than SVG hit-testing. GPU resources have an explicit `dispose()` path, and the renderer keeps the frame loop outside React state.

## 15k+ province path

The current bridge still consumes the authoritative runtime geometry and creates the initial province/land textures once when the map data/style changes. This is intentionally outside the camera frame loop. The next migration stage replaces that bridge with a generated binary map atlas containing:

1. quantized province geometry / topology,
2. packed province ID tiles,
3. per-province metadata SoA blocks,
4. city hub blocks,
5. LOD-specific geometry ranges.

The renderer API is already separated so this asset format can arrive without another React rewrite.

## Coastline invariant

Physical land remains the sole coastline authority. Political data is never permitted to paint water. All future terrain, political, river, lake and fog passes must sample the same physical land/water mask or shared topology boundary.

## Performance target

144 FPS is treated as a budget target, not a promise that every device will reach it. The engine design targets approximately 6.94 ms total frame time on a capable desktop GPU, with map rendering allocated a small fraction of that budget. Hardware/browser profiling remains required before claiming a measured 144 FPS result.

## Next mandatory migrations

- Replace runtime Canvas2D rasterization with build-time binary/KTX2-compatible atlas generation.
- Replace fullscreen raster-only political geometry with tiled/LOD vector meshes for close zoom.
- Move water, rivers and terrain into GPU render passes.
- Add WebGPU storage-buffer/indirect-draw backend and use it where supported.
- Add GPU timer queries and a frame-budget regression harness.

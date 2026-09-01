# H2 — Binary Map Asset Source

## Decision

The runtime renderer no longer consumes `provinces[]` geometry objects and the Canvas2D raster bridge is removed from the active map path.

The runtime contract is:

```text
build-time GIS/runtime data
        ↓
      .mapbin
        ↓
ArrayBuffer → BinaryMapAssetSource
        ↓
TypedArray views / tile + LOD ranges
        ↓
BinaryMapRenderer → WebGL2 vertex buffer
```

`ProvinceSoA.fromBinary()` reads the same buffer directly. Geometry, bounds and ownership fields are stored in separate SoA sections so each field can be exposed as a zero-copy typed view.

## Binary sections

- fixed 64-byte header;
- province SoA: ids, owner, min/max bounds, centers;
- tile index: geometry offset/count + province index;
- geometry stream: Float32 longitude/latitude pairs;
- LOD ranges: tile offset/count per province/LOD;
- city block reservation;
- palette block.

All offsets are 4-byte aligned and validated before a view is exposed.

## Picking

The WebGL2 binary renderer uploads the immutable geometry stream once and reuses a persistent 1×1 RGBA8 picking framebuffer. Pointer events remain coalesced by `MapRuntimeController`.

`readPixels()` remains synchronous in this compatibility backend. H3 is responsible for moving the close-path picking and storage-buffer work to WebGPU/asynchronous GPU mechanisms where supported.

## Build/runtime boundary

`BinaryMapAssetBuilder` is build-oriented and exists to produce deterministic mapbin bytes from authoritative GIS-derived records. The production endpoint must load prebuilt `.mapbin` bytes rather than serialize JS province objects during application startup.

Until that loader is wired to the generated historical asset, a development bootstrap may construct a buffer from the current province records. This is a compatibility bootstrap, not the final startup path.

## Invariants

1. Physical GIS remains authoritative.
2. Binary pack IDs and geometry must be equivalent to the source asset.
3. Renderer code has no Canvas2D dependency.
4. Runtime province fields are typed-array views, not per-province object state.
5. 144 FPS remains a measured benchmark target, never an architectural claim.

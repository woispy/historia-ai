# H2 — Binary Map Asset Source

## Decision

The runtime renderer no longer consumes `provinces[]` geometry objects and the Canvas2D raster bridge is removed from the active map path.

The production runtime contract is now:

```text
Authoritative GIS
      ↓
Historical runtime asset build
      ↓
   world.mapbin
      ↓ fetch()
ArrayBuffer → BinaryMapAssetSource
      ↓
zero-copy TypedArray views
      ↓
BinaryMapRenderer / WebGPU backend
```

`ProvinceSoA.fromBinary()` exposes the same buffer-backed province fields. No browser-side province-object serialization is part of the startup path.

## Binary sections

- fixed 64-byte header;
- province SoA: ids, owner, min/max bounds, centers;
- tile index: geometry offset/count + province index;
- geometry stream: Float32 longitude/latitude pairs;
- LOD ranges: tile offset/count per province/LOD;
- city block reservation;
- palette block.

All offsets and section ends are validated before a typed view is exposed.

## Build/runtime boundary

`tools/build/build-mapbin.js` consumes the generated authoritative historical runtime JSON and writes `public/assets/world.mapbin`. The build scripts execute the historical GIS import before the mapbin pack step, so the browser receives a prebuilt asset.

`src/map/runtime/MapBinLoader.js` performs only:

```text
fetch('/assets/world.mapbin')
        ↓
response.arrayBuffer()
        ↓
BinaryMapAssetSource.fromArrayBuffer()
```

The former `src/map/runtime/BinaryMapAssetBuilder.js` client bootstrap has been removed.

## Zero-copy invariants

For the loaded buffer, the runtime contract requires:

- `source.ids.buffer === buffer`;
- `source.owner.buffer === buffer`;
- `source.minX.buffer === buffer`;
- `source.centerX.buffer === buffer`;
- `source.geometry.buffer === buffer`;
- `source.tileIndex.buffer === buffer`;
- `source.lodRanges.buffer === buffer`;
- `source.palette.buffer === buffer`.

`ProvinceSoA.fromBinary(buffer, source.header)` must preserve the same backing buffer for every binary province field. Derived `flags` and the ID lookup map are the only runtime-side structures.

## GIS ↔ binary equivalence

The build/test contract uses an authoritative province/geometry fixture and verifies IDs, ownership, bounds, centers, geometry ordering, tile ranges and LOD ranges after binary decode. This is the gate preventing a binary pack from silently becoming a second, divergent cartographic authority.

## H2 status

**GREEN at the architectural/build/runtime contract level.** A measured browser startup/throughput benchmark remains a separate performance gate and is not inferred from the asset pipeline alone.

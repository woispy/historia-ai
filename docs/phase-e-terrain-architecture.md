# Phase E — Terrain, physical topology and tile/LOD streaming

Phase E moves terrain LOD from presentation metadata into the geometry/data plane.

## Runtime contract

```text
Camera
  │
  ├── view bounds ───────────────┐
  │                              ▼
  └── camera distance → Terrain LOD policy
                                 │
                                 ▼
                        spatial terrain tiles
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
         heightmap             normal             splat
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                        Terrain geometry
                                 │
                         shared land mask
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
          political            rivers              lakes
          topology             water               water
```

## Geometry LOD

| LOD | Scope | Intended geometry |
| --- | --- | --- |
| 0 | World | low topology |
| 1 | Regional | simplified borders |
| 2 | Province | detailed province mesh |
| 3 | City | high-detail terrain |
| 4 | Close | terrain + rivers + settlements |

The thresholds are policy values, not claims about final hardware performance. They
remain centralized so browser/GPU profiling can tune them without changing asset
formats.

## Terrain material

The first material pass intentionally avoids heavy PBR. It consumes:

- heightmap;
- normal map;
- logical five-layer splat weights: desert, forest, steppe, rock, snow;
- physical land mask;
- base color, roughness and ambient material parameters.

The five logical splat weights are represented as RGBA plus a grayscale snow channel
because WebGL2 color textures are four-component at this boundary.

## Physical topology invariant

The Natural Earth-derived physical land source remains the coastline authority. Terrain
must not generate or repair political coastlines. Every terrain tile has a land-mask
sampling contract and edge signatures are available for deterministic neighbor checks.

Hydrology continues to be owned by the Phase D Water Engine. Terrain consumes the same
physical topology instead of duplicating lake/coast logic.

## Streaming boundary

The renderer should request only tiles intersecting the camera bounds plus a small
look-ahead/padding ring. LOD and tile selection are coupled: close LOD uses finer tiles,
while world LOD uses a single coarse tile set. A hard tile budget prevents an accidental
15k-province camera sweep from turning into an unbounded terrain upload.

The current Phase E branch establishes the contracts and deterministic planners first.
Actual DEM-derived terrain assets and the GPU upload/render pass are the next implementation
step; no fabricated elevation dataset is introduced as physical truth.

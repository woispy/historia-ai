# GPU Map Engine — Required Migration Sequence

## Target architecture

```text
React / GameShell
        │ coarse scenario + selection changes
        ▼
MapEngine host (one canvas)
        │
        ├── WebGPU backend (preferred)
        │      ├── storage-buffer province SoA
        │      ├── compute visibility/culling
        │      ├── indirect draws
        │      └── GPU ID/picking target
        │
        └── WebGL2 backend (compatibility)
               ├── texture/mesh atlas
               ├── batched draws
               └── FBO ID/picking target

Data plane
  binary map packs → TypedArrays → GPU buffers/textures

Simulation plane
  province population/economy state → SoA → Worker/SharedArrayBuffer
```

## Mandatory stages

### A — GPU surface
Completed in `refactor/gpu-map-engine-v2`:

- one Canvas host;
- imperative WebGL2 render loop outside React state;
- FBO-based province picking;
- explicit GPU resource destruction;
- 2.5D camera rig with pitch/yaw clamps and inertial state;
- province SoA and quadtree primitives;
- backend-neutral WebGPU boundary.

### B — Binary data plane

Build `*.mapbin` region packs from the already-authoritative GIS assets.
Each pack should contain a fixed header, province index table, quantized geometry
stream, topology/edge table, city hub table, and LOD offsets. Load only packs
intersecting the camera region.

### C — WebGPU vector path

Move close/province/city LOD geometry out of the fullscreen raster bridge and
into storage buffers. Run visibility classification on the GPU, write an indirect
draw list, and render province fill/border layers from the same topology stream.

### D — Water / terrain passes

- one water shader for lakes + sea;
- river centerlines as flow curves with per-segment packed tangent/width;
- terrain height/normal/splat textures;
- shared land/water mask at every pass;
- fog-of-war as a GPU coverage texture.

### E — Simulation SoA

No per-province React state. Keep hot population, GDP, food, manpower,
stability and migration values in packed arrays. Move monthly/weekly simulation
batches to Web Workers. UI observes snapshots rather than owning the simulation.

### F — Quality/performance gates

Required benchmark gates before calling the 144 FPS target achieved:

- 15,000 province synthetic scenario;
- 4K display, 2x DPR;
- camera sweep world → province → city;
- hover/pick under continuous movement;
- no sustained long-task frame stalls;
- GPU and CPU heap stable over a 30-minute soak;
- renderer frame budget target ≤ 6.94 ms for 144 Hz capable hardware.

A 144 FPS number must be measured on the target hardware/browser; architecture alone
cannot guarantee that every device will sustain 144 Hz.

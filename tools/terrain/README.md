# Phase E Terrain Data Pipeline

Terrain geometry must be derived from authoritative geographic data. This pipeline does not generate invented mountains, coastlines, lakes, or elevation fields.

## Elevation authority

Primary source: Copernicus DEM.

- `COPERNICUS_30`: GLO-30 Public where released, with GLO-90 fallback in the Copernicus service.
- `COPERNICUS_90`: GLO-90 global baseline.

The pipeline records the exact source instance and source tile identifiers in every terrain manifest.

## Processing contract

1. Acquire source DEM tiles without altering the source values except for documented resampling/reprojection.
2. Reproject/resample into the engine's terrain tile grid.
3. Preserve vertical units in metres and the source vertical reference in metadata.
4. Derive normals from the resampled elevation field; never author normals independently.
5. Derive terrain biome/splat weights from elevation, slope, latitude and authoritative land/land-cover inputs; the weights are presentation data, not new physical geography.
6. Reuse the existing physical land mask as the clipping authority.
7. Generate LOD-specific geometry by deterministic simplification/downsampling of the authoritative elevation field.
8. Validate tile seams against the parent/neighbor elevation samples before a tile becomes streamable.

## Important distinction

Copernicus DEM is a Digital Surface Model (DSM), so vegetation/buildings can influence the elevation surface. The engine therefore labels the source as `DSM` and does not silently claim that it is bare-earth terrain.

If a future authoritative bare-earth source is introduced, it must be versioned as a separate elevation authority and compared against the existing source before replacing it.

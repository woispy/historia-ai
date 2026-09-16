# Mapbin → GPU Forensic Findings

Status: forensic control; no production mutation authorized.

## Canonical findings

1. `tools/build/mapbin-encoder.js` performs a second polygon normalization before serialization, including duplicate/retraced-loop removal and an `AREA_EPSILON` of `1e-12`. This is downstream serialization behavior and must never become historical geometry authority.

2. The encoder copies normalized runtime coordinates into a build-time JavaScript array and then into the final binary `Float32Array`. This is an intentional build-time copy. Browser `BinaryMapAssetSource` is zero-copy over the downloaded ArrayBuffer.

3. `WebGPUMapRenderer.createAssetBuffers()` creates GPU copies of IDs, bounds, geometry, tiles and LODs; bounds are additionally rebuilt as a derived CPU `Float32Array`. These are rendering derivatives.

4. The culling compute shader rebuilds triangle indices every frame and submits them through an indirect indexed draw. The renderer therefore does frame-time geometry expansion rather than consuming pre-triangulated index data.

5. The current compute shader emits `(pointOffset, pointOffset+k, pointOffset+k+1)`, a triangle-fan assumption. This is a correctness risk for concave historical polygons. The old ear-clipping GPU chain is historical/parallel and must not be copied wholesale into canonical production.

6. The renderer allocates `geometryPointCount * 3` indices as a conservative upper bound. Exact/bounded allocation should be derived from tile records and measured at 15K scale before changing it.

7. Mapbin currently writes one LOD range per province. `BinaryMapAssetSource.getProvinceGeometryRange(index, lod)` uses `index + lod`; therefore `lod > 0` would address another province's record. Current rendering uses LOD 0, so this is latent API debt.

## Remediation order

- Keep canonical geometry immutable.
- Add structural tests for mapbin normalization, tile/LOD ownership and concave-ring behavior.
- Introduce a dedicated build-time triangulation stage downstream of canonical geometry.
- Prefer precomputed indexed geometry over frame-time triangle generation where profiling proves beneficial.
- Replace conservative index allocation with a measured exact/bounded strategy.
- Reject unsupported `lod > 0` until genuine multi-LOD records exist.
- Benchmark memory, CPU submission, compute cost and frame time at 15K+ provinces before production changes.

No production branch or historical GIS constants were changed by this forensic pass.

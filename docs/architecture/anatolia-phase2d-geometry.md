# Historia AI — Phase 2D Historical Province Geometry

## Goal

Phase 2D converts the Phase 2B/2C Anatolia province vocabulary into an actual runtime cartographic layer. The target is an EU5-inspired grand-strategy presentation: country fills remain dominant, province borders are a separate topology layer, and physical water remains visually authoritative.

## Geometry model

The runtime layer uses 38 stable province identities. Geometry is generated deterministically from WGS84 cartographic sites rather than screen coordinates.

```text
province metadata
      ↓
cartographic sites
      ├── city/province anchors
      ├── dense land control field
      ├── historical source anchors
      └── physical barrier field
            ├── outer coastline
            ├── seas
            └── lakes
      ↓
deterministic tessellation
      ↓
province multi-polygons
      ↓
province topology
      ↓
SVG fill + shared borders
```

## Physical coastline is a hard constraint

The previous Phase 2D geometry used coastline points as ordinary province sites. That produced a visually obvious failure mode: a Voronoi cell could extend from the Anatolian coast into the sea or all the way to the builder bounding box.

The refinement layer now treats physical coastlines and internal water boundaries as **barrier sites**. Barrier sites participate in the tessellation but never become political provinces. Dense coastline sampling means province cells terminate at the physical coast rather than at the rectangular builder envelope.

The same rule is applied to the mapped internal seas and lakes. This prevents Marmara, İzmit, İzmir, Gökova, Antalya and other mapped water bodies from becoming political fill.

## Land authority

`AnatoliaPhysicalAtlas.landPolygons` is now consulted when generating political control sites. A political site is not created merely because it falls inside the numeric Anatolia bounding box; it must also lie on physical land and outside mapped water.

This makes the following invariant executable rather than purely visual:

> A Phase 2D province control site must be on physical land.

Polygon centroids are also validated against the same land/water authority.

## Coast detail

The outer coastline is sampled at a smaller interval than the original Phase 2D pass. A second inward coastal control field preserves province detail immediately behind the coast while the barrier field prevents cells from crossing into water.

This is particularly important for the next visual refinement targets:

- Aegean coast and gulfs
- Marmara and the Bithynian coast
- Black Sea coast around Sinop and Trebizond
- Mediterranean / Cilician coast

## Historical caution

Phase 2D is a cartographic reconstruction, not a claim that the medieval frontier was surveyed to modern cadastral precision. Political ownership and uncertainty remain in the Phase 2B historical metadata layer. Physical constraints are high-confidence geography; exact medieval political boundaries remain subject to source-backed refinement.

## Runtime scope

- Anatolia: Phase 2D geometry.
- Rest of the 1300 world: existing source-derived historical GIS geometry.
- Physical geography: existing physical atlas and land/water authority.

## Rendering

Province fills do not own their visible border stroke. Shared topology owns the province/country border hierarchy. Physical water remains visually authoritative in the render stack.

## Performance

Geometry is generated during the historical GIS build, not in React. The runtime receives one consolidated JSON asset. Barrier sites are discarded after tessellation and do not become runtime provinces.

The tessellation remains deterministic so regenerated assets are reproducible.

## Next refinement

The next cartographic pass should add source-backed constraints rather than another generic polygon algorithm:

1. hand-reviewed Aegean/Marmara coastal anchors;
2. province-specific river boundary constraints where historically defensible;
3. mountain-pass and watershed constraints;
4. city hinterland shapes for major urban centers;
5. final historical audit of the most strategically important provinces.

Those refinements must modify builder inputs and metadata, not introduce screen-coordinate hacks or a second rendering system.

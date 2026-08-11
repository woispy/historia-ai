# Historia AI — Phase 2D Historical Province Geometry

## Goal

Phase 2D converts the Phase 2B/2C Anatolia province vocabulary into an actual runtime cartographic layer. The target is an EU5-inspired grand-strategy presentation: country fills remain dominant, province borders are a separate topology layer, and physical water remains visually authoritative.

## What changed

The 1300 runtime no longer uses the broad source-derived political polygons as the visible province geometry for the Anatolia envelope. They are still used as the historical GIS source and research basis.

Inside the Anatolia envelope, the importer creates 38 stable province assets from the Phase 2B identity registry and generates deterministic multi-site Voronoi geometry around:

- province/city anchors;
- a dense land control field;
- coastline control points;
- source-derived historical shape anchors.

This produces a much finer province mesh without hard-coding hundreds of screen coordinates by hand.

## Why multi-site geometry

A province is allowed to contain multiple polygon fragments. The province fill renderer draws these fragments as one SVG path, while `ProvinceBoundaryLayer` owns the visible border topology. This prevents internal fragments of the same province from becoming fake political borders.

```text
province metadata
      ↓
cartographic sites
      ├── city anchor
      ├── land field
      ├── coastline points
      └── historical source anchors
      ↓
deterministic tessellation
      ↓
province multi-polygons
      ↓
province topology
      ↓
SVG fill + shared borders
```

## Physical geography authority

Phase 2D does not replace `AnatoliaPhysicalAtlas`. The province layer is still rendered inside the world land mask, and water is rendered after the political layer. The Anatolia envelope deliberately excludes European Thrace around Constantinople and Adrianopolis while keeping the Black Sea Anatolian coast, including Sinop and Trebizond.

This keeps the following invariant:

> Political province geometry cannot visually become the sea.

## Historical caution

Phase 2D is a cartographic reconstruction, not a claim that the medieval frontier was surveyed to modern cadastral precision. The geometry therefore follows the stable province vocabulary and records historical confidence in the metadata layer. The exact 1300 political control of uncertain frontier areas remains separate from geometry.

## Runtime scope

- Anatolia: Phase 2D geometry.
- Rest of the 1300 world: existing source-derived historical GIS geometry.
- Physical geography: existing physical atlas and land/water authority.

## Performance

The geometry is generated during the historical GIS build, not in the React render path. The runtime receives one consolidated JSON asset. Province fills remain one SVG path per province even when a province contains many sub-polygons. Shared borders are rendered by the existing topology layer.

## Next work

Phase 2D is intentionally not the final historical cartographic research pass. The next map research layer can add hand-reviewed boundary anchors for individual provinces, river-crossing constraints, mountain passes and historically documented city hinterlands. Those refinements should modify the deterministic builder inputs rather than introduce a second renderer or a collection of screen-coordinate hacks.

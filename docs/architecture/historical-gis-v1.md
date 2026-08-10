# Historical GIS Runtime v1

## Goal

The map runtime treats historical geography as an asset layer rather than as mutable simulation state.

```text
1300 GeoJSON source
      ↓
HistoricalGeometryImporter
      ↓
HistoricalProvinceAssetBuilder
      ↓
Province / Geometry assets
      ↓
Historical repositories
      ↓
1300 ownership resolution
      ↓
SVG Renderer
```

## Source

The 1300 importer targets the `world_1300.geojson` layer from `aourednik/historical-basemaps`.
The project describes this dataset as a historical world/cultural-region basemap, not as a modern administrative-province dataset. Its borders are approximate and source-dependent.

The source is therefore treated as **historical territorial geometry**. Historia AI may expose each imported feature through the Province runtime because provinces are the game's simulation unit, but this does not claim that every imported polygon was a formally administered province in 1300.

## Runtime precedence

For the active scenario date:

1. If date-specific historical geometry assets exist, use them.
2. If no historical geometry assets exist, use the generated fallback geometry.
3. Historical ownership is applied independently from geometry.
4. Simulation systems continue to operate on the same province repository.

This separation is intentional: a future GIS source can replace geometry without rewriting population, economy, military or diplomacy systems.

## Ownership resolution

Historical ownership is resolved in this order:

1. explicit `provinceOwnership` entry;
2. explicit `sourceFeatureOwnership` entry;
3. exact historical-name match against the scenario country registry and optional aliases;
4. legacy `geometryOwnership` ISO mapping;
5. existing province owner;
6. scenario `defaultCountryId`.

Unresolved features therefore remain explicitly marked as `local_polities` instead of being assigned to a guessed country.

## Import

Download and import the 1300 source:

```text
npm run build:historical-gis:1300
```

Or import an already downloaded GeoJSON file:

```text
node tools/historical-gis/cli/import-1300.js <path-to-world_1300.geojson>
```

Validate generated assets:

```text
npm run validate:historical-gis:1300
```

The generated source file is intentionally kept outside the application bundle. Generated historical assets should only be committed when redistribution is permitted by the source license and repository policy.

## Geometry format

Runtime geometry uses longitude/latitude coordinates in WGS84 / EPSG:4326. Polygon assets store outer rings as arrays of `[longitude, latitude]` pairs.

The renderer is vector based and repeats the world horizontally. The camera longitude is continuous; it does not jump from `+180` to `-180`.

## Performance rules

- Do not attach CSS filters to every province path.
- Keep the number of repeated world copies bounded.
- Batch pointer movement through `requestAnimationFrame`.
- Prefer SVG vector rendering over rasterized map screenshots.
- Keep historical metadata on province models so rendering does not need a second state lookup.

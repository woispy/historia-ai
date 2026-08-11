# Historia AI — Phase 2C Anatolia Geometry Refinement

Phase 2C is the final map-only refinement layer of Phase 2.

## Authority order

1. Physical geography atlas
2. Source-derived 1300 GIS geometry
3. Phase 2B historical province identity
4. Phase 2C cartographic refinement metadata
5. Mutable runtime ownership

No political layer is allowed to override the physical coastline.

## Why runtime no longer imports the broad regional overlay

The Phase 2B regional overlay was intentionally approximate. It was useful for historical research and visual comparison, but importing those large polygons as runtime provinces created two risks:

- a broad uncertain political reconstruction could look more authoritative than the source GIS geometry;
- the broad polygon could produce false topology and province borders.

Phase 2C therefore keeps the regional JSON as research data and removes it from the runtime import pipeline.

## Province refinement model

`src/map/data/AnatoliaProvinceRefinement.js` supplies every Phase 2B province with:

- WGS84 anchor;
- terrain class;
- movement cost;
- defense modifier;
- winter severity;
- agricultural suitability;
- relative settlement density;
- historical adjacency hints.

These are intentionally coarse simulation inputs. They are not claims of exact medieval statistics.

## Strategic geography

The same file records selected passes, corridors and river crossings. They are map facts that future systems can use for movement, supply, trade and province connectivity.

The geometry-derived `ProvinceTopology` remains the authoritative graph for the current imported polygons. Historical adjacency hints are a second, explicit layer that can survive future geometry replacement.

## Historical method

The project uses the 1300 historical-basemaps layer as a starting point and cross-checks the historical interpretation against scholarly references. The source project itself describes its maps as work in progress and recommends comparison with other sources.

For the Ottoman homeland, Clive Foss's Oxford study emphasizes the physical environment and the frontier geography of Bithynia, Söğüt, Eskişehir, Germiyan and the Sangarius. For the beyliks, TDV İslâm Ansiklopedisi provides broad regional and chronological anchors.

The code records uncertainty instead of converting uncertain historical claims into exact-looking polygons.

## Completion rule

Phase 2 is complete after Phase 2C. Future changes that require new or more precise medieval polygons should be treated as a dedicated cartographic research task, not silently folded into the simulation engine.

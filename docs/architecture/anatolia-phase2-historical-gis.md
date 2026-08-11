# Historia AI — Phase 2: Anatolia Historical GIS Core

## Objective

Phase 2 converts the map from a country-shaped polygon prototype into a reusable grand-strategy geography layer.

The design follows the visual hierarchy we want from modern grand-strategy maps:

```text
Physical world
    ↓
Country-colored land
    ↓
Province boundaries
    ↓
Country boundaries
    ↓
Cities / ports
    ↓
Terrain / rivers / mountains
```

The implementation is not an image or hand-painted map. All geometry remains data-driven SVG.

## Province versus country

A province is a persistent simulation geography. Its owner/controller may change without changing the province identity.

Country identity is therefore not encoded into the province geometry itself.

The current 1300 source provides 237 historical political/cultural GIS features. These are imported as provisional runtime province units. The curated 16-region Anatolia/Byzantium layer is no longer rendered as province geometry in Phase 2; it remains historical research metadata/ownership context.

This prevents the old large regional polygons from visually competing with the detailed province layer.

## Topology

`ProvinceTopology` derives adjacency from shared polygon edges.

For every exact shared edge it records:

- province A
- province B
- province border vs country border
- edge endpoints

It also builds a conservative bounding-box fallback adjacency relation for graph queries when historical source geometry contains tiny coordinate gaps. The fallback is never rendered as a boundary line.

Validation requires:

- no self-neighbours
- symmetric adjacency
- existing neighbour references
- valid border kinds
- valid border coordinates

## Coastline rule

The political map is still rendered inside the global physical land mask. The province layer therefore cannot paint over the ocean.

The physical coastline is authoritative and is not regenerated from country ownership.

## Border visual hierarchy

At overview zoom:

- country borders are visible
- province borders are subdued

At regional zoom:

- province borders become clearer
- country borders remain stronger

At close zoom:

- province borders become the primary political grid
- city/fort/port markers become more detailed

Approximate historical borders use a dashed/subdued treatment rather than pretending to be cadastral lines.

## City and camera direction

Cities now follow a tiered hierarchy:

- capital
- major
- town
- village (future-ready)

Labels scale by zoom and use deterministic candidate placement.

Clicking a city focuses the camera on its WGS84 coordinate and chooses a tier-appropriate regional zoom. This gives the map the same broad interaction pattern we want from grand-strategy maps without coupling the camera to game logic.

## Historical accuracy policy for 1300

The political reconstruction is intentionally conservative. Medieval political frontiers were not modern cadastral borders, and several western Anatolian beyliks were still emerging around 1300.

Examples used when assigning confidence:

- Germiyan was based around Kütahya and Yakub Bey's independent phase begins around 1300.
- Menteşe was already established in southwestern Anatolia by around 1300.
- Hamid's Isparta/Burdur/Eğirdir polity belongs to the early 14th-century transition; sources place Dündar Bey's foundation around 1301.
- Aydın's formal establishment is generally placed in the early 14th century, with 1308 commonly given.
- Saruhan's Manisa-centered territorial consolidation belongs to the early 14th century; the current renderer therefore treats its frontier confidence as low rather than presenting a precise 1300 cadastral border.
- Karesi is also treated as an emerging frontier rather than an artificially exact 1300 state border.

The game may still expose a playable 1300 political scenario, but the data model retains confidence metadata so later research can replace an approximation without changing the simulation architecture.

## Sources consulted

- Euratlas 1300 historical GIS / Aegean and Rûm snapshots.
- Cambridge, *New Cambridge History of Islam*, discussion of Anatolia around 1300.
- Oxford Academic, Clive Foss, *The Beginnings of the Ottoman Empire*, homeland of the Ottomans.
- TDV İslâm Ansiklopedisi entries for Saruhan, Aydın, Germiyan, Hamid, Menteşe and Anatolian beyliks.
- Turkish Historical Society overview material on Menteşe.
- Historical-basemaps project documentation and its WGS84/BORDERPRECISION conventions.

## Next Phase 2 work

1. Replace provisional province shapes with a reviewed Anatolian province topology.
2. Add explicit coastline-adjacent province metadata and sea-zone access.
3. Add ports and straits as navigation nodes.
4. Add mountain passes and river crossings.
5. Add road graph.
6. Add country-level dissolved border geometry generated from province ownership.
7. Add province/city selection states and map-mode transitions.

The important invariant is that none of these gameplay systems should need to know how SVG polygons are drawn.

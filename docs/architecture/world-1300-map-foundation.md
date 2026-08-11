# Historia AI — World Map 1300 Foundation

## Goal

The map engine now separates three different authorities:

1. **Physical geography** — land, coastline and water.
2. **Historical political geography** — who controls a place in the selected year.
3. **Gameplay state** — province ownership, armies, cities, trade and events.

A political polygon is never allowed to define the coastline.

## Global water rule

The SVG world always starts with a single ocean-colored physical background. A global land mask is then drawn from the repository's Natural Earth-derived geometry assets.

Political geometry is clipped to that land mask before it reaches the renderer.

This gives the following invariant everywhere in the world:

```text
sea background
     ↓
physical land mask
     ↓
historical political geometry
```

Therefore a malformed historical polygon cannot paint an ocean blue/green/political color over the physical sea.

## Why Natural Earth is the physical authority

Natural Earth provides global land/coastline data at 1:10m, 1:50m and 1:110m scales. The repository already contains Natural Earth-derived country geometry assets, so the first implementation reuses those assets instead of introducing a second incompatible geometry pipeline.

This is a **physical** choice, not a political one. The current Natural Earth geometry is not being presented as the political borders of 1300.

## 1300 historical research policy

The political layer is being reconstructed separately because medieval borders were not surveyed modern nation-state borders. The 1300 registry therefore stores a confidence field:

- `high` — comparatively well-defined state extent
- `medium` — good historical consensus but not a cadastral border
- `low` — frontier/overlordship/nominal-control zone needs regional reconstruction

The first historical anchor registry covers Anatolia and the major powers connecting it to the eastern Mediterranean, Caucasus, Iran, steppe, India, China, Japan, Europe and Africa.

## Anatolia 1300 priorities

The next historical GIS pass should refine, in order:

1. Constantinople / Thrace / Bosporus
2. Bithynian Byzantine frontier
3. Osmanoğulları core
4. Karesi
5. Saruhan
6. Aydın
7. Menteşe
8. Germiyan
9. Hamid / Eşref / Sâhib Ata / İnanç transition zones
10. Karaman
11. Candar / Çobanoğlu transition
12. Trebizond
13. Cilicia
14. Ilkhanid suzerainty and effective-control distinction

The early Ottoman frontier is deliberately marked lower-confidence than a modern cadastral border. Scholarship emphasizes the fragmented and fluid nature of the frontier around 1300.

## City anchors

The existing Anatolia city atlas remains the authoritative detailed city layer. The world registry adds a small set of cross-regional anchors so the eventual global map can use the same coordinate contract.

All coordinates use WGS84 longitude/latitude.

## Research references

- Euratlas Periodis — Europe in 1300: historical sovereign-state/dependency reference.
- Cambridge History of Turkey — Anatolia, 1300–1451 and Anatolia under the Mongols.
- Oxford Academic, *The Beginnings of the Ottoman Empire* — Osman and his western Anatolian neighbours.
- TDV İslâm Ansiklopedisi — individual Anatolian beylik studies, including Saruhan.
- Natural Earth — global physical land/coastline source already represented in repository geometry assets.

## Future political geometry pipeline

```text
Historical sources
      ↓
1300 polity registry
      ↓
regional boundary reconstruction
      ↓
physical coastline snap
      ↓
province subdivision
      ↓
province topology validation
      ↓
city anchors
      ↓
renderer
```

No future political polygon should be accepted if it crosses the physical land mask without an explicit historical coastal exception.

## EU5-style visual direction

The target is a clean grand-strategy hierarchy rather than a painted illustration:

- distinct ocean/land palette
- readable country colors
- subtle terrain beneath political color
- thin but clear internal borders
- stronger country borders
- city tiers
- ports
- rivers and mountain passes
- zoom-dependent labels
- map-mode-ready layers
- no large opaque sea rectangles

The generated concept art is a visual direction only; the game implementation remains data-driven SVG code.

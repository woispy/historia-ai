# Historia AI — Physical Geography 2.0

Status: Implemented in the Map Engine v1 renderer

Version: 2.0

## Purpose

Physical Geography 2.0 establishes a real physical layer instead of treating geography as decorative polygons.

The system remains read-only from the renderer's perspective and is independent from political ownership.

## Layer contract

```text
Physical Land Base
        ↓
Political Province Overlay
        ↓
Physical Water Mask
        ↓
Channels / Coastline / Lakes
        ↓
Rivers / Mountains
        ↓
Physical Labels
        ↓
Cities / Gameplay overlays
```

Political data may cover land, but it must never define the physical coastline.

## 1. Physical land authority

`ANATOLIA_PHYSICAL_ATLAS.landPolygons` is the physical mainland mask.

It is used for:

- land base rendering
- water inverse clipping
- curated province clipping
- coastline rendering

The political layer is not allowed to redefine the coastline.

## 2. Water model

Water bodies are represented by broad world-space envelopes. They are clipped against the physical land mask using an even-odd SVG clip path.

This is intentional. A water envelope may safely overlap land in source data because the land mask is the final physical authority.

Primary water bodies:

- Black Sea
- Marmara Sea
- Aegean Sea
- Mediterranean Sea
- Gulf of İzmit
- Gulf of Edremit
- Gulf of İzmir
- Gulf of Gökova
- Antalya Gulf
- İskenderun Gulf

Narrow channels such as the Bosporus and Dardanelles are rendered as explicit physical water channels after the inverse water mask.

## 3. Coastline

The coastline is derived directly from the physical land polygon rather than from political borders.

This removes the previous failure mode where political province geometry could visually become the coast of the sea.

## 4. Physical labels

Physical labels are data-driven objects with:

- stable id
- world position
- kind
- priority
- zoom range
- font size
- safe bounds
- deterministic offset candidates

`PhysicalLabelLayout` performs deterministic greedy placement.

At overview zoom, only the four primary sea labels are visible:

- EGE DENİZİ
- MARMARA DENİZİ
- KARADENİZ
- AKDENİZ

Regional labels are intentionally deferred until closer zoom so they do not compete with cities.

The layout service never knows about React, camera state or gameplay state.

## 5. Terrain

Terrain is a secondary visual layer. It provides broad lowland, plateau and highland context without becoming a second political map.

The terrain layer is deliberately translucent.

## 6. Hydrology

Major rivers are independent geometry. They do not belong to provinces.

This allows future systems to use the same river graph for:

- movement cost
- crossings
- agriculture
- settlement density
- trade
- climate

without changing the renderer.

## 7. Lakes and islands

Lakes and islands are first-class physical features. They are not stored as provinces and do not inherit political ownership.

## 8. Future expansion

Physical Geography 2.0 is designed to support the next stages without changing the rendering architecture:

### 2.1

- sea zones
- ports
- straits
- river crossings
- navigability metadata

### 2.2

- road network
- terrain movement cost
- mountain passes
- climate regions
- forest regions

### 2.3

- spatial indexing
- viewport culling
- LOD
- chunk streaming

### 2.4

- trade sea lanes
- seasonal rivers
- floodplains
- historical landscape states

## 9. Data ownership

```text
World
 └── Physical Geography data
      ├── Geometry
      ├── Hydrology
      ├── Terrain
      ├── Water
      └── Labels

Political World
 └── Province / Country ownership

Renderer
 └── Reads both systems and draws them
```

Physical geography never stores country ownership.

Province data never stores physical geography.

## 10. Regression requirements

The Physical Geography test suite validates:

- coordinate validity
- closed land geometry
- major water bodies
- channels
- islands
- lakes
- rivers
- mountain systems
- terrain regions
- label identity
- overview label visibility
- close-zoom regional labels
- deterministic non-overlapping label placement

Any future physical layer change must preserve these invariants.

# Historia AI — EU5DB Mekânsal Hiyerarşi Referans Analizi

## Status
**Role:** comparative cartography / hierarchy reference
**Authority:** NOT historical 1326 political authority
**Target scenario:** 1326-04-07
**Production effect:** none until separately accepted

EU5DB is useful here not because it tells Historia AI who owned a territory, but because it exposes a clear distinction between **İl (Location)** and **Vilayet (Province)** and then aggregates them into **Alan (Area)** and **Bölge (Region)**. The EU5DB map catalogue explicitly exposes separate map modes for İl, Vilayet, Alan, Bölge, Alt Kıta and Kıta. citeturn0search0

## 1. What we can reuse conceptually

```text
İl / Location
    ↓
Vilayet / Province
    ↓
Alan / Area
    ↓
Bölge / Region
    ↓
Alt Kıta / Subcontinent
    ↓
Kıta / Continent
```

EU5DB also presents location-level data such as owner, culture, religion, population, topography, vegetation, climate and raw material, while higher-level pages aggregate locations into provinces/areas/regions. citeturn0search1turn0search5

For Historia AI, the important lesson is **not to copy EU5 data**, but to keep spatial granularity explicit.

## 2. Proposed Historia AI interpretation

### İl — local geographic unit

`İl` should represent the smallest meaningful persistent geographic unit used by the simulation/cartography layer.

Possible responsibilities:
- settlement/city and surrounding local population;
- local terrain/topography;
- local resources;
- local roads and rivers;
- local development/economic values;
- local cultural/religious composition;
- local map interaction and selection.

An İl can exist without implying a historical modern administrative province.

### Vilayet — province-scale geographic aggregation

`Vilayet` should represent a larger spatial unit composed of one or more İller.

Its primary role should be:
- cartographic grouping;
- regional administration/gameplay aggregation;
- province-level statistics;
- province-level map interaction;
- aggregation of child İl data;
- higher-level topology and rendering simplification.

Crucially, **Vilayet must not be treated as proof of 1326 political ownership**.

The word Vilayet here is an engine/data-layer term unless a specific historical source establishes a period-appropriate administrative meaning.

## 3. Geometry rule

The hierarchy should not create synthetic political borders.

Preferred model:

```text
Authoritative/local geography
        ↓
İl geometry
        ↓
validated aggregation
        ↓
Vilayet geometry
        ↓
Area / Region aggregation
```

Where a Vilayet is defined as a grouping of child İller, its displayed boundary should be derived from the accepted child geometry rather than independently invented with Voronoi, jitter, centroid expansion, or fallback polygons.

This preserves the existing constitutional rule:

```text
candidate ≠ reviewed ≠ canonical
```

and does not weaken the current political-geometry authority gate.

## 4. Important distinction from political state

Spatial hierarchy and political state remain separate:

```text
GEOGRAPHY
İl → Vilayet → Alan → Bölge

POLITICAL STATE
owner
controller
occupation
war
subject relationship
```

A political change therefore updates state attached to geography; it does not rebuild the underlying geographic hierarchy.

This is consistent with the existing 1326 authority contract: political owner/controller/occupation are scenario state, while political geometry is immutable canonical data once promoted.

## 5. Why this helps the 1326 map

This distinction gives us a better answer to the visual problem we have been solving.

Instead of asking:
> How do we draw one giant province polygon?

we can ask:
> At which spatial level should this boundary be visible?

For example:
- **İl view:** detailed local boundaries and settlement geography.
- **Vilayet view:** stronger province-scale boundary, visually cleaner.
- **Alan view:** broader regional grouping.
- **Bölge view:** strategic regional geography.
- **World view:** only higher-level boundaries and masks.

This also gives the renderer an explicit LOD/semantic hierarchy without changing the historical authority model.

## 6. Relation to EU5DB

EU5DB's 1337 map is eleven years later than our `1326-04-07` scenario, so its political boundaries cannot be imported as historical truth. Its value is structural:
- separate local and province-scale geography;
- explicit higher-level aggregation;
- map-mode hierarchy;
- location-level environmental/economic attributes;
- province/area/region navigation.

EU5DB also exposes a very broad map-mode catalogue, including terrain, vegetation, climate, topography, culture, religion, population, roads, markets, prosperity, tax base, military and maritime views. These are useful as UI/layer taxonomy references, not as requirements to reproduce EU5 mechanics one-for-one. citeturn0search0

## 7. Historia AI decision

**ADOPT CONCEPT, DO NOT COPY DATA.**

The working cartographic hierarchy should therefore be investigated as:

```text
İl
  ↓
Vilayet
  ↓
Alan
  ↓
Bölge
  ↓
Alt Kıta
  ↓
Kıta
```

with the following authority rule:

```text
historical evidence
      ↓
accepted geography
      ↓
İl geometry
      ↓
validated aggregation
      ↓
Vilayet / Area / Region geometry
```

The exact 1326 boundaries and membership of these units remain research work. This document does **not** promote any EU5DB boundary, owner, or 1337 political state into the Historia AI canonical dataset.

## 8. Next research target

The next useful research step is not another EU5DB-wide scrape.

Instead:
1. identify the most useful **İl/Vilayet granularity** for Anatolia;
2. compare it against our 1326 historical anchor/candidate surfaces;
3. determine which boundaries are historical evidence, physical constraints, or purely cartographic aggregation;
4. define a small pilot hierarchy for the highest-confidence Anatolian area;
5. keep the result candidate/review-only until the existing T3-B evidence and topology gates are satisfied.

**No canonical geometry promotion is implied by this reference analysis.**

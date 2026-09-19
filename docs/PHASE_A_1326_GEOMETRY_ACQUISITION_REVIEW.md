# Phase A — 1326 Geometry Acquisition & Review

Status: **geometry authority remains BLOCKED; candidate/research sources identified, no polygon promoted**

Scenario date: **1326-04-07**

## Purpose

This note begins the geometry stage after the Tier-1 historical existence/control gap was closed.

It deliberately separates:

```
historical existence/control evidence
    ≠ cartographic evidence
    ≠ machine-readable geometry
    ≠ reviewed 1326 boundary
    ≠ canonical authority
```

No source listed below is treated as canonical geometry.

## Current Tier-1 geometry state

| Entity | 1326 identity/evidence | Cliopatria geometry | Current geometry action |
| --- | --- | --- | --- |
| Ottoman Beylik | Cross-polity Q12560 manual review | Candidate exists | Review candidate geometry against date/entity semantics |
| Eşrefoğulları | Historical existence supported | **Source gap** | Acquire independent geometry evidence |
| Alâiye | Historical existence supported | **Source gap** | Acquire independent geometry evidence |

The repository evidence matrix already marks all three as `geometryStatus: pending-source-acquisition`.

## Eşrefoğulları — candidate evidence

Independent research located a published historical map specifically depicting the Eşrefoğulları territorial extent:

- Beyşehir-focused academic study reproduces **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** and describes it as an approximate representation of the beylik's widest extent.
- The same study describes Beyşehir as the beylik centre and discusses its territorial/political context.
- A Wikimedia Commons reproduction identifies a dedicated Eşrefoğulları location map and its license as **CC BY-SA 2.5**.

These are useful **cartographic research candidates**, but they are not yet machine-readable 1326 geometry. In particular, an image showing the widest extent must not be silently converted into a precise 7 April 1326 polygon.

### Eşrefoğulları review rule

The next admissible step is to obtain the underlying cartographic source or a traceable digital representation, record provenance/license, and compare its temporal claim with the scenario date.

The October 1326 termination event remains a temporal boundary: later territorial changes cannot be projected backward into 7 April 1326.

## Alâiye — candidate evidence

Research located several geographically useful references:

- Euratlas Periodis includes **Alaiye** as a dated historical polity in its 1300 map material and places it in the wider Anatolian political context.
- The Turkish Historical Society catalogue contains a historical cartographic item titled **Alâiye**, at 1:400,000 scale, but it is an Ottoman-era 1915/16 map. It is therefore a geographic/cartographic reference, **not a 1326 political-boundary source**.
- Alanya's university GIS service provides modern/historical-site GIS layers for Alanya, but these concern local physical/historical structures rather than the 1326 beylik boundary.

### Alâiye review rule

None of these sources is sufficient by itself to create a 1326 political polygon.

The 1915/16 map can help with place-name/topographic reconciliation only. Modern Alanya GIS can provide coordinate/place anchors only. A 1326 boundary must come from date-appropriate historical evidence or a reviewed reconstruction whose assumptions are explicitly recorded.

## Euratlas handling

Euratlas is useful as a **historical political context cross-check**, not as an automatic source of province geometry.

Its 1300 material explicitly identifies both Eshref and Alaiye and provides map-level political context. That is valuable for regional reconciliation, but the project scenario is **1326-04-07**, so a 1300 map cannot be copied, relabeled, or promoted as a 1326 boundary.

## Source classification

| Source/evidence | Role | 1326 geometry authority |
| --- | --- | --- |
| Cliopatria v0.2.0 | Candidate political-entity geometry | Candidate only |
| Eşrefoğulları map reproduced in Beyşehir study | Cartographic research evidence | Not yet |
| Wikimedia Commons Eşrefoğulları map | Secondary cartographic reproduction | Not yet |
| Euratlas 1300 | Historical political context | No |
| TTK Alâiye 1915/16 map | Geographic/cartographic reference | No |
| Alanya university GIS | Modern/local historical-site GIS | No |

## Required geometry review record

Before any candidate can approach canonical promotion, record at minimum:

1. source identity and immutable reference;
2. license/provenance;
3. original map/data date and stated historical period;
4. scenario applicability to **1326-04-07**;
5. entity identity and aliases;
6. geometry format and CRS;
7. raw bytes/hash where a digital artifact exists;
8. whether the source depicts maximum extent, effective control, nominal suzerainty, administrative boundary, or another concept;
9. coastline/physical-land validation result;
10. topology validation result;
11. reviewer decision and confidence;
12. unresolved assumptions.

## Promotion locks

The following remain unchanged:

- no 1300 → 1326 copy/relabel;
- no synthetic Voronoi/jitter/anchor/filler authority;
- no image-to-polygon conversion without traceable provenance and review;
- no candidate source promoted directly to canonical;
- `SAFE TO DELETE = 0`;
- `MIN_AREA = 0.00005`;
- canonical political-geography authority remains unchanged.

## Next executable gate

The immediate work item is now:

**Acquire or identify traceable machine-readable geometry for Eşrefoğulları and Alâiye, while simultaneously reviewing the Cliopatria Ottoman candidate under the cross-polity rule.**

After candidate geometry is available:

```
source provenance
    ↓
scenario/entity reconciliation
    ↓
geometry inspection
    ↓
physical-land/coastline validation
    ↓
topology validation
    ↓
reviewed candidate
    ↓
canonical promotion review
```

No production geometry mutation is authorized by this document.


## Research update — 2026-09-19

A second external research pass found additional cartographic evidence, but it does not change the promotion state.

### Eşrefoğulları

A published Beyşehir study reproduces **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** and labels the depicted boundary as an **approximate drawing of the beylik's widest extent**. The study also frames Eşrefoğulları as existing in **1280–1326**. This makes the map useful for regional extent reconstruction, but the “widest extent” qualifier prevents treating it as an exact 1326-04-07 boundary without further temporal reconciliation. citeturn0search0

### Alâiye

TDV's *Alâiye Beyliği* article states that the beylik ruled the Alanya region from the late 13th century until 1471 and records Karamanoğlu-linked rule after 1293. It also cites Ibn Battuta's visit around 1333 and identifies Yusuf b. Karaman as ruler at that time. This strengthens the historical/control evidence but does not provide a machine-readable 1326 boundary. citeturn0search5

A historical-map archive at SALT Research contains a map titled **“14. yüzyıl başında Anadolu Türk Beylikleri haritası”** and marks it as an open-access scanned map. It is useful as a cross-check for early-14th-century regional cartography, but its metadata does not establish that its boundary depiction is specifically 1326, so it remains reference evidence rather than canonical geometry. citeturn0search1

A later Piri Reis map of the Anatolian coast as far as Alanya is preserved by the Walters Art Museum and is CC0, but its date is centuries later than the target scenario; it can only support geographic/place-name reconciliation, not a 1326 political boundary. citeturn0search7

### Research conclusion

The evidence set is now sufficient to define **cartographic research candidates**, but still insufficient to create a reviewed 1326 polygon for either source-gap entity.

The active gate therefore remains:

```
cartographic candidate
    ↓
source artifact / immutable reference
    ↓
temporal semantics
    ↓
entity semantics
    ↓
traceable geometry extraction
    ↓
physical + topology validation
    ↓
human review
```

No candidate geometry has been promoted.

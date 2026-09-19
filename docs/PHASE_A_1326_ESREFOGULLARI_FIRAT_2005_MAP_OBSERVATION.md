# Phase A — 1326 Fırat Eşrefoğulları Map Observation

Status: **evidence-only; geometry blocked**

Scenario date: **1326-04-07**

## Source identification

A Fırat University Open Access repository PDF was inspected as an independent Eşrefoğulları cartographic reference:

- Author: **Nebahat Aydın**
- Work: **Eşrefoğulları Beyliğinin İlmi ve Kültürel Faaliyetleri**
- Type: **Yüksek Lisans Tezi**
- Institution: **Fırat Üniversitesi Sosyal Bilimler Enstitüsü**
- Year: **2005**
- Repository artifact: `160425.pdf`

The repository search record identifies the thesis and its 2005 date. The PDF contains an annex titled **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”**. citeturn6search2turn1search9

## Visual observation

The annex map was visually inspected at PDF page index 115. It is a regional political map showing Eşrefoğulları among neighbouring political entities, including Candaroğulları, Osmanoğulları, Karamanoğulları, Hamidoğulları, Tekeoğulları, Aydınoğulları and Menteşe, with Byzantine and Mamluk context. citeturn5view0

The map is useful as an **independent visual cross-check** because it is materially different from the previously reviewed Alperen (2001) reproduction. It must not, however, be assumed to share the same cartographic source, date model, or boundary methodology.

## What the artifact does establish

It establishes that a later research work contains a visual regional depiction of Eşrefoğulları's geographical area. It also provides a second map image against which future source-backed observations may be compared. citeturn5view0

## What it does not establish

The current evidence does **not** establish:

- an exact political boundary for **1326-04-07**;
- the construction method or underlying source of the map;
- whether the depicted area represents maximum extent, a particular year, or a generalized historical geography;
- a machine-readable polygon;
- a project-controlled raw SHA-256 of the embedded map image;
- transformation rights for extracting and digitizing the embedded figure;
- an independently reviewed image-space control-point set.

Therefore the map remains **context-only / control-point-candidate**, not boundary authority.

## Georeference lock

No pixel coordinates were extracted or promoted from the rendered PDF page.

The following remain empty by design:

- pixel-to-geographic correspondences;
- affine calibration;
- residual measurements;
- digitized ring;
- political polygon.

A named region, coastline, or neighbouring polity visible in this map is not automatically a control point and is never treated as a boundary vertex.

## Comparison with the existing Alperen candidate

The project now has two distinct visual Eşrefoğulları references:

1. **Alperen (2001) reproduction** in the 2017 Tekkanat & Yavuz study — explicitly describes an approximate widest extent and temporarily attached territories.
2. **Aydın (2005) thesis, Ek 1** — independently depicts the geographical area of Eşrefoğulları.

The existence of two visual references increases the opportunity for **cross-source consistency checking**, but it does not authorize intersection, averaging, tracing, or synthetic boundary construction.

## Gate decision

- `authorityStatus = evidence-only`
- `geometryStatus = blocked`
- `directPolygonImport = false`
- `exact1326Relabel = false`
- `canonicalPromotion = BLOCKED`

The observation record is stored at:

`data/gis/1326/esrefogullari-firat-2005-map-observation.json`

## Next admissible operation

The next step is **method/provenance comparison** between the Fırat 2005 map and the Alperen 2001-derived map. The purpose is to determine whether either artifact identifies an underlying historical atlas, source map, date, or reproducible cartographic method.

If no such provenance is established, both remain reference evidence and the project must continue searching for a traceable, date-appropriate boundary artifact.

No canonical geometry, MapBin, physical authority, or runtime map asset is changed by this observation.


## 2026-09-19 — provenance/source-method refinement

A targeted literature pass was used to test whether the Fırat 2005 annex can be traced to a named cartographic source or method.

The thesis identity is independently corroborated as **Nebahat Aydın, _Eşrefoğulları Beyliğinin İlmi ve Kültürel Faaliyetleri_, Fırat University, 2005**. The repository PDF is 124 pages in the current indexed copy. citeturn0search31

No explicit statement identifying the construction source or cartographic method of **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”** was found in the available indexed evidence. The current pass therefore cannot promote the annex to a source-derived boundary artifact.

A separate 2017 study gives a useful comparison point: its Eşrefoğulları map is explicitly attributed to **Alperen (2001)** and its bibliography identifies *Beyşehir ve Tarihi* by Bilal Bülent Alperen. The study's narrative separately describes the regional extent and cites Alperen, Çaycı and Uzunçarşılı. citeturn1view1turn2view0 This does not establish that the Fırat 2005 annex uses the same map or source.

### Method-reconciliation result

The two visual references are therefore currently classified as **independent observations with unresolved source lineage**:

| Evidence | What is established | What is not established |
|---|---|---|
| Alperen 2001 reproduction | named source work; approximate widest-extent semantics | exact 1326 boundary; original map bytes; transformation provenance |
| Fırat 2005 Annex 1 | named thesis and page-addressable regional map | underlying cartographic source; exact date semantics; transformation provenance |

No intersection, averaging, tracing, or common-boundary inference is admissible from this comparison.

### Gate decision

The method/provenance sub-gate remains **OPEN**. The new evidence confirms a second independent visual reference but does not identify a common authoritative cartographic lineage.

No polygon, control-point coordinate, MapBin, or canonical geometry was created.

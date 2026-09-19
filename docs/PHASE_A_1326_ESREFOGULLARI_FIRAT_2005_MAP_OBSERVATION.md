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

The repository search record identifies the thesis and its 2005 date. The PDF contains an annex titled **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”**.

## Visual observation

The annex map was visually inspected at PDF page index 115. It is a regional political map showing Eşrefoğulları among neighbouring political entities, including Candaroğulları, Osmanoğulları, Karamanoğulları, Hamidoğulları, Tekeoğulları, Aydınoğulları and Menteşe, with Byzantine and Mamluk context.

The map is useful as an **independent visual cross-check** because it is materially different from the previously reviewed Alperen (2001) reproduction. It must not, however, be assumed to share the same cartographic source, date model, or boundary methodology.

## What the artifact does establish

It establishes that a later research work contains a visual regional depiction of Eşrefoğulları's geographical area. It also provides a second map image against which future source-backed observations may be compared.

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

## 2026-09-19 — provenance/source-method refinement

A targeted literature pass tested whether the Fırat 2005 annex can be traced to a named cartographic source or method.

No explicit statement identifying the construction source or cartographic method of **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”** was found in the available indexed evidence. The current pass therefore cannot promote the annex to a source-derived boundary artifact.

A separate 2017 study gives a useful comparison point: its Eşrefoğulları map is explicitly attributed to **Alperen (2001)** and its bibliography identifies *Beyşehir ve Tarihi* by Bilal Bülent Alperen. This does not establish that the Fırat 2005 annex uses the same map or source.

### Method-reconciliation result

The two visual references are currently classified as **independent observations with unresolved source lineage**:

| Evidence | What is established | What is not established |
|---|---|---|
| Alperen 2001 reproduction | named source work; approximate widest-extent semantics | exact 1326 boundary; original map bytes; transformation provenance |
| Fırat 2005 Annex 1 | named thesis and page-addressable regional map | underlying cartographic source; exact date semantics; transformation provenance |

No intersection, averaging, tracing, or common-boundary inference is admissible from this comparison.

### Gate decision

The method/provenance sub-gate remains **OPEN**. No polygon, control-point coordinate, MapBin, or canonical geometry was created.

## 2026-09-19 — bibliographic lineage pass

The 2017 Beyşehir study explicitly captions its map as **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”**, identifying Bilal Alperen's *Beyşehir ve Tarihi* (Konya, 2001).

The Fırat 2005 annex, by contrast, is indexed as **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”** but does not expose an explicit cartographic-source attribution in the indexed map evidence.

### Result

This pass strengthens the provenance asymmetry:

- **Alperen-derived map:** named underlying work is identifiable.
- **Fırat 2005 annex:** thesis and map are identifiable, but underlying map source remains unidentified.
- **Common lineage:** not demonstrated.
- **1326-04-07 exactness:** not demonstrated for either visual artifact.

The two maps remain separate evidence records.

## 2026-09-19 — Annex/source-chain inspection result

A targeted inspection of the Fırat University PDF around the annex and bibliography did not expose an explicit statement such as “map redrawn from [named atlas/source]” attached to Annex 1.

This distinction is treated as a hard provenance boundary:

- **Bibliography presence ≠ map-source attribution.**
- A work appearing in the thesis references cannot be assumed to be the source of Annex 1 without explicit textual or figure-level linkage.
- Regional labels are observations, not coordinate control points.
- The annex remains unsuitable for direct tracing or polygon extraction.

### Updated provenance state

| Question | Result |
|---|---|
| Thesis identity | Confirmed |
| Annex identity | Confirmed |
| Visual regional content | Confirmed |
| Explicit cartographic source attribution | **Not found in inspected evidence** |
| Exact 1326-04-07 date | Not established |
| Machine-readable geometry | None |
| Project-controlled map SHA-256 | None |
| Transformation rights for embedded figure | Not established |

### Gate decision

The Fırat 2005 source-method gate remains **OPEN**, but future promotion requires an explicit source-to-map relationship.

## 2026-09-19 — comparative bibliography finding

Later Beyşehir scholarship cites **Memduh Yavuz, _Eşrefoğulları Tarihi-Beyşehir Kılavuzu_ (1934)**, **İ. H. Uzunçarşılı**, and other regional-history references around Eşrefoğulları. These establish a plausible historical-literature lineage, but not a cartographic-source lineage for Aydın (2005) Annex 1.

The 2017 Alperen-derived map remains separately and explicitly attributed to **Alperen (2001)**. Its legend describes the widest extent as approximate and distinguishes temporarily attached territory.

### Forensic interpretation

- historical works cited around Eşrefoğulları → contextual/provenance leads;
- explicit figure attribution → admissible source lineage;
- visual similarity alone → insufficient;
- bibliography co-occurrence alone → insufficient.

No candidate has crossed the threshold required to authorize georeferencing of the Fırat annex.

## 2026-09-19 — historical-source lineage result

A targeted search of institutional catalogues and later scholarship confirms **Memduh Yavuz Süslü, _Eşref Oğulları Tarihi: Beyşehir Kılavuzu_ (Konya, 1934)** as an established Eşrefoğulları historical source. The Turkish Historical Society catalogue records the 1934 publication and notes that one copy includes a fold-out table.

TDV's Eşrefoğulları bibliography also lists the same 1934 work.

This establishes **historical-source lineage**, but not **cartographic-source lineage** for Aydın (2005) Annex 1. The TTK catalogue's “1 katlı tablo” is notable, but the evidence did not identify that fold-out table as the source of Aydın's Annex 1 map.

### New research lead

The highest-value provenance lead became the **1934 Yavuz work and its fold-out table** because the institutional catalogue confirms that a fold-out visual/table component existed.

## 2026-09-19 — digitization/access discovery

A new institutional-platform discovery materially changes the acquisition picture without changing the geometry gate.

**Google Books** has a bibliographic/digitized record for:

- **Memduh Yavuz, _Eşref Oğulları Tarihi: Beyşehir Kılavuzu_**
- Babalık Matbaası, 1934
- 86 pages
- original from **Indiana University**
- digitized **4 October 2010**

The current Google Books record exposes bibliographic metadata and searchable common terms, but explicitly reports **“No eBook available”** in the current public view. Therefore the existence of a digitized record is confirmed, but page-image access to the fold-out component is **not** confirmed from the available public interface.

This is important because it upgrades the lead from “physical-copy-only” to **digitization exists / public page access unresolved**. It still does **not** establish that the fold-out table is a map, that it is the source of Aydın (2005) Annex 1, or that transformation rights are available.

The TTK catalogue independently records the physical publication and its fold-out-table component, including that one copy lacks the fold-out. The TTK record also states that requested material is for in-library use only.

### Acquisition interpretation

| Question | Result |
|---|---|
| 1934 Yavuz work exists | **Confirmed** |
| Fold-out component exists in at least one catalogue record | **Confirmed** |
| Digitized record exists | **Confirmed** |
| Current public page-image/eBook access | **Not confirmed; Google Books says “No eBook available”** |
| Fold-out content is a boundary map | **Not established** |
| Fold-out is source of Aydın 2005 Annex 1 | **Not established** |
| Project-controlled binary acquired | **No** |
| Raw SHA-256 | **None** |
| Transformation rights | **Not established** |

### Gate decision

The Yavuz 1934 item remains a **bibliographic/cartographic research lead**. No page image, fold-out scan, control point, polygon, or transformed derivative has been acquired.

The next admissible operation is to determine whether the Indiana University-origin digitization has an accessible page-image pathway or catalogue metadata describing the fold-out component. If access remains unavailable, the lead should be retained as provenance evidence rather than converted into assumed geometry.

No canonical geometry, MapBin, physical authority, or runtime map asset is changed by this discovery.

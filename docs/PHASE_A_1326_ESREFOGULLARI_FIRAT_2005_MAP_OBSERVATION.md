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

The PDF contains an annex titled **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan”**.

## Visual observation

The annex map is a regional political map showing Eşrefoğulları among neighbouring political entities, including Candaroğulları, Osmanoğulları, Karamanoğulları, Hamidoğulları, Tekeoğulları, Aydınoğulları and Menteşe, with Byzantine and Mamluk context.

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

1. **Alperen (2001) reproduction** in the 2017 Tekkanat & Yavuz study — explicitly describes an approximate widest territorial extent and temporarily attached territories.
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

A targeted search of institutional catalogues and later scholarship confirms **Memduh Yavuz Süslü, _Eşref Oğulları Tarihi: Beyşehir Kılavuzu_ (Konya, 1934)** as an established Eşrefoğulları historical source. The Turkish Historical Society catalogue explicitly records **one fold-out table** alongside images, portraits, facsimiles and a table. The catalogue also records that one library copy is missing the fold-out component and that requested material is for in-library use only. citeturn0search0

This confirms the component's existence in at least one physical copy but does not identify its content.

TDV's Eşrefoğulları bibliography independently lists the same 1934 work. citeturn0search1

This establishes **historical-source lineage**, but not **cartographic-source lineage** for Aydın (2005) Annex 1.

## 2026-09-19 — digitization/access discovery

A Google Books record exists for:

- **Memduh Yavuz, _Eşref Oğulları Tarihi: Beyşehir Kılavuzu_**
- Babalık Matbaası, 1934
- 86 pages
- original from **Indiana University**
- digitized **4 October 2010**

The current public Google Books view explicitly reports **“No eBook available”** while exposing bibliographic metadata and searchable common terms. The indexed common-term list does not itself identify a map or cartographic figure.

This upgrades the lead from “physical-copy-only” to **digitization record exists / public page-image access unresolved**. It does **not** establish that the fold-out table is a map, that it is the source of Aydın (2005) Annex 1, or that transformation rights are available.

## 2026-09-19 — contemporary bibliographic cross-check

A separate bibliographic index of Konya publications records a contemporary book presentation/review titled **“Eşref Oğulları Tarihi ve Beyşehir Kılavuzu (Memduh Yavuz Süslü)”**, published in *Konya [Halkevi]*, Year 1, Issue 10, June 1937, supplement 1. citeturn0search43

A contemporary 1934 newspaper record also discusses the newly published work and describes it as covering **Beyşehir's geographical, historical, natural and geological situation**, together with Eşrefoğulları-related material and collected valuable works. The newspaper record is useful as contemporary evidence of the book's scope, but the indexed text does **not** identify the fold-out component as a map. citeturn0search46

A later scholarly catalogue of Atatürk's library holdings independently records the 1934 book as **D.19/a, catalogue no. 4204, Anıtkabir no. 2009**, establishing an additional institutional provenance trail for a surviving copy associated with Atatürk's library. citeturn1search0turn0search47

### Acquisition interpretation

| Question | Result |
|---|---|
| 1934 Yavuz work exists | **Confirmed** |
| Fold-out component exists in at least one catalogue record | **Confirmed** |
| Digitized record exists | **Confirmed** |
| Contemporary evidence describes book's geographical/historical scope | **Confirmed** |
| Contemporary 1937 review exists | **Confirmed** |
| Atatürk-library copy provenance trail exists | **Confirmed** |
| Public page-image/eBook access | **Not confirmed; Google Books says “No eBook available”** |
| Indexed common terms identify a map | **No** |
| Fold-out content is a boundary map | **Not established** |
| Fold-out is source of Aydın 2005 Annex 1 | **Not established** |
| Project-controlled binary acquired | **No** |
| Raw SHA-256 | **None** |
| Transformation rights | **Not established** |

### Gate decision

The Yavuz 1934 item remains a **bibliographic/cartographic research lead**. The new contemporary evidence improves understanding of the work's scope and surviving-copy provenance, but it still does not expose the decisive fold-out content.

The next admissible operation is therefore to pursue the **surviving institutional copy / digitization metadata** specifically for the fold-out component. If no image-level access or explicit content description can be established, the lead remains provenance-only.

No page image, fold-out scan, control point, polygon, MapBin, or transformed derivative has been acquired.

No canonical geometry, physical authority, or runtime map asset is changed by this research pass.


## 2026-09-19 — digitized-copy content probe

The public Google Books record for the 1934 Yavuz work was rechecked directly. It identifies the book as **86 pages**, original from **Indiana University**, digitized **2010-10-04**, and exposes a partial contents view plus indexed common terms. The public record does not expose an eBook/page-image viewer and does not identify the fold-out component as a map. citeturn2search0

A separate used-book catalogue/listing describes the same 1934 item as **“Fotoğraf Ve Şekilli 88 Sayfa Metin + 1 Plan”**. This is useful corroborative evidence that a plan/visual component was associated with a surviving physical copy, but the listing is not an institutional descriptive record and does not identify the plan's subject, scale, date, or source. It therefore cannot be used to classify the fold-out as an Eşrefoğulları boundary map. citeturn0search2

### Result

The evidence now supports the following narrower chain:

**Yavuz 1934 exists → an institutional catalogue records one fold-out component → a digitized bibliographic record exists → a secondary listing calls out one plan → fold-out/plan content remains unobserved → cartographic-source relationship to Aydın 2005 remains unproven.**

No page image, fold-out scan, map-source attribution, control point, polygon, or transformed derivative has been acquired.

### Gate decision

The Yavuz lead remains **bibliographic/cartographic research lead**. The decisive next evidence is still image-level access to the fold-out or an institutional description identifying its contents. Until that evidence exists, no georeferencing or boundary reconstruction is admissible.


## 2026-09-19 — fold-out content identification pass

A further catalogue-focused search was performed specifically for the **1934 Yavuz work's fold-out/plan content**. The Turkish Historical Society catalogue remains the strongest institutional description: it records **“1 katlı tablo”** but does not name the subject of that component. citeturn0search0

A national-library-oriented bibliography also describes the 1934 work as **86 pages with illustrations**, but does not identify the fold-out/plan as a map or boundary document. citeturn1search27

No newly located indexed catalogue or bibliographic record provides the missing decisive description: **what the fold-out depicts**. In particular, no evidence was found that identifies it as an Eşrefoğulları territorial-boundary map, a Beyşehir plan, a historical-geography map, or the source of Aydın (2005) Annex 1.

### Forensic result

The evidence threshold therefore remains unchanged:

| Test | Result |
|---|---|
| 1934 work identity | Confirmed |
| Fold-out/visual component | Confirmed |
| Fold-out subject | **Unresolved** |
| Fold-out = boundary map | **Not established** |
| Fold-out = Aydın 2005 source | **Not established** |
| Image-level artifact acquired | No |
| Source SHA-256 | None |
| Georeferencing | Not permitted |
| Polygon reconstruction | Not permitted |

The negative result is recorded deliberately: **absence of indexed content description is not treated as evidence that the fold-out is a map**.

### Gate decision

Yavuz 1934 remains a **bibliographic/cartographic lead**, not a geometry source. The project will not infer the fold-out's content from the existence of a “plan”, “tablo”, illustration, or visual component alone.


## 2026-09-19 — adjacent early-cartography exclusion test

A search for earlier Eşrefoğulları cartographic material surfaced Yusuf Akyurt's **“Beyşehri Kitabeleri ve Eşrefoğlu Camii ve Türbesi”**. The 1936 fieldwork account states that Akyurt prepared **plans of the buildings** and recorded inscriptions during his Beyşehir investigation. This is architectural documentation, not evidence of a territorial-boundary map. citeturn0search61

This is useful as a negative source-classification result because it prevents an adjacent “plan” reference from being conflated with the unresolved fold-out in Yavuz (1934):

- Akyurt 1936 → building/site plans;
- Yavuz 1934 → one fold-out/table is catalogued, content unresolved;
- Aydın 2005 Annex 1 → regional political depiction, underlying cartographic source unresolved.

No common cartographic lineage is established between these three artifacts.

### Additional source-lineage observation

A modern scholarly treatment of Eşrefoğulları cites Yavuz 1934 directly for historical narrative material (for example, discussion around the early history of Seyfeddin Süleyman), confirming that the 1934 work functions as a substantive historical source. It does not, however, identify a map or boundary plate from Yavuz as the source of later regional maps. citeturn0search57

### Gate decision

The evidence classification remains:

**historical source ≠ cartographic source ≠ architectural plan ≠ canonical boundary geometry.**

No polygon, control point, image-derived coordinate, MapBin, or canonical geometry was created.


## 2026-09-19 — named-place historical boundary evidence pass

A targeted review of official/academic historical summaries was used to separate **documented territorial reach** from **date-specific boundary geometry**.

TDV's Eşrefoğulları entry establishes that the beylik began around Beyşehir/Seydişehir and that Süleyman Bey's early activity reached the Akşehir area; it also records that Mübarizüddin Mehmed Bey held Bolvadin and Akşehir by the early 14th century, including a Bolvadin mosque dated 1320. citeturn0search2

An official Derbent district history gives a broader later summary: Beyşehir and Seydişehir, followed by Ilgın, Bolvadin and Akşehir, with Bozkır, Şarkikaraağaç, Yalvaç, Gelendost, Kıreli, Doğanhisar and even Çal described as places that were **“zaman zaman”** included. citeturn0search0

### Forensic interpretation

These sources can now be used as **named-place historical anchors**, but not as polygon vertices:

- Beyşehir — core/central area evidence.
- Seydişehir — core regional extent evidence.
- Akşehir / Bolvadin — early-14th-century expansion evidence.
- Ilgın — territorial association appears in later institutional summaries.
- Bozkır / Şarkikaraağaç / Yalvaç / Gelendost / Kıreli / Doğanhisar / Çal — explicitly qualified as intermittent inclusion in the Derbent summary.

The temporal qualification is critical. A place being associated with Eşrefoğulları territory at some point does **not** establish that it belonged to the polity on **1326-04-07**.

The Ilgın source itself contains a conflicting chronology, stating that Ilgın passed to Eşrefoğulları and later attributes its transfer to Hamitoğulları to 1307. This is treated as a source-level historical claim requiring reconciliation rather than silently normalized into the 1326 model. citeturn0search1

### Gate decision

This pass upgrades the evidence base from generic regional descriptions to a **named-place anchor inventory**, while preserving the hard distinction:

**named-place evidence ≠ boundary vertex ≠ date-specific polygon.**

No coordinate was derived from these place names, no synthetic edge was constructed, and no canonical geometry was changed.


## 2026-09-19 — temporal constraint refinement: 1320–1328

A new source pass separates the Eşrefoğulları territorial evidence into a pre-1326 expansion phase and a post-1326 transfer phase.

TDV states that Mübarizüddin Mehmed Bey expanded northward into the Akşehir and Bolvadin area and records his 1320 Bolvadin construction; it then dates II. Süleyman's death at Beyşehir to **9 October 1326** and states that after this event Beyşehir, Seydişehir, Akşehir and their vicinity were taken by Hamîdoğulları, while other territories were divided among Sâhib Ataoğulları and Karamanoğulları. citeturn0search0turn0search4

A separate academic text records a later transfer of the **Beyşehir–Akşehir–Seydişehir** area to Hamidoğlu Hızır Bey in **1328**, which is compatible with the need to distinguish the 1326 collapse event from subsequent effective territorial transfer. citeturn0search38

The Fırat 2005 thesis itself describes a broad Eşrefoğulları sphere including **Beyşehir, Seydişehir, Akşehir, Ilgın, Ladik, Doğanhisar, Şarkikaraağaç, Kıreli and Bolvadin**, but cites a secondary source for this summary and therefore does not by itself establish a date-specific 1326 boundary. citeturn0search39

### Constraint interpretation

For the scenario date **1326-04-07**, the strongest current temporal constraint is:

- **1320:** Bolvadin is independently evidenced under Mehmed Bey.
- **1320–1326:** Eşrefoğulları territorial expansion is documented in the Akşehir/Bolvadin direction.
- **1326-04-07:** the polity has **not yet reached the 9 October 1326 destruction event** recorded by TDV.
- **post-9 October 1326:** territorial control begins changing; later 1328 transfer evidence must not be projected backward to 7 April 1326.

This does **not** create a polygon or prove every named place was under Eşrefoğulları on 1326-04-07. It creates a bounded temporal evidence window for later cartographic reconciliation.

### Gate decision

The named-place inventory is now treated as a **temporal constraint set**, not geometry. No place name has been converted into a coordinate, vertex, or boundary edge.


## 2026-09-19 — 1326-04-07 boundary-window reconciliation

A focused source comparison now gives a more precise temporal reading of the Eşrefoğulları evidence.

The Süleyman Demirel University study records that Seyfeddin Süleyman had expanded as far as Şarkikaraağaç by 1299 and that Mübarizüddin Mehmed subsequently took Bolvadin in 1320. It dates II. Süleyman's death to **9 October 1326**. citeturn0search1

The Turkish Historical Society's *Osmanlı Tarihine Giriş* likewise states that Mehmed Bey seized the Akşehir and Bolvadin areas, while placing the collapse of the beylik under Demirtaş in the subsequent phase. citeturn0search3

A separate academic treatment states that after Demirtaş's flight, **Beyşehir, Akşehir and Seydişehir** were taken by Hamidoğlu Hızır Bey in 1328. citeturn0search45

### Reconciled constraint set

For **1326-04-07**, the evidence currently supports:

1. **Beyşehir/Seydişehir** — core Eşrefoğulları sphere.
2. **Şarkikaraağaç** — documented expansion by the Süleyman Bey phase; exact 1326 control geometry remains unproven.
3. **Akşehir/Bolvadin** — documented under Mehmed Bey before the scenario date; Bolvadin has a 1320 anchor.
4. **Ilgın** — historically associated with Eşrefoğulları in several summaries, but one institutional chronology places its transfer to Hamidoğulları in 1307; therefore it remains a **source-conflict item**, not a forced 1326 inclusion.
5. **Post-9 October 1326 transfers** — excluded from backward projection into 1326-04-07.
6. **1328 Hamidoğlu capture** — treated as a later control-state observation, not a 1326 boundary.

This is deliberately a **constraint set**, not a reconstructed boundary.

### New forensic conclusion

The current evidence is now sufficient to reject a common failure mode: taking a later “Eşrefoğulları territory” map and relabelling its entire depicted extent as **1326-04-07**.

The remaining missing evidence is specifically **boundary-shape evidence**: a source that both has an identifiable provenance and provides enough spatial information to distinguish the 1326 state from later/generalized extent.

No coordinate, polygon, control point, MapBin, or canonical geometry was created.

## 2026-09-19 — boundary-shape evidence pass: Alperen 2001 map semantics

The 2017 Tekkanat & Yavuz publication exposes the most useful currently indexed description of the Alperen-derived map. Its caption explicitly identifies the figure as **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”**. The indexed visual description also records a legend distinction between:

- a central marker for the beylik centre;
- point symbols for settlements;
- a **solid line representing the approximate widest extent**;
- a **dashed line representing territories temporarily attached to the beylik**. citeturn0search46

The same indexed map description exposes a concrete spatial context including Beyşehir, Akşehir, Ilgın, Doğanhisar, Derbent, Hüyük, Kıreli, Seydişehir, Bozkır, Çarşamba Çayı, Eber Gölü, Akşehir Gölü, Çavuşçu Gölü, Sultan Dağı, Yalvaç, Konya, Hamîtoğulları and Karamanoğulları. citeturn0search46

### Forensic interpretation

This is materially stronger than a generic historical summary because the figure itself distinguishes **widest extent** from **temporarily attached territory**. However:

1. the map is still a **reproduction** of Alperen (2001), not the retained original artifact;
2. the indexed description calls the widest boundary **approximate**;
3. the map's exact temporal semantics are not established as **1326-04-07**;
4. the original 2001 map bytes, image SHA-256, calibration points and transformation rights are still unresolved.

Therefore the solid/dashed lines are now admissible as **boundary-shape observations**, but not as coordinates or canonical geometry.

### Cross-check against temporal constraints

The visible map context is broadly compatible with the previously established historical constraint set for Beyşehir/Seydişehir and the Akşehir/Bolvadin expansion. It also demonstrates why Ilgın and other outer locations cannot be interpreted without the map's own line semantics and date model.

No visual line has been digitized. No pixel coordinate has been promoted. No intersection or averaging with the Aydın 2005 map has been performed.

### Gate decision

- `boundaryShapeEvidence = observed-but-unresolved`
- `directPolygonImport = false`
- `georeference = blocked`
- `canonicalPromotion = BLOCKED`

## 2026-09-19 — Alperen artifact acquisition status re-check

A fresh bibliographic acquisition pass confirms that **Bilal Bülent Alperen, _Beyşehir ve Tarihi_ (Konya, 2001)** is a real 196-page self-published work and that multiple current second-hand catalogue records exist. citeturn0search0turn0search3

The 2017 academic reproduction remains the only currently indexed artifact in this project that exposes the **Alperen-attributed boundary figure itself** and its solid/dashed line semantics. citeturn0search34

The new acquisition pass did **not** locate a public digital scan of the 2001 book or a stable image-level record of the original map. Therefore:

- bibliographic existence: **confirmed**;
- original book availability: **confirmed through current catalogue listings**;
- original map binary: **not acquired**;
- original map SHA-256: **none**;
- page/image provenance: **not yet controlled by the project**;
- direct digitization: **blocked**.

### Provenance consequence

The project may continue to cite the reproduced figure as a **boundary-shape observation**, but must not silently promote the reproduction to the original 2001 map artifact. A future acquisition of the physical book or a rights-cleared scan must first produce a retained source artifact and provenance manifest before any georeferencing workflow is opened.

No coordinates, control points, polygon, MapBin, or canonical geometry were created.

## 2026-09-19 — Alperen 2001 acquisition lead: institutional vs. commercial evidence

A further acquisition pass found multiple current commercial listings for the physical 2001 edition. They consistently identify **Bilal Bülent Alperen, _Beyşehir ve Tarihi_, Konya, 2001, 196 pages**, including current stock listings. citeturn0search0turn0search2

Independent scholarly bibliographies also consistently identify the work as **Büyük Sistem Dershanesi Matbaası, Konya (2001), 196 pages**. citeturn1search29turn1search30

This establishes a stronger **physical-artifact acquisition lead**, but it does not establish access to the specific map page. Commercial listings are not treated as authoritative source metadata for the map itself.

### Acquisition gate

The current state is therefore:

| Item | State |
|---|---|
| 2001 book identity | Confirmed |
| 196-page physical edition | Independently corroborated |
| Current physical copies located | Yes |
| Original map page located | No |
| Original map image retained | No |
| Source artifact SHA-256 | None |
| Map page number | Unresolved |
| Rights for image transformation | Unresolved |
| Georeference | Blocked |

A physical-copy lead is useful for future controlled acquisition, but **the project has not acquired or transformed the book**. No coordinate or geometry may be inferred from the commercial listing.

No polygon, control point, MapBin, or canonical geometry was created.


## 2026-09-19 — Bibliographic page-level lead: Alperen 2001

A fresh source pass found an independent scholarly citation that gives a concrete internal page reference to Alperen's book: a study on the historical context of the Great Mosque at Beyşehir cites Alperen (2001), pp. 28–32 for the Eşrefoğlu foundation/early-period discussion and related chronology. This is an acquisition/navigation lead, not evidence for the boundary-map page. citeturn0search8

A separate local-government bibliography identifies the work as Alperen, B. B. (2001), Beyşehir ve tarihi, Büyük Sistem Dershanesi Matbaası. citeturn0search43 Another scholarly bibliography independently records the same 196-page edition. citeturn0search42

### Evidence classification

- book identity: corroborated
- known internal pages: 28–32 (historical narrative citation only)
- boundary-map page: unresolved
- map image: not acquired
- raw SHA-256: unavailable
- georeference: blocked
- polygon authority: blocked

The 2017 reproduction remains the directly inspected evidence for boundary-map semantics: it labels the figure “Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)” and explains that the solid line is an approximate widest extent while the dashed line represents territories briefly attached. citeturn0search41

No geometry was digitized from the reproduction.


## 2026-09-19 — Stronger page-location evidence, but map page remains unresolved

A new source pass confirms that Alperen (2001) is cited at multiple specific internal pages for different content: p.3 for a Beyşehir naming tradition, pp.28–32 for early Eşrefoğulları chronology, and p.84 for the Eşrefoğlu Mosque inscription/construction date. These references demonstrate that the 2001 edition is being cited at page level in secondary scholarship, but none identifies the page containing **Harita 2 / Eşrefoğulları Beyliği Sınırları**. citeturn0search42turn0search1turn0search6

The 2017 reproduction remains the strongest publicly inspectable evidence that the boundary figure exists and is explicitly attributed to Alperen 2001. Its legend distinguishes centre, settlements, approximate widest extent, and briefly attached territories. citeturn0search41turn0search0

A further bibliography trail points to a Google Books catalogue record for the 2001 edition, but the accessible scholarly record does not establish that the boundary-map page is available as a readable digital page. citeturn0search4turn0search44

### Gate decision

**Do not georeference yet.** The evidence is now sufficient to register a page-level acquisition lead, but not sufficient to identify and retain the actual map page. No control point, polygon vertex, or geometry transformation is permitted from the 2017 reproduction alone.

Current state: `book-confirmed` → `map-attribution-confirmed` → `page-unresolved` → `image-unretained` → `georeference-blocked`.


## 2026-09-19 — Google Books catalogue identity and page-reference refinement

A current scholarly bibliography provides a direct Google Books identifier for the 2001 edition: `RX0sAQAAIAAJ`. The record is bibliographic evidence for the edition, not evidence that the boundary map is viewable in the digital record. citeturn0search3

A separate scholarly article cites Alperen 2001 at pp. 29–36 for Eşrefoğulları territorial context, and p.36 specifically for Mübarizüddin Mehmed Bey's expansion to Gelendost, Yalvaç, Sultandağı, Çay, İshaklı and Bolvadin. citeturn0search4 This strengthens the page-navigation trail around the historical territorial narrative, but still does not identify the page containing **Harita 2**.

The directly inspectable 2017 reproduction remains the only retained public evidence for the map's legend and named-place set. citeturn0search36

### Updated acquisition state

- `editionIdentity`: confirmed
- `googleBooksCatalogueId`: `RX0sAQAAIAAJ`
- `territorialNarrativePages`: 29–36 corroborated
- `boundaryMapPage`: unresolved
- `mapImageRetained`: false
- `rawSha256`: none
- `controlPoints`: none
- `georeference`: blocked
- `canonicalGeometry`: untouched

No geometry was inferred from page references or from the reproduced figure. The next gate remains acquisition of the actual map image/page with provenance sufficient for a retained evidence artifact.

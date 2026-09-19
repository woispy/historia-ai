# Phase A — 1326 Tier-1 Reviewed Reconstruction Dossier

Status: **source-discovery gate completed; no geometry promoted**

Scenario date: **1326-04-07**

## Purpose

This dossier defines the admissible reconstruction path for the two current Tier-1 source gaps:

- Eşrefoğulları
- Alâiye Beyliği

It remains an authoring/review artifact. It is not canonical political geometry.

## Eşrefoğulları — source discovery

A web research pass identified a directly viewable reproduction of **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** in a Beyşehir historical-urban study. The page describes the map's legend as including the beylik centre, settlements, an approximate drawing of the widest extent, and territories attached for a short period. citeturn0search1

This is therefore useful as a **cartographic reconstruction candidate**, but its description explicitly prevents treating it as an exact 7 April 1326 boundary.

Required next action is acquisition/retention of the underlying map artifact with provenance before any digitization.

## Alâiye — source discovery

A public Phersu Atlas record exists for Alaiye and provides time-oriented political-control maps and a polity chronology. Its listed chronology is 1294–1493. This is useful as an independent temporal/cartographic cross-check, but no immutable 1326 machine-readable polygon artifact has been acquired. citeturn0search5

TDV's Alâiye entry independently establishes the polity in the Alâiye/Alanya region from the late 13th century to 1471 and describes the political context after 1293. This supports historical existence/context, not a canonical 1326 polygon. citeturn0search8

A SALT Research item titled **“14. yüzyıl başında Anadolu Türk Beylikleri haritası”** is openly accessible as a scanned JPEG and is potentially useful as contextual cartography. However, its title places it at the beginning of the 14th century, so it cannot be silently promoted to an exact 1326 boundary. citeturn0search0

## Current source classification

| Source | Entity | Role | Geometry authority |
|---|---|---|---|
| Alperen (2001) map reproduction | Eşrefoğulları | cartographic reconstruction candidate | No |
| Phersu Alaiye record | Alâiye | temporal/cartographic cross-check | No |
| TDV Alâiye | Alâiye | historical existence/control context | No |
| SALT early-14th-c. map | regional | contextual cartography | No |

## Reconstruction rule

No polygon may be created merely because a map image exists.

Before digitization the retained source record must contain:

- source identity and URL/reference;
- artifact file and raw SHA-256;
- rights/licence information where available;
- map date/context;
- image dimensions;
- geographic extent or control-point basis;
- temporal applicability decision;
- entity reconciliation decision;
- georeference method;
- control points and residuals;
- assumptions and uncertainty.

## Scenario protection

The project scenario remains **1326-04-07**. Evidence from later periods may establish later change but must not be projected backward.

## Promotion lock

`authorityStatus = reviewed-reconstruction`  
`promotion = BLOCKED`

No source discovered in this pass changes the canonical geometry gate.

## Next gate

Acquire/retain the actual cartographic artifact for the first reconstruction candidate, hash it, register provenance, then run georeference calibration before producing any polygon.


## Cartographic artifact ledger — 2026-09-19

A dedicated provenance ledger now exists at:
`data/gis/1326/tier1-cartographic-artifact-ledger.json`

### SALT Research — TASUDOC0286

The SALT record exposes the original JPEG and identifies it as a beginning-of-14th-century Anatolian beyliks map. The record states Open Access but also specifies **CC BY-NC-ND 4.0** terms and prohibits transformed/derived documents. Therefore this artifact is retained in the project ledger as **contextual cartography only**; it is not an unrestricted georeferencing/digitization source.

This closes a useful research question: the map can inform historical interpretation, but its current rights/date scope do not justify turning it into a 1326 polygon.

### Eşrefoğulları — Alperen (2001) reproduction

The Tekkanat & Yavuz paper reproduces “Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)” and explicitly labels the widest extent as approximate, while also distinguishing temporarily attached territory. The paper gives the Eşrefoğulları regional extent as south: Seydişehir/Bozkır; north: Doğanhisar/Ilgın; west: Yalvaç/Şarkikaraağaç/Gelendost; northwest: Akşehir/Çay/Bolvadin.

This is a **candidate reconstruction source**, not a precise 7 April 1326 polygon. The underlying artifact still requires retention and rights/provenance review before any georeferencing or digitization.

### Gate decision

The artifact-discovery gate is now **partially closed**:

- contextual map evidence: registered;
- provenance ledger: registered;
- date-specific 1326 machine-readable geometry: still absent;
- unrestricted reconstruction artifact: still absent;
- canonical geometry promotion: BLOCKED.

No polygon was created from either artifact.


## 2026-09-19 source-artifact feasibility review

A fresh source review confirms that the Erbakan University repository exposes the full 2017 paper and its downloadable PDF. The indexed PDF explicitly identifies **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** and describes the map symbology: centre, settlements, an **approximate widest extent**, and territories attached for a short period. It also exposes the geographic labels visible on the map, including Beyşehir, Eber Gölü, Akşehir Gölü, Çavuşçu Gölü, Sultan Dağı, Çay, Yalvaç, Akşehir, Ilgın, Kadınhanı, Doğanhisar, Derbent, Hüyük, Kıreli, Seydişehir, Bozkır, Çarşamba Çayı, Konya, Hamitoğulları, Karamanoğulları and Eğirdir. This confirms that the figure is a usable **research/reconstruction reference**, but does not establish an exact 1326 boundary. citeturn0search16turn0search0

The repository metadata marks the paper as open access, but the current repository evidence does not establish a separate, unrestricted licence for extracting and transforming the embedded historical map into a production geometry. Therefore the project continues to treat the figure as **reference-only until artifact-rights review is explicit**.

A second independent historical source, Hüseyin Muşmal's demographic study, reproduces a late-13th-century description of Eşrefoğulları's neighbouring polities and identifies Beyşehri as its capital. This is useful for historical context and control-point interpretation, but it is not a boundary polygon and is not being used to manufacture one. citeturn0search3

### Gate decision

The Eşrefoğulları source is now **artifact-confirmed as a visual research reference**, but remains **geometry-blocked**. No coordinates are inferred from the image and no polygon is generated.

The next admissible action is to construct a non-geometric source-proof record (artifact identity, visible labels, temporal interpretation, rights status, and provenance) and then seek a clearly reusable, date-appropriate boundary artifact before georeferencing.


## 2026-09-19 — Eşrefoğulları cartographic observation proof

The first non-geometric observation record is now committed at:
`data/gis/1326/esrefogullari-alperen-2001-map-observation.json`

The record binds the visible figure to document page 8 and preserves the map legend semantics without converting the drawing into geometry:

- the double-circle denotes the beylik centre;
- filled circles denote selected settlements;
- the solid line is explicitly an **approximate drawing of the widest extent**;
- the dashed line denotes territories attached for a short period.

The visible place labels are retained as anchor candidates only. In particular, Beyşehir is retained as a historical-location anchor candidate, while Seydişehir, Bozkır, Çarşamba Çayı, Akşehir, Ilgın, Doğanhisar, Çay, Bolvadin, Yalvaç, Gelendost, Eğirdir, Kıreli, Hüyük and Konya are retained as map-observation candidates.

This record deliberately contains **no pixel-to-geographic coordinates, no ring, no polygon, and no MapBin output**. A successful observation is therefore not being interpreted as a successful georeference.

The corresponding contract test is:
`tools/tests/phase-a-1326-esrefogullari-map-observation.test.js`

### Gate decision

The Eşrefoğulları visual source-proof layer is now structurally captured. The geometry gate remains blocked because:

1. the figure is an approximate widest-extent depiction rather than a date-specific 1326 survey;
2. the source artifact is not yet retained with a project-controlled raw SHA-256;
3. rights/provenance for transformation remain unresolved;
4. no independently sourced geographic coordinate set has yet been bound to image-space control points.

The next proof operation must therefore create **source-backed correspondence evidence**, not a political boundary.


## 2026-09-19 — source-page inspection and temporal lock

The source PDF was inspected at the actual figure page. The figure is on PDF page 8 and is explicitly captioned **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”**. Its legend distinguishes the beylik centre, selected settlements, an approximate widest-extent line, and temporarily attached territory. The source page confirms these semantics. citeturn1view0

The surrounding historical text also states that the paper treats Eşrefoğulları rule in Beyşehir as 1280–1326 and describes a 1302–1320 territorial-administration period. Those statements are retained as **temporal/extent context only**; they are not converted into a 1326-04-07 boundary. citeturn1view0

The page was visually inspected, but no rendered-page/UI pixel coordinates were promoted into the control-point record. A PDF viewer screenshot is not a retained map-image coordinate frame. The observation record therefore explicitly keeps pixel extraction as not performed.

### Gate decision

The source-proof layer is stronger than before because the figure page and temporal context are now explicitly bound. The georeference gate remains blocked until a stable image artifact/coordinate frame and independently reviewed image-space correspondences are available.

No polygon, ring, MapBin, or canonical authority was created.

## 2026-09-19 — Alâiye source-observation pass

A parallel source pass now records Alâiye evidence without creating geometry.

TDV's **Alâiye Beyliği** entry identifies the polity in the Alâiye/Alanya region from the late 13th century to 1471 and states that after 1293 the city and surrounding area were governed by beys affiliated with the Karamanoğulları and under Mamluk suzerainty. TDV's broader **Anadolu Beylikleri** entry independently gives Alâiye as 1293–1471 in the southern Anatolian coastal region.

Phersu's public Alaiye record gives a different chronology, 1294–1493, and exposes time-oriented political-control/maximum-extension map products. This is retained as an independent cross-check, not as canonical geometry. The chronology discrepancy is deliberately left unresolved for source reconciliation rather than silently choosing one source.

The resulting non-geometric observation record is:
`data/gis/1326/alaiye-source-observation.json`

### Gate decision

The Alâiye historical-existence/context gate is strengthened, but the geometry gate remains **BLOCKED**:

- no immutable 1326-04-07 machine-readable polygon has been acquired;
- no later-period extent is projected backward;
- Alanya city location is not treated as a political boundary;
- Phersu visualizations are not promoted without an immutable artifact and review;
- no polygon, ring, MapBin, or canonical authority was created.

The next admissible operation is source-artifact acquisition/reconstruction-proof work, followed by entity/temporal review and only then georeference/physical/topology validation.

## 2026-09-19 — Alâiye independent cartographic-source pass

A further external-source pass was performed specifically to test whether a date-appropriate, traceable Alâiye boundary artifact could be acquired.

The strongest newly confirmed items are:

- SALT Research's **“14. yüzyıl başında Anadolu Türk Beylikleri haritası”** exposes a scanned JPEG and identifies the coverage as the 14th century. It is still the already-registered early-14th-century contextual map, not an exact 1326-04-07 boundary. citeturn0search0
- Phersu's Alaiye record exposes a chronology of 1294–1493 and political-control/maximal-extension map products. It is useful as an independent temporal/cartographic cross-check, but no immutable 1326 machine-readable geometry artifact was acquired in this pass. citeturn0search7
- TDV's Alâiye Beyliği entry independently confirms the polity's presence in the Alâiye/Alanya region and the post-1293 political context. citeturn0search6
- Later Piri Reis / Walters material concerns much later cartography and therefore cannot define the 1326 political boundary. It is explicitly excluded from boundary reconstruction for this scenario. citeturn0search4turn0search5
- Later Ottoman Alâiyye administrative maps are likewise contextual only and are not projected backward into 1326.

### Gate decision

This pass increases the **source/context evidence**, but does not close the **1326 boundary-artifact gate**.

No new source met all of the required conditions simultaneously:

1. date-appropriate to 1326-04-07;
2. traceable retained artifact identity;
3. machine-readable or explicitly reconstructable boundary evidence;
4. rights/provenance suitable for the intended transformation;
5. independent temporal/entity review.

Therefore:

- `geometryStatus = pending-source-acquisition` remains;
- no polygon/ring is created;
- no control-point pixels are asserted;
- no synthetic or later-period geometry is admitted;
- canonical MapBin remains untouched.
\n

## 2026-09-19 — near-scenario 1330 map cross-check

A Wikimedia Commons record for **“Beylicats d’Anatolie vers 1330-tr.svg”** was reviewed as a near-scenario regional reference. The record identifies the map as approximately 1330 and cites published historical atlases as source material. citeturn0search4

This is useful only as a **contextual cross-check** for regional polity relationships around the scenario period. It is not exact to 1326-04-07 and therefore cannot be relabelled as a 1326 boundary artifact.

The artifact has been added to the cartographic ledger with geometry use blocked. No binary was retained and no geometry was extracted.

### Gate decision

The near-scenario source improves the evidence matrix but does not change the geometry gate:

- no 1326-04-07 boundary polygon has been acquired;
- no 1330 geometry is relabelled to 1326;
- no image pixels are converted to control points;
- no polygon/ring/MapBin is generated.

The reconstruction chain therefore remains evidence → source qualification → georeference proof → physical/topology validation, with canonical promotion still blocked.

## 2026-09-19 — dated temporal evidence refinement

The source review now adds two dated constraints without converting either into geometry.

### Eşrefoğulları

TDV's Eşrefoğulları entry records II. Süleyman's death in Beyşehir on **9 October 1326** and states that the beylik's territories were divided among neighbouring powers after that event. This gives a stronger temporal constraint for the scenario date **1326-04-07**: the documented post-9-October territorial breakup cannot be projected backward to the April scenario. citeturn0search0

This does **not** reveal the April boundary. It only prevents an incorrect temporal interpretation.

### Alâiye

An İSAM-hosted historical study records Alanya coins dated **1321, 1326 and 1329** minted in the name of Mamluk Sultan Nasir Muhammad, and also cites Ibn Battuta's 1333 account naming Karamanid Yusuf Bey in Alanya. This is useful dated political/monetary context around the scenario period, but it is not a territorial boundary artifact. citeturn0search40

### Gate decision

The Tier-1 evidence matrix is now stronger on **temporal applicability**, while the geometry gate remains unchanged:

- temporal evidence: strengthened;
- exact 1326-04-07 boundary artifact: still absent;
- boundary polygon: none;
- georeference control points: none;
- physical/topology validation: not started on historical candidate geometry;
- canonical promotion: BLOCKED.



### Eşrefoğulları — page-addressable visual map evidence

A 2017 Necmettin Erbakan University repository PDF was inspected at PDF page 8 / printed page 211. It contains **Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)** with an explicit legend separating the centre, selected settlements, an **approximate** maximum extent, and short-term attached territories.

This improves source traceability and makes the visual artifact suitable for a future documented georeference proof. It does not create a 1326-04-07 polygon, and no pixel coordinates have been committed from visual estimation. The machine-readable observation is `data/gis/1326/esrefogullari-map-georeference-observation.json`.

## 2026-09-19 — Alperen (2001) source-acquisition closure

A dedicated acquisition review was completed for the cartographic source behind **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”**.

The underlying work is independently corroborated as **Bilal Bülent Alperen, Beyşehir ve Tarihi, Konya, 2001**. The 2017 Tekkanat & Yavuz reproduction remains the only directly page-addressed visual artifact located in this pass. Independent bibliographic records confirm the 2001 work exists, but no clearly reusable downloadable binary of the original book or independently retained original map artifact was located.

Accordingly, the project now distinguishes three evidence levels:

- **visual reproduction:** available and page-addressed;
- **bibliographic source:** identified and corroborated;
- **project-controlled map bytes:** not acquired.

The acquisition review is recorded in `docs/PHASE_A_1326_ESREFOGULLARI_SOURCE_ACQUISITION.md` and the bibliographic lead is registered in `data/gis/1326/tier1-cartographic-artifact-ledger.json`.

### Gate decision

This closes the bibliographic-identification sub-gate but **does not close the geometry gate**:

- source identity: confirmed;
- visual reproduction: confirmed;
- original/source artifact bytes: not acquired;
- raw SHA-256: unavailable;
- transformation rights: unresolved;
- image-space control frame: unavailable;
- pixel↔geo calibration: not performed;
- polygon/ring: none;
- canonical MapBin: untouched.

The next admissible operation remains acquisition of a stable, reusable map artifact followed by documented control-point calibration. No pixel coordinates are inferred from the web-rendered figure.

## 2026-09-19 — openly licensed Eşrefoğulları cartographic candidate

A new openly licensed cartographic candidate was identified on Wikimedia Commons: **“Eşrefoğulları Beyliği'nin konumu.png”**, authored/uploaded under the name Kılıç46 and dated 19 October 2014. The Commons record exposes a 1538×772 PNG and states **CC BY-SA 2.5**, permitting adaptation subject to attribution and share-alike requirements. citeturn1view1

The visual map shows Eşrefoğulları as a coloured regional polity alongside neighbouring Anatolian beyliks. It is useful because the artifact itself is addressable and openly licensed, unlike the previously reviewed Alperen reproduction. citeturn2view0

However, the current evidence does **not** establish:

- an exact 1326-04-07 temporal interpretation;
- the cartographic construction method used to derive the coloured region;
- a source-to-coordinate transformation;
- an authoritative historical boundary basis;
- a project-controlled raw SHA-256 of the downloaded binary.

The Commons page exposes a SHA-1 checksum, but that is **not** treated as a substitute for the required raw SHA-256. citeturn1view1

### Gate decision

The new candidate changes the evidence picture but **does not open polygon generation**.

Classification:

- rights: **adaptation permitted under CC BY-SA 2.5, subject to its terms**;
- temporal authority: **not established for 1326-04-07**;
- geometry authority: **no**;
- control-point role: **candidate only**;
- direct polygon import: **forbidden**;
- canonical promotion: **BLOCKED**.

The source-to-geometry admissibility matrix now records this distinction explicitly.

The next useful operation is therefore **method/provenance analysis of the licensed map**, not tracing its coloured region into a boundary. If its geographic construction can be independently established and tied to reliable anchors, it may become a georeference cross-check; otherwise it remains contextual evidence.



## 2026-09-19 — independent Fırat 2005 cartographic cross-check

A separate Fırat University Open Access thesis was inspected: **Nebahat Aydın, _Eşrefoğulları Beyliğinin İlmi ve Kültürel Faaliyetleri_ (2005)**. The repository identifies it as a master's thesis and the PDF contains **“Ek 1: Eşrefoğulları Beyliğinin Yayıldığı Coğrafi Alan.”** citeturn6search2turn1search9

The annex map was visually inspected at PDF page index 115. It depicts Eşrefoğulları in a regional political-map context alongside Candaroğulları, Osmanoğulları, Karamanoğulları, Hamidoğulları, Tekeoğulları, Aydınoğulları, Menteşe and other surrounding entities. citeturn5view0

This is now registered as a **second, independent visual reference**. It is deliberately not treated as equivalent to the Alperen (2001) map: the current evidence does not establish that the two maps share a source, date model, construction method, or boundary definition.

The project therefore records:

- source identity: **confirmed**;
- visual artifact: **page-addressable**;
- exact 1326-04-07 interpretation: **not established**;
- map construction/source method: **not established**;
- project-controlled raw SHA-256 of embedded map: **not acquired**;
- transformation rights for the embedded map: **not established**;
- pixel↔geo control points: **none**;
- polygon/ring: **none**;
- canonical MapBin: **untouched**.

The observation record is:
`data/gis/1326/esrefogullari-firat-2005-map-observation.json`

The corresponding source-proof note is:
`docs/PHASE_A_1326_ESREFOGULLARI_FIRAT_2005_MAP_OBSERVATION.md`

### Gate decision

The Fırat map strengthens **cross-source visual evidence**, but does not close the boundary-artifact gate. No tracing, averaging, intersection, synthetic reconstruction, or relabelling to 1326 is permitted.

The next admissible operation is **method/provenance comparison** between the Fırat 2005 and Alperen 2001-derived maps. If either source identifies a traceable historical atlas, date, or reproducible cartographic method, that evidence can be promoted into the georeference-proof layer. Otherwise both remain evidence-only references.


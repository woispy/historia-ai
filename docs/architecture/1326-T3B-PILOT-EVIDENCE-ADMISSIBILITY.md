# Historia AI — T3-B Pilot Evidence Admissibility

## Status

- Scenario: `1326-04-07`
- Workstream: PR #109 / `work/phase-a-1326-t3b-candidate-surface`
- Stage: evidence admissibility review
- Authority: research/review only
- Canonical promotion: **BLOCKED**
- Reviewed: 2026-10-09

This note evaluates whether the current evidence is sufficiently specific to bind to the P1 Ottoman and Byzantine geometry-review records. It does not alter candidate geometry and does not create review bindings.

## Decision

**Do not create a geometry-supporting binding from the current Bithynia edge evidence alone.**

The evidence is useful for temporal and regional review, but it does not establish an exact, continuous political boundary for either candidate polygon. A review binding must not be interpreted as proof that the bound polygon is historically correct.

## P1 Ottoman record

Review ID: `cliopatria-1326-feature-6204-760f7a0da05d42da`

### Supported claims

- The TDV Bursa entry records Bursa's surrender on 6 April 1326, one day before the scenario date.
- The TDV Anadolu and Orhan entries describe Ottoman expansion before the Bursa event, including a number of settlements and routes in northwestern Anatolia.
- The evidence matrix already records Ottoman existence/control at scenario start as supported while explicitly leaving geometry pending source acquisition.

### Claims not established

- Bursa's capture does not define the outer boundary of the Ottoman polity.
- Settlement lists and military/road corridors do not define a closed political polygon.
- The existing Bursa–Nicaea edge record has confidence 0.25 and explicitly says the exact frontier is uncertain and non-canonical.
- The Sangarius and Lefke records describe corridors/physical constraints; they do not imply ownership or a political boundary.

### Disposition

Use these sources as temporal/context constraints in the review record. Do not treat them as sufficient evidence to accept the Cliopatria Ottoman polygon or to construct a replacement polygon.

## P1 Byzantine record

Review ID: `cliopatria-1326-feature-6241-eb6b78911fe2e881`

### Supported claims

- Byzantine presence in the region at the scenario date is supported in general by the project evidence matrix.
- TDV's İznik and İzmit entries place the Ottoman capture of İznik in 1331 and İzmit in 1337, respectively. These are temporal constraints against projecting later Ottoman control into 1326.
- The current Bithynia edge records identify regional relationships and physical corridors around Nicaea/Nicomedia.

### Claims not established

- A city's remaining under Byzantine control does not by itself determine the complete Byzantine political frontier.
- Regional proximity, river corridors, roads and strategic-crossing hypotheses do not establish the exact political boundary.
- The project evidence matrix explicitly leaves province-level control reconciliation and geometry pending.

### Disposition

Use the chronology to flag temporal contradictions and require province/region-level reconciliation. Do not treat the current edge set as sufficient evidence to accept the Cliopatria Byzantine polygon.

## Evidence admissibility matrix

| Evidence item | Admissible use | Not admissible as |
|---|---|---|
| TDV Bursa | Bursa control event dated 1326-04-06 | Ottoman outer-boundary geometry |
| TDV Anadolu / Orhan | Pre-1326 expansion context; temporal constraints | Exact continuous frontier |
| TDV İznik | Prevents projecting the 1331 capture backward | Exact Byzantine boundary |
| TDV İzmit | Prevents projecting the 1337 capture backward | Exact Byzantine boundary |
| `bursa-nicaea-frontier-1326` | Explicit uncertain-frontier review flag | Confirmed border; confidence is 0.25 |
| `bursa-nicaea-regional-proximity-1326` | Regional relationship/context | Ownership or boundary proof |
| `nicaea-sangarius-corridor-1326` | Physical/access corridor | Political ownership |
| `nicaea-sangarius-barrier-1326` | Partial physical constraint | Political border |
| `nicaea-lefke-route-1326` | Route/corridor context | Controller or boundary proof |
| `nicomedia-nicaea-network-1326` | Regional/terrain-network context | Straight-line border |
| `nicomedia-nicaea-crossing-1326` | Uncertain strategic-crossing hypothesis | Confirmed crossing or boundary |

## Explicit binding policy

A binding may be added only when all of the following are recorded:

1. The exact review ID and edge/evidence IDs are present and validated.
2. The binding's purpose is explicit: temporal constraint, regional context, physical constraint, or boundary evidence.
3. The cited evidence directly supports that purpose.
4. Contextual/physical evidence is not promoted semantically to political-boundary evidence.
5. Any exact-frontier uncertainty remains visible.
6. `geometryGeneration`, `controllerInference`, and `canonicalPromotion` remain `false`; promotion remains `BLOCKED`.

The current binding file therefore remains empty until the data contract can preserve this evidence-role distinction without ambiguity, or until genuinely boundary-specific evidence is acquired and reviewed.



## New source lead — Tabula Imperii Byzantini 13

The source search identified a materially stronger scholarly reference for the Byzantine side of the Bithynia pilot:

- **Work:** Klaus Belke, *Tabula Imperii Byzantini 13: Bithynien und Hellespont* (2020).
- **Institution:** Austrian Academy of Sciences, Tabula Imperii Byzantini.
- **Coverage:** historical geography of Bithynia and Hellespont in northwestern Asia Minor; includes regional context, settlements/toponyms, fortifications, routes, introductory geography and administrative history, a regional map and supplementary detail maps.
- **Access/rights:** FWF-hosted e-book record identifies the map resource as **CC BY 4.0**. Preserve attribution and verify the exact rights attached to any specific volume/map asset before redistribution.
- **Primary links:** [official TIB 13 overview](https://www.oeaw.ac.at/en/imafo/research/byzantine-research/communities-and-landscapes/historical-geography/tib-13), [official publication record](https://tib.oeaw.ac.at/publications), [FWF e-book and rights record](https://e-book.fwf.ac.at/detail/o%3A1438), [full-volume PDF](https://e-book.fwf.ac.at/api/object/o%3A1436/get).

### Admissibility ruling

**ACCEPT as a high-priority source-acquisition lead; NOT YET ACCEPTED as exact 1326 boundary evidence.**

TIB 13 is more directly relevant to Bithynia than general chronology sources, but it is a historical-geography synthesis spanning the Byzantine period, not a ready-made political polygon layer for 1326-04-07. A regional map or place entry cannot by itself prove the exact Ottoman–Byzantine frontier on that date.

### Extraction checklist

1. Inspect the introductory sections on territorial designations, historical/administrative geography, and transport routes.
2. Locate the gazetteer/map references for Nikaia, Nikomedeia, Prusa, Sangarios/Sakarya and Lefke.
3. For every extracted claim, record volume/page or map number, exact claim, temporal scope, spatial scale, and whether it concerns a place, administrative region, route, fortification, control event, or frontier.
4. Compare the TIB evidence with the 1326 date constraint and existing project evidence without treating later Byzantine-period geography as automatically valid in 1326.
5. Only classify an item as boundary evidence if the cited passage/map explicitly supports a boundary claim at a relevant date and scale. Otherwise classify it as place/region/route context.
6. Preserve attribution and license metadata; do not raster-trace or convert the regional map into a canonical polygon without a separately reviewed method and provenance record.

This source lead does not change `reviewBindings: []`, immutable candidate geometry, or the promotion gate.



### Targeted TIB 13 reading plan (bibliographic page map)

A published review of the volume provides a useful navigation map for the next extraction pass:

| TIB 13 section | Printed pages | Intended use in this project | Boundary admissibility |
|---|---:|---|---|
| Definition and delimitation (`Definition und Abgrenzung`) | 97–102 | Understand the volume's geographic scope and terminology | Context only until claims are dated and explicitly boundary-related |
| Geographic overview (`Geographischer Überblick`) | 103–110 | Rivers, terrain, climate and regional geography | Physical geography, not political ownership |
| Historical and administrative development | 111–224 | Identify time-specific territorial/administrative statements | Potentially relevant; each claim must be dated and checked for scale |
| Transport connections | 263–304 | Roads, shipping and connectivity around Bithynia | Route/access evidence, not a political frontier by itself |
| Nikaia gazetteer entry | 802–830 | Locate cited history, place references and bibliography for Nicaea/İznik | Not a polygon or ownership proof without a specific dated claim |
| Nikomedeia gazetteer entry | 833–856 | Same for Nicomedia/İzmit | Not a polygon or ownership proof without a specific dated claim |
| Prusa gazetteer entry | 949–957 | Same for Prusa/Bursa | Not a polygon or ownership proof without a specific dated claim |
| Regional map and supplementary maps | End matter; map legends must be read with the introduction | Inspect settlement and period symbols, map scope and regional relationships | Regional cartography only; do not trace as 1326 political geometry |

These page ranges come from Peter Riedlberger's 2021 review of Klaus Belke's TIB 13, which also notes that the maps use period-coded settlement symbols and must be interpreted together with the introduction. The review is a navigation aid, not a substitute for citing Belke's underlying passages.

**Extraction rule:** do not record a page range as evidence on its own. Each eventual evidence item must cite the exact page/map and state the relevant passage's date scope, claim type and limitation. If a source describes Byzantine administrative geography from another century, it remains historical context unless corroboration supports its relevance to 1326-04-07.

## Next operation

1. Acquire or locate boundary-specific historical geography evidence for the Bithynia frontier at or near 1326.
2. Record source identity, date scope, license, spatial scale, and limitations.
3. Reconcile that evidence against the Ottoman/Byzantine pilot candidates without modifying the immutable source polygons.
4. If the evidence still cannot support an exact boundary, record `INSUFFICIENT_EVIDENCE` or `REVIEW_REQUIRED`; do not synthesize a border.
5. Only after evidence-role semantics are explicit should review bindings be emitted and the reviewed-geometry/topology gates run.

## References

- TDV İslâm Ansiklopedisi, [Bursa](https://islamansiklopedisi.org.tr/bursa): Bursa surrender dated 6 April 1326.
- TDV İslâm Ansiklopedisi, [Anadolu](https://islamansiklopedisi.org.tr/anadolu): pre-1326 expansion context and later dates for İznik, Gemlik, İzmit.
- TDV İslâm Ansiklopedisi, [Orhan](https://islamansiklopedisi.org.tr/orhan): Bursa event and regional chronology.
- TDV İslâm Ansiklopedisi, [İznik](https://islamansiklopedisi.org.tr/iznik): capture dated 1331.
- TDV İslâm Ansiklopedisi, [İzmit](https://islamansiklopedisi.org.tr/izmit): Pelekanon in 1329 and capture dated 1337.
- Repository evidence: `data/gis/1326/evidence-matrix.json`, `data/gis/1326/pilot-edge-evidence/bithynia-core-01.json`, and `data/gis/1326/pilot-edge-evidence/bithynia-core-01.review-bindings.json`.

These sources establish chronology and context, not a canonical 1326 political boundary.


### 2026-10-09 — TIB 13 first-pass source check

**Result: CONTEXT-ONLY / INSUFFICIENT_EVIDENCE for the exact 1326-04-07 Ottoman–Byzantine frontier.**

The official Austrian Academy of Sciences summary supports these source-level observations: Bithynia is described as the hinterland of Constantinople; Nikomedeia, Nikaia and Kyzikos are identified as traditional metropolitan centres; Nikomedeia, Nikaia, Prusa and Kyzikos are noted among fortified cities; and the region's road and sea connections are part of the volume's scope. These statements support regional/place/fortification/route context, but the public summary does not state the exact political boundary on 1326-04-07.

The full-volume endpoint is discoverable and search-indexed, but the current web retrieval attempt could not open the PDF for reliable page-by-page inspection. One indexed excerpt from p. 150 concerns earlier Byzantine administrative history and is not date-specific evidence for the 1326 frontier. It is therefore not promoted as boundary evidence. The bibliographic page map remains a navigation aid, not extracted primary evidence.

| Candidate evidence | Current classification | Permitted use | Not permitted |
|---|---|---|---|
| TIB 13 official volume summary | Regional/place context | Explain Bithynian regional importance and identify target gazetteer/map entries | Derive a political line or assign territorial ownership in 1326 |
| TIB 13 place/fortification references to Nikomedeia, Nikaia, Prusa and Kyzikos | Place/fortification context | Support settlement identity and regional significance | Treat a fortified city or metropolitan status as proof of surrounding jurisdiction |
| TIB 13 road/sea-route coverage | Route/connectivity context | Corroborate route hypotheses after exact passages are extracted | Convert route corridors into borders |
| Indexed p. 150 administrative-history excerpt | Earlier-period historical context; date mismatch | Navigation clue only | Apply it to 1326 without date-specific corroboration |

**Disposition:** no exact frontier passage/map has yet been verified. The Ottoman–Byzantine Bithynia edge remains `REVIEW_REQUIRED` / `INSUFFICIENT_EVIDENCE`; no review binding is created. The Bursa chronology (surrender dated 1326-04-06 in the existing project evidence) constrains the scenario but does not define the surrounding polygon. İznik's 1331 and İzmit's 1337 capture dates must not be projected backward.

**Next evidence pass:** retrieve the volume in accessible parts or through the publisher's segmented open-access edition, then inspect pp. 97–110 and 111–224 plus the Nikaia/Nikomedeia/Prusa entries and map legend. Capture exact printed page/map, verbatim claim in a short note, claim date, evidence class, scale and limitation. If those passages do not explicitly constrain the 1326 frontier, close this source pass as context-only and seek a separate date-specific frontier source. Do not infer a line from the regional map.



### 2026-10-09 — TIB 13 exact-page extraction

**Access correction:** the earlier pass could not open the full-volume endpoint directly. A segmented open-access edition is now accessible through the publisher-hosted Austrian Academy of Sciences PDF parts. This supersedes the earlier access limitation; it does not change the boundary-admissibility ruling.

**Primary source inspected:** Klaus Belke, Bithynien und Hellespont (TIB 13), section C.IV, “Bithynien und Hellespont zwischen Byzanz, Türken und Lateinern (11.–15. Jahrhundert),” publisher PDF part 0x003b6739.pdf, especially printed pp. 217–219 (PDF pages 106–108 in the retrieved part). Source landing/index lists the chapter starting at printed p. 111 and makes the chapter PDF available in parts.

| Exact reference | Source-supported claim | Evidence class | Relevance to 1326-04-07 | Limit / ruling |
|---|---|---|---|---|
| TIB 13, p. 217 (PDF p. 106), 1307/1320 discussion | TIB reports no reliable notices of further Ottoman conquests until about 1320 and explicitly notes the poor source situation; the text treats a supposed 1320 Prusa capture in Ottoman chronicles cautiously | Historiography / uncertainty | Warns against filling the 1320–1326 record gap with assumed conquest dates | Does not establish a frontier or polygon |
| TIB 13, p. 218 (PDF p. 107), 1321–1328 civil war and 1325 campaign | The Byzantine civil war undermined Asia Minor defence; a campaign by John Kantakouzenos in Bithynia and/or northern Hellespont is described as probable, with details not preserved | Dated military-context evidence | Explains weakening and contested regional conditions around the snapshot | Campaign theatre is broad and uncertain; not territorial ownership evidence |
| TIB 13, p. 218 (PDF p. 107), Prusa passage | Prusa was described as long fully enclosed and short of supplies; it surrendered to Orhan on 6 April 1326; the text says it became the emerging Ottoman state's first capital | Dated city-control event | Strong point-level chronology for Bursa/Prusa at the target date | Establishes control of the city and its immediate siege outcome, not the limits of a surrounding political polygon |
| TIB 13, p. 219 (PDF p. 108), 1329 Pelekanos/Nikaia passage | In May–June 1329 Byzantine forces tried to push back Ottoman forces and relieve Nikaia; Nikaia is described as besieged/encircled, and the battle occurred at Pelekanos | Dated military-context evidence | Confirms Nikaia remained a distinct Byzantine-held city under siege in 1329 | Later than target date; cannot be projected backward as a precise 1326 boundary |
| TIB 13, p. 219 (PDF p. 108), 1331 lines | Nikaia surrendered on 2 March 1331; the text says the few remaining Byzantine coastal places then paid high dues to the Turks | Dated control transition | Constrains the later timeline and warns against assigning Nikaia to Ottoman ownership in 1326 merely because it fell later | Does not define the 1326 countryside frontier |
| TIB 13, p. 219 (PDF p. 108), Nikomedeia lines | In 1329 the governor of Mesothēnia is said probably still to reside at Nikomedeia; in 1331 Ottoman forces encircled Nikomedeia from the land side | Administrative-presence / later military-context evidence | Suggests Byzantine administrative presence at Nikomedeia in 1329; confirms later pressure in 1331 | “Probably” and later dating matter; not an exact 1326 border or surrounding jurisdiction |

**Evidence conclusion:** TIB 13 provides materially stronger dated historical constraints than the public summary alone. It supports a Bursa/Prusa city-control event on 1326-04-06 and documents the subsequent siege/conquest chronology of Nikaia and Nikomedeia. It still does **not** supply a verified coordinate-level Ottoman–Byzantine frontier for 1326-04-07. The relevant chapter is a historical narrative, not a boundary delineation or cadastral map.

**Adjudication:** retain Bursa/Prusa as a date-specific city-control anchor subject to the project's existing source/entity reconciliation; retain Nikaia and Nikomedeia chronology as later-event constraints; do not convert siege reach, governor residence, road corridors, fortress locations, or a regional map into borders. The Bithynia frontier remains REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE for exact-line geometry. No review binding is created and no candidate polygon is modified.

**Source navigation:** [TIB 13 open-access contents and part links](https://ancientworldonline.blogspot.com/2020/04/tabulae-imperii-byzantini-13-bithynien.html); [publisher-hosted historical/administrative chapter PDF](https://austriaca.at/0xc1aa5576%200x003b6739.pdf). The book record states CC BY 4.0; preserve attribution and check the asset-specific license record before redistribution.



### TIB 13 early Sangarios-corridor claims — source-critical context

A second useful passage occurs at TIB 13 printed pp. 215–216 (publisher PDF part 0x003b6739.pdf, PDF pages 104–105). Belke distinguishes the Byzantine narrative from Ottoman chronicle traditions and warns that the Ottoman account differs in detail and is embellished by legendary material. In that Ottoman-chronicle account, a campaign dated 1304/05 reports the taking/submission of places in the Sangarios valley, including Lefke/Leukai, Mekece/Makaǧā, Akhisar/Malagina and Geyve/Kabeia; further places are then described on both sides of the Sangarios, including the area of Nikomedeia west of the river. The same discussion says some place identifications are uncertain and notes disagreement over dates for certain fortifications.

**Classification:** source-critical, retrospective conquest narrative; candidate historical-anchor lead only. This is useful for prioritizing a Lefke–Sangarios corridor evidence review, but not as a coordinate boundary or unqualified proof that every named place remained under continuous Ottoman control on 1326-04-07. The river is a physical corridor/barrier whose role varies by section; the text does not authorize tracing it as a political border.

**Required reconciliation before any anchor promotion:**
1. Keep the Byzantine narrative and Ottoman chronicle claims as distinct evidence records, not one blended claim.
2. Preserve the reported date range (1304/05), source tradition, the author's source-critical caveat, and the uncertainty of individual place identifications.
3. Reconcile each toponym independently (Lefke/Leukai, Mekece/Makaǧā, Akhisar/Malagina, Geyve/Kabeia) before linking it to a canonical anchor.
4. Do not convert the list of reported conquests into a polygon or continuous frontier.
5. If the project cannot represent contested event claims without implying certainty, keep them in this research register rather than adding them to the evidence matrix.

This passage adds a better-defined research path, not a boundary solution. The exact 1326 Bithynia frontier remains REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE.

# Historia AI — 1326 Historical Source Register

## Status

This document defines the evidence pool for the canonical `1326-04-07` scenario. It is a source/reconciliation contract, not a political geography dataset.

The repository must not promote a source polygon to canonical political authority merely because it exists or covers the correct year.

## Production rule

```text
source
  -> evidence extraction
  -> temporal normalization
  -> entity reconciliation
  -> geometry reconciliation
  -> topology validation
  -> provenance / confidence
  -> review
  -> canonical geography
```

Missing evidence remains missing. The pipeline must not use Voronoi, jitter, anchor, or other synthetic fallback geometry to manufacture historical boundaries.

## Priority regions

### Tier 1

- Anatolia
- Byzantine Empire
- Balkans
- Black Sea
- Caucasus
- Iran
- Iraq
- Syria
- Egypt

### Tier 2

- Europe
- Central Asia
- North Africa
- South Asia
- China

### Tier 3

More distant regions may remain lower-detail without preventing the 1326 scenario from being playable.

## Candidate evidence sources

### Cliopatria

**Role:** global political-entity evidence.

Cliopatria is a global geospatial dataset covering 3400 BCE-2024 CE. Its records use GeoJSON geometries in EPSG:4326 and temporal `FromYear`/`ToYear` intervals. The project explicitly warns that its maps represent one historical interpretation and that border, naming, territorial-change, and duration uncertainties exist. Therefore Historia AI treats it as evidence for entity/extent reconciliation, not as an automatic canonical boundary source.

Official repository: https://github.com/Seshat-Global-History-Databank/cliopatria

### Digital Atlas of Dioceses and Ecclesiastical Provinces in Late Medieval Europe

**Role:** European late-medieval boundary context.

The public data supplement covers 1200-1500 and provides polygon data in Shapefile/GeoJSON-related formats under CC BY 3.0. These are ecclesiastical jurisdictions, so they cannot be treated as political province authority. They are useful as corroborating historical geography evidence in Europe.

Dataset record: https://geodata-cdn.lib.utexas.edu/catalog/stanford-rh195hm5975

### OpenHistoricalMap

**Role:** historical feature and boundary evidence.

OpenHistoricalMap provides historical geospatial data through downloads/APIs. Its general data dedication is CC0 except for individually tagged features carrying other open licenses. License tags must therefore be preserved and checked for any material used. OHM is collaborative and uneven in historical coverage, so it is evidence rather than automatic 1326 political authority.

Export: https://www.openhistoricalmap.org/export
Copyright/licensing: https://www.openhistoricalmap.org/copyright

### EU5DB — Europa Universalis V reference database

**Role:** comparative game-data / map-architecture reference, not historical authority.

EU5DB exposes an interactive EU5 map at the 1337 start and provides per-location information including owner, culture, religion, population, topography, vegetation, climate, and raw materials. Its map hierarchy exposes **Location → Province → Area → Region → Subcontinent → Continent**, while its map-mode catalogue exposes 162 game map modes spanning geography, demography, economy, diplomacy, military, and geopolitics.

For Historia AI this is useful as a **benchmark/reference layer** for:

- comparing province/location granularity around Anatolia, Balkans, Byzantium, Levant and Black Sea;
- validating our separation of immutable geography from dynamic political state;
- designing map-layer contracts for terrain/topography, vegetation, climate, culture, religion, population, economy and geopolitics;
- comparing hierarchical geography (`location/province/area/region`) with our own province/region architecture;
- checking whether our future map UI exposes the same conceptual layer families without copying EU5 implementation or data.

EU5DB's 1337 state is eleven years after Historia AI's `1326-04-07` target. Therefore it is **not** evidence for a 1326 political boundary and must never be promoted into the canonical 1326 geography pipeline. It is a comparative reference for structure, granularity and post-1326 plausibility checks only.

The EU5DB map-mode inventory is particularly valuable for future layer planning: it includes political, terrain, vegetation, climate, topography, culture, religion, language, population, market, wealth/tax-base, roads, military, maritime and other derived views. These should be treated as **design references**, not as a requirement to reproduce EU5 mechanics one-for-one.

### EU5DB spatial hierarchy analysis

The repository also retains `docs/architecture/EU5DB-REFERENCE-MAP-ANALYSIS.md` as the detailed cartographic interpretation of the EU5DB hierarchy. It records the **İl → Vilayet → Alan → Bölge → Alt Kıta → Kıta** concept as a comparative design reference only. It does not promote EU5DB geometry or 1337 ownership into the 1326 authority pipeline.



### Tabula Imperii Byzantini 13 — Bithynia and Hellespont

**Role:** high-value scholarly historical-geography reference for the P1 Byzantine/Bithynia review; corroboration and place/route context, not an automatic 1326 political boundary.

The Austrian Academy of Sciences identifies TIB 13 as *Bithynia and Hellespont* by Klaus Belke (2020). The volume covers northwestern Asia Minor and discusses regional geography, history, administrative history, transport connections, settlements, fortifications, and other historical-geography evidence. It includes regional cartography at 1:800,000 and supplementary detail maps. The freely accessible FWF e-book record identifies the resource as CC BY 4.0.

- Official TIB 13 overview: https://www.oeaw.ac.at/en/imafo/research/byzantine-research/communities-and-landscapes/historical-geography/tib-13
- Official publication list: https://tib.oeaw.ac.at/publications
- FWF e-book and rights record: https://e-book.fwf.ac.at/detail/o%3A1438
- Full volume: https://e-book.fwf.ac.at/api/object/o%3A1436/get

**Use in Historia AI:** inspect the relevant introductory sections, maps, and gazetteer entries for Nikaia/Nicaea, Nikomedeia/Nicomedia, Prusa/Bursa, Sangarios/Sakarya, Lefke, and the surrounding region. Extract page/map references and record the exact historical period to which each claim applies. Use this to improve place identity, physical/route context, and Byzantine regional interpretation.

**Limitations:** TIB is a scholarly historical-geography synthesis across the Byzantine period, not a ready-made political polygon layer for 1326-04-07. A regional/provincial map or toponym entry must not be assumed to prove the Ottoman–Byzantine frontier on the scenario date. TIB 13's map scale is regional rather than province-level geometry precision. Any reuse of source-derived content must retain attribution and comply with CC BY 4.0; map digitization/derivative geometry still requires explicit source and interpretation notes.

**Current disposition:** ACCEPTED as a source-acquisition/research lead; not yet adjudicated as boundary-specific evidence. No candidate geometry or review binding is changed by adding this reference.

### World Historical Gazetteer

**Role:** historical place identity, reconciliation, and provenance evidence.

WHG is useful for linking historical place identities and source-linked records. It is not treated as a single authoritative 1326 province layer.

Website: https://whgazetteer.org/

## Explicit exclusions

### 1300 historical-basemaps data

Existing 1300 assets remain reference/regression material. They must not be renamed to 1326 or copied into 1326 merely to fill missing coverage.

### Paid 1300 Euratlas data

The paid Euratlas 1300 GIS product is not part of the free-source production pipeline.

## Evidence record requirements

Every promoted historical geometry must retain, at minimum:

- scenario/date applicability;
- source provider;
- dataset/version or source snapshot;
- source feature identity;
- source URL where applicable;
- license/usage classification;
- historical interpretation notes;
- confidence;
- review status;
- reconciliation notes;
- canonical entity identity.

## Authority separation

Political geometry is static canonical data. Political owner/controller/occupation are scenario state and may change during simulation. A source describing control at one historical moment must not mutate canonical geometry.

Physical geography remains a separate authority layer from political geography.

## Current state

The 1326 source registry is established, but no authoritative 1326 political runtime asset has been promoted yet. The next production task is source acquisition and reconciliation, beginning with Tier 1 evidence and the highest-confidence entities rather than generating a synthetic global polygon set.



### TIB 13 — exact-page findings (2026-10-09)

The segmented publisher-hosted open-access edition was inspected in the historical/administrative chapter, section C.IV, printed pp. 217–219 (PDF pages 106–108 of part 0x003b6739.pdf). Findings for the 1326 pilot:

- **Prusa/Bursa:** p. 218 reports prolonged encirclement, food shortage, and surrender to Orhan on 6 April 1326; it became the emerging Ottoman state's first capital. Classify as a date-specific city-control event, not an exact polygon or countryside frontier.
- **Regional defence context:** p. 218 describes the Byzantine civil war (1321–1328) as undermining Asian defence and a probable 1325 campaign in Bithynia and/or northern Hellespont, with details not preserved. Use only as broad military context.
- **Nikaia:** p. 219 describes siege pressure in 1329 and surrender on 2 March 1331. This is a later chronology lock; do not back-project Ottoman ownership to 1326.
- **Nikomedeia:** p. 219 says the Mesothēnia governor probably still resided there in 1329 and describes a land-side encirclement in 1331. This supports later administrative/military context, not a coordinate boundary or certain 1326 territorial extent.
- **Boundary result:** no coordinate-level frontier for 1326-04-07 was found in these passages. TIB 13 is accepted as dated historical context and city-event evidence, but not as exact political-boundary authority.

The chapter itself emphasizes gaps/uncertainty in the conquest narrative. Keep provenance and claim type distinct; never translate siege zones, road routes, fortress/settlement points, or administrative presence into an invented border. Source links: [open-access chapter PDF](https://austriaca.at/0xc1aa5576%200x003b6739.pdf), [open-access contents and all part links](https://ancientworldonline.blogspot.com/2020/04/tabulae-imperii-byzantini-13-bithynien.html). The book listing states CC BY 4.0; preserve attribution and verify the specific asset's license metadata before redistribution.



### TIB 13 — early Sangarios-corridor claims

TIB 13 printed pp. 215–216 (publisher-hosted historical/administrative chapter PDF, part 0x003b6739.pdf, PDF pages 104–105) summarizes the 1304/05 conquest sequence as reported by Ottoman chronicle tradition. The author explicitly distinguishes that account from the Byzantine narrative and cautions that details differ and the Ottoman chronicle is legend-enriched. The list includes Lefke/Leukai, Mekece/Makaǧā, Akhisar/Malagina and Geyve/Kabeia, with further claims about places on both sides of the Sangarios.

Use this only as a **source-critical anchor-research lead**. Keep traditions distinct, preserve the 1304/05 date range and uncertainty of toponym identification, and do not treat the list as proof of uninterrupted control on 1326-04-07 or as a continuous political frontier. Reconcile each toponym separately before adding any evidence-matrix entry. Exact boundary authority is not established by this passage.


### 2026-10-09 — Sangarios toponym reconciliation pass

The focused research note `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md` records provisional identity matches and unresolved items for the TIB 13 printed pp. 215–216 place list.

- **Lefke/Leukai → Osmaneli:** provisionally supported by the Bilecik Provincial Directorate of Culture and Tourism's history page; a 2021 epigraphic study is catalogued for further extraction. No project anchor was added because exact coordinate/site provenance has not yet been verified.
- **Geyve/Kabia-Kabeia:** municipal history reports the Kabia identification and cites an inscription, but the primary epigraphic publication must be checked before acceptance.
- **Akhisar/Malagina:** scholarly work by Clive Foss is a promising place-identification lead; exact equivalence and coordinates remain pending.
- **Mekece/Makaǧā:** unresolved pending independent gazetteer or scholarly identification.
- **Sangarios/Sakarya:** physical geography/corridor only, not a political boundary.

**Admissibility:** these findings improve place-name reconciliation but do not prove the 1304/05 chronicle account as continuous control on 1326-04-07. No anchor registry, candidate polygon, or review binding was changed. The exact frontier remains `REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE`.


### 2026-10-09 — second-pass source verification

The full Öztürk (2021) article is now available at https://www.libridergi.org/wp-content/uploads/2021/03/lbr.202101.pdf. Printed pp. 2–3 explicitly identify Leukai/Lefke with modern Osmaneli and cite TIB 13's Leukai entry. The paper also documents Roman/Hajj-road routes, milestones, bridges and settlement evidence. Classify this as **place identity and route context**, not 1326 political-control or frontier evidence.

A Ministry-hosted copy of Sencer Şahin's 1983 epigraphic/historical-geography survey was found at https://ukaas.ktb.gov.tr/Eklenti/130204%2C02arastirmapdf.pdf?0=. Its indexed text reports ancient Kabaia at modern Geyve and relates the name to an inscription. Preserve the source-specific forms Kabeia/Kabia/Kabaia until the original publications are compared; the indexed excerpt was not treated as a complete source transcription.

Sakarya Metropolitan Municipality's historical-castles PDF (https://sakarya.bel.tr/uploads/files/sakaryakaleleri.pdf) summarizes Foss's identification of Malagina's fortress with Paşalar Kalesi and records Mekece Kalesi as an earlier proposal. This cautions against conflating Malagina and Mekece. The detailed dispositions and limits are recorded in `docs/architecture/1326-SANGARIOS-TOPONYM-RECONCILIATION.md`.

**Result:** stronger place-identity evidence, but no 1326 frontier evidence. No anchor registry entries, candidate polygons, or review bindings were added.


### 2026-10-09 — Malagina/Metabole/Mekece distinction

A third source pass separates the **Malagina region/plain**, the **Metabole fortress**, and **Mekece Castle** rather than treating them as one place. Foss (2022)'s accessible indexed extract describes the Malagina plain as a broad Sangarios corridor between Mekece and Lefke and associates the campaign's Akhisar with the fortress in the Malagina/Metabole context. A Sakarya University thesis on northwestern Anatolian road networks argues that Paşalar Castle is a more suitable identification for Malagina/Metabole Castle than Mekece Castle, while documenting the competing hypotheses. Sakarya Metropolitan Municipality's *Sakarya Kaleleri* also records the history of the Mekece proposal. Foss (1990)'s abstract confirms that fieldwork was used to locate the fortress, but the full argument and coordinate-level source were not extracted in this pass.

Sources: Foss (1990), https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C; Foss (2022) accessible excerpt, https://www.scribd.com/document/595994910/The-Beginnings-of-the-Ottoman-Empire-Clive-Foss-2022; Sakarya Metropolitan Municipality, https://sakarya.bel.tr/uploads/files/sakaryakaleleri.pdf; Sakarya University thesis, https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?sequence=1.

**Admissibility:** this improves site identity and chronology research, not the 1326 boundary. The report that the Sangarios route was held by Orhan by 1324 remains a regional-control claim, not a closed political polygon. No anchor, geometry, or review binding was added.


### 2026-10-09 — official Paşalar Castle record check

The Sakarya Governorship's page reports that Paşalar Castle (Karaceyş Castle) was conquered in 1314 and overlooks the Pamukova/Geyve plains. The Ministry of Culture and Tourism Culture Inventory locates the remains at Kale Tepe, north of Paşalar village in Pamukova/Sakarya, gives a broad 5th–6th century construction date, and describes fortification remains. Neither page explicitly equates Paşalar Castle with Malagina/Metabole, and the inventory's location section provides no coordinates.

Treat the physical site as established, the Paşalar–Metabole identity as a scholarly hypothesis, and 1314 as a source-specific local-history claim requiring independent historical adjudication. These records do not establish 1326 political control or a frontier. No anchor or geometry was promoted.


### 2026-10-09 — Foss 2022 / official Malagina location fork

The accessible indexed extract attributed to Clive Foss, *The Beginnings of the Ottoman Empire* (OUP, 2022), pp. 67–69, distinguishes the Mekece tekfur from the Akhisar fortress in the Ottoman narrative and associates the fortified Metabole site with Akhisar overlooking the Malagina plain. The extract was read on a third-party document platform and is recorded as a research lead only; confirm against a legitimate OUP/library copy before anchor promotion. Official OUP chapter metadata establishes the book's source-critical approach but does not itself verify every detail of the extract.

The official Sakarya provincial tourism master-plan PDF retains two candidate locations for Malagina: Mekece or Paşalar/Paşalar Castle. The Pamukova District Governorate and Ministry Culture Inventory describe the physical Paşalar Castle site but do not explicitly equate it with Metabole/Akhisar and do not provide coordinates.

Current source-critical disposition:
- Mekece settlement/tekfur and Akhisar fortress are distinct in Foss's narrative.
- Metabole ↔ Akhisar is a stronger scholarly association, pending direct verification from an official book copy.
- Malagina plain/region is broader than the fortress.
- Paşalar = Metabole/Akhisar remains a hypothesis, not a closed identity.
- TIB campaign Makaǧā remains unresolved and must not be inferred to equal Mekece.

References:
- OUP chapter metadata: https://academic.oup.com/book/38839/chapter-abstract/337747727
- Sakarya provincial tourism master plan: https://bolge1.tarimorman.gov.tr/Documents/menu-dosyalar/Do%C4%9Fa%20Turizmi%20Master%20Planlar%C4%B1/SAKARYA%20TTMP.pdf
- Pamukova District Governorate: https://www.pamukova.gov.tr/pasalar-kalesi/
- Ministry Culture Inventory: https://www.kulturportali.gov.tr/turkiye/sakarya/kulturenvanteri/pasalar-kalesi

No anchor or geometry was promoted; coordinate provenance remains insufficient.


### 2026-10-09 — publisher-record cross-check for Malagina / Metabole

Oxford Academic's official abstract for Clive Foss, *The Beginnings of the Ottoman Empire*, chapter 3 “Reconciling the Accounts” (2022, pp. 135–140), explicitly says the Byzantine fortress Malagina can be identified with APZ's Akhisar. This supports the scholarly Malagina–Akhisar association at abstract level; the full chapter is access-restricted in this research pass. https://academic.oup.com/book/38839/chapter-abstract/337747727

The Cambridge Core abstract for Foss, “Byzantine Malagina and the Lower Sangarius” (1990, pp. 161–183), states that field investigation enabled a more precise location for Malagina and identification/description of its fortress. OpenBibArt's bibliographic record summarizes the article as identifying Malagina and describing the remains of the fortress of Metabole. These records strengthen the scholarly **Malagina / Metabole fortress / APZ Akhisar** research relationship, but do not independently provide a project-ready coordinate or settle Paşalar Castle as the modern site.

- Cambridge Core: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C
- OpenBibArt: https://openbibart.fr/vibad/index.php?action=getRecordDetail&idt=oba_0065074

**Authority and admissibility remain unchanged:** Malagina region/plain is not identical by default to a fortress point; Mekece settlement/tekfur and Mekece Castle remain distinct; Paşalar–Metabole/Akhisar is still a modern-site hypothesis requiring full topographical verification; TIB campaign Makaǧā–Mekece remains unresolved. No anchor, coordinate, polygon, or review binding was promoted. The 1326-04-07 frontier remains INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED.


### 2026-10-09 — DeLuigi thesis cross-check for Malagina / Metabole

Humberto Cesar Hugo DeLuigi's 2015 Bilkent University M.A. thesis, *Winter in the Land of Rûm: Komnenian Defenses Against the Turks in Western Anatolia*, discusses “Melangeia-Malagina (Paşalar, Sakarya)” on printed pp. 78–79 and includes a plan and views of Metabole (figures 52–54). The searchable text reports that Foss identifies Metabole with the fortress above Paşalar and Melangeia/Malagina with the plain between the fortress and the Sangarios; it records Mekece as a competing earlier proposal attributed to Şahin and gives topographical/travel-distance reasons for preferring Paşalar.

- Thesis catalog: https://tezara.org/theses/385927
- Searchable text consulted: https://www.scribd.com/document/475011130/Winter-in-the-Land-of-Rum-Komnenian-Defe-pdf
- Foss (1990) publisher record: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C

This upgrades the **Paşalar ↔ Metabole** hypothesis to a strongly supported scholarly site identification, while the project still requires direct inspection of a legitimate full-text source and its figure/map before coordinate ingestion. Keep Melangeia/Malagina as the broader plain/region; keep Mekece Castle as a recorded competing hypothesis; and do not infer TIB campaign Makaǧā = Mekece from the fortress debate. OUP's official chapter abstract independently associates the Byzantine fortress Malagina with APZ's Akhisar: https://academic.oup.com/book/38839/chapter-abstract/337747727.

No anchor, coordinate, candidate polygon, or review binding was promoted. This evidence is historical site identification, not 1326 political-control or boundary evidence. The exact 1326-04-07 frontier remains INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED.


### 2026-10-09 — DeLuigi thesis page-level cross-check

A searchable extract of Humberto DeLuigi's 2015 Bilkent M.A. thesis, printed pp. 78–79, section “Melangeia-Malagina (Paşalar, Sakarya) and Pithekas,” identifies Metabole with the fortress above Paşalar and Melangeia with the plain between the fortress and the Sangarios. It records Mekece Castle, about nine kilometres southwest of Paşalar, as Şahin's competing proposal and discusses travel distance from Nikomedeia and surface pottery as comparative evidence. Figures 52–54 are labelled as a plan, the fortress, and its view.

- Thesis catalog: https://tezara.org/theses/385927
- Searchable text mirror (not an institutional full-text endpoint): https://www.scribd.com/document/475011130/Winter-in-the-Land-of-Rum-Komnenian-Defe-pdf
- Foss (1990) publisher-hosted extract: https://www.cambridge.org/core/journals/anatolian-studies/article/abs/byzantine-malagina-and-the-lower-sangarius/C764A7C79EB54493BA6061F3402DEF3C

This raises confidence in **Metabole ↔ Paşalar fortress** as a scholarly site hypothesis, but the thesis figures and Foss's cited topographical pages still need verification against a legitimate, traceable full text before coordinate extraction. Malagina/Melangeia remains the wider plain/region; Mekece Castle remains a competing earlier hypothesis; TIB campaign Makaǧā ↔ modern Mekece remains unresolved; APZ Akhisar ↔ Malagina fortress remains a source-specific scholarly equivalence, not an unrestricted alias. No anchor, coordinate, candidate polygon, or review binding was promoted. No evidence here establishes the 1326-04-07 political frontier.


### 2026-10-09 — institutional cross-check of Paşalar Castle

The Türkiye Ministry of Culture and Tourism Culture Inventory records Paşalar Kalesi at Kale Tepe, north of Paşalar village, Pamukova/Sakarya, describes surviving sections of the circular fortification, and gives a broad 5th–6th-century construction estimate. It does not provide coordinates or explicitly equate the site with Metabole: https://www.kulturportali.gov.tr/turkiye/sakarya/kulturenvanteri/pasalar-kalesi

The Sakarya University repository thesis on northwestern Anatolian historical road networks describes the physical castle and cites Foss (1990, p. 170), Şahin, and local architectural literature: https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?isAllowed=y&sequence=1. The Sakarya Governorship and Pamukova District Governorship also document the monument and its setting over the Pamukova/Geyve plain: https://www.sakarya.gov.tr/pasalar-kalesi and https://www.pamukova.gov.tr/pasalar-kalesi/.

These records support the physical identity and location description of Paşalar Castle, while the Foss/DeLuigi evidence supports Paşalar–Metabole as a strong scholarly site hypothesis. A generic coordinate found in secondary web summaries is not admissible as a surveyed fortress coordinate because the inspected institutional inventory and publisher abstracts do not supply it or document its derivation. Do not add it to the anchor registry without traceable coordinate provenance.

No anchor, coordinate, candidate polygon, or review binding was promoted. The broader Malagina/Melangeia plain remains distinct from the fortress; Mekece Castle remains a competing hypothesis; TIB campaign Makaǧā ↔ modern Mekece remains unresolved; no source reviewed here establishes the exact 1326-04-07 political frontier.


### 2026-10-09 — institutional thesis clarifies the Malagina / Metabole fork

The Sakarya University repository thesis on northwestern Anatolian historical road networks explicitly distinguishes the competing claims: it reports Şahin's placement of the broader Malagina region at Mekece based on route/lake/pasture criteria, while arguing that Paşalar Castle is the more suitable identification for the specific Malagina/Metabole fortress. It cites Foss (1990, pp. 163–164 and 170–171) and acknowledges the Paşalar/Mekece debate. Institutional PDF: https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?isAllowed=y&sequence=1.

Keep these as separate propositions: (a) Malagina region/plain ↔ Mekece proposal, (b) Metabole fortress ↔ Paşalar hypothesis, and (c) TIB campaign Makaǧā ↔ modern Mekece, still unresolved. The thesis is a traceable institutional secondary synthesis, not a substitute for direct review of Foss's full topographical argument or a georeferenced site plan. It provides no coordinate provenance adequate for the anchor registry and no exact 1326 political boundary.

No anchor, coordinate, polygon, or review binding was promoted. Canonical promotion remains blocked; SAFE TO DELETE = 0.


### 2026-10-10 — direct page-level institutional verification: Paşalar / Metabole

The full Sakarya University repository thesis by Sena Nur Akbaş (2023), *Sakarya İli Hudutlarında Bizans Mimari Plastiğinin Belgelenmesi (Geyve-Pamukova ve Akyazı İlçeleri)*, was checked at PDF pages 45–47 (printed pp. 30–32). It explicitly distinguishes Şahin's **broader Malagina-region/Mekece** proposal from the **specific fortress** identification: it argues Paşalar Castle is the more suitable Malagina/Metabole fortress and states that Foss identified Paşalar, not Mekece Castle, as Metabole, citing Foss (1990), p. 170. Institutional source: https://acikerisim.sakarya.edu.tr/bitstream/handle/20.500.12619/101577/T10915.pdf?isAllowed=y&sequence=1.

This supports a strong scholarly site-identification hypothesis, but not a project-ready coordinate or a 1326 political boundary. The PDF gives a physical place description (Kaletepe, Paşalar Mahallesi, Pamukova), not a traceable coordinate pair, georeferencing procedure, or positional uncertainty. Keep the regional Malagina/Mekece proposal distinct from the fortress-level Paşalar/Metabole identification and keep TIB Makaǧā ↔ modern Mekece unresolved.

No anchor, coordinate, polygon, evidence binding, review binding, or canonical geometry was promoted. Frontier remains INSUFFICIENT_EVIDENCE / REVIEW_REQUIRED; SAFE TO DELETE = 0.


## T3-B unmatched required entities — 2026-10-10 research checkpoint

The pinned Cliopatria v0.2.0 scenario extraction (150 temporal candidates) has no accepted exact-name/alias candidate for either `esrefogullari` or `alaye`. This is currently a **source coverage / entity-reconciliation gap**, not permission to substitute a neighboring polity. Both entities remain required and unmatched; candidate promotion, controller inference, and geometry generation stay disabled.

### Eşrefoğulları — existence supported; candidate geometry absent

The TDV İslâm Ansiklopedisi entry by Sait Kofoğlu states that Eşref II Süleyman was killed by Demirtaş on 9 October 1326 and that, after this event, Beyşehir, Seydişehir, Akşehir and nearby lands were seized by Hamîdoğulları while other territories were divided between Sâhib Ataoğulları and Karamanoğulları. This is strong temporal evidence that Eşrefoğulları had not yet ended on 1326-04-07, and identifies a core regional context around Beyşehir/Seydişehir. It does **not** provide a machine-readable political boundary or prove a match to the Cliopatria candidate geometry.

Source: https://islamansiklopedisi.org.tr/esrefogullari

**Disposition:** keep `esrefogullari` unmatched and `geometryStatus = pending-source-acquisition`. Do not use the post-9 October territorial transfers as April borders, and do not bind the later Hamid geometry as a substitute.

### Alâiye — polity period supported; exact 1326 ruler/control unresolved

The TDV İslâm Ansiklopedisi entry by Erdoğan Merçil dates Alâiye's polity period from the late 13th century to 1471, but also states that after Mecdüddin Mahmud Bey took Alâiye in 1293, the city and surrounding area were governed by beys affiliated with the Karamanoğulları and under Mamluk suzerainty. Ibn Battuta's report of Yusuf b. Karaman is circa 1333, later than the scenario date. Therefore a broad polity interval does not settle the local authority on 1326-04-07, and the record must not be silently equated with the Karamanoğulları, Teke, or another adjacent polity.

Source: https://islamansiklopedisi.org.tr/alaiye-beyligi
Related city entry: https://islamansiklopedisi.org.tr/alanya

**Disposition:** keep `alaye` unmatched pending scenario-date ruler/authority reconciliation and source geometry. Do not infer the political boundary from the place's existence interval.

### Post-alias-fix pipeline checkpoint

- Cliopatria acquisition verification #196: **PASS**.
- Historia AI CI #3505: **PASS**.
- Entity reconciliation: 6/8 matched, 2 unmatched, 0 ambiguous.
- Review queue: 21 records (6 entity-linked, 15 unmatched); geometry ledger 21/21 pending.
- Explicit `reviewBindings`: 0; promotion remains **BLOCKED**.

This checkpoint improves evidence and records the reason for non-matching; it does not promote anchors, coordinates, review bindings, or canonical geometry. `SAFE TO DELETE = 0`.


### Spatial-screen cross-check — candidate presence is not entity identity

The persisted T3-B review package was also checked against the two relevant anchors. The screening output includes the following source candidates:

- Cliopatria feature index **6219**, `Beylik of Karaman`, temporal interval `1326–1332`; its bounding box contains the Alâiye and Beyşehir anchor coordinates.
- Feature index **6221**, `Beylik of Teke`, temporal interval `1326–1332`; its bounding box also contains the Alâiye anchor coordinate.
- Feature index **6229**, `Beylik of Hamid`, temporal interval `1326–1332`; its bounding box contains the Beyşehir anchor coordinate.

These are **bbox-screening observations only**: they do not establish exact polygon containment, political control, or an entity match. The broad year-level intervals are especially inadequate for Eşrefoğulları, because TDV dates the transfer of core Eşref territory to Hamîdoğulları after Süleyman Şah's death on 9 October 1326. They are also inadequate to collapse Alâiye into Karaman or Teke, because the historical source describes a distinct Alâiye locality and Karaman-affiliated rulers, while the precise 1326-04-07 arrangement remains unresolved.

**Decision:** do not create alias mappings from `esrefogullari` to `Beylik of Hamid`, or from `alaye` to `Beylik of Karaman` / `Beylik of Teke`. Keep both unmatched and use these candidate geometries only as contextual review evidence. No polygon, anchor coordinate, controller, or review binding was promoted.

## Bithynia pilot citation traceability gap — 2026-10-10

The pilot edge packet `data/gis/1326/pilot-edge-evidence/bithynia-core-01.json` cites internal references such as `inventory:1326-gecis-envanteri#17`, `#15`, `#18`, and `#1`. These identifiers are not themselves source citations and cannot be used to adjudicate an exact political edge without a resolvable inventory record and its underlying source.

The available conversation attachment titled `1326 Geçiş Envanteri.txt` was checked during this audit. It is a Tier 3 historical-geography design/methodology note (historical geography graph, anchor/constraint distinction, and frontier uncertainty); it does **not** contain a numbered evidence inventory with records `#1`, `#15`, `#17`, or `#18`. Therefore the attachment cannot be treated as the source record referenced by those IDs. The corresponding repository inventory path/record has not yet been identified from the current branch files.

### Edge-specific disposition

- `bursa-nicaea-frontier-1326`: keep **uncertain**, confidence 0.25; no exact political boundary is established by the currently traceable source material.
- `bursa-nicaea-regional-proximity-1326`: retain as a distinct graph relation; it must not be converted into a boundary.
- Nicaea–Sangarius and Nicaea–Lefke records: preserve as river/road corridor or physical-access claims, not ownership/frontier claims.
- Nicomedia–Nicaea crossing: retain as a hypothesis only; no exact crossing point is established.

The #202 package independently confirms that the generated review ledger has 21 pending records, zero edge assessments, zero explicit `reviewBindings`, and `reviewedGeometry = null` throughout. The pilot binding input also remains `WAITING_FOR_REAL_CANDIDATE_ACQUISITION` with an empty binding list. CI's pilot-readiness pass is a schema/workflow result, not a historical adjudication.

**Required next action:** locate and verify the exact repository inventory record(s) and follow each reference to its primary or inspectable secondary source. Record source title, author/editor, page/section, URL or stable identifier, relevant claim, date scope, and what the source does not prove. Until that trace is complete, do not add review bindings or raise frontier confidence. No geometry, anchor, coordinate, controller, or canonical state is changed by this note.

### 2026-10-10 — EU5toGIS georeferenced map dataset intake

**Disposition: ACCEPT as a comparative cartography / GIS workflow reference only. NOT accepted as 1326 political-boundary authority.**

The user-supplied `EU5toGIS.zip` was inspected in place; archive SHA-256: `c8a92838f7ab3a37f72bc875da0f52fbfe22084fd07ab7e71f16128a6d0b7c0c`. Its README describes a georeferenced Europa Universalis V map and map-object layers. Inspected vector contents:

- `datasets/locations.gpkg`: 28,573 MultiPolygon location features; attributes include in-game `id`, `tag`, `hex_color`, `topography`, `vegetation`, `climate`, `raw_material`, and `natural_harbor_suitability`.
- `datasets/generated_map_object_locators_city.gpkg`: 21,046 city point features, with tag, rotation and game-map coordinates.
- `datasets/ports.gpkg`: port points (4,421), sea-zone points (5,662), and connection lines (4,421).
- Raster files include georeferenced `locations.tif`, `rivers.tif` and alternate-central-longitude `*_L.tif` variants.
- Vector layers use a custom Gall Stereographic projected CRS described in the README as WGS 84-based. Raster/vector central-longitude handling differs; overlays must be checked in GIS rather than assumed pixel-identical.

**Useful for Historia AI:** a high-detail visual comparison layer for modern/global coastline and river alignment, location granularity, province/region hierarchy research, GIS overlay workflow, and reviewing how small settlements and coast-adjacent shapes are represented. The vector polygons can support visual QA and comparative cartography; point/port layers can support a separate locator cross-check after real-world positions are independently verified.

**Limits / exclusions:** this is EU5's game map and game data, not an independently surveyed historical dataset. Its own README warns that city and port object positions can differ from real-world positions and notes some regional map inaccuracies. Its game location geometry, game tags, resource/climate/topography values, and implicit political partitions must not be copied into Historia AI's canonical 1326 polygons, treated as historical ownership/controller evidence, or used to auto-fill missing geometry. Do not infer 1326 boundaries from a 1337/current game setup or from modern rivers/administrative lines. Physical geography, political geometry, and scenario ownership remain separate authorities.

**License/provenance gate:** the supplied README credits DavidRMilos and includes a GPL notice for the bundled QGIS plugin (whose copyright is attributed to Jorge Almerio), but does not clearly state a redistribution license for the GIS datasets/game-derived layers themselves. Keep the ZIP outside the repository for now; do not commit or redistribute its binary data. Before any derivative data is published, establish the dataset's own license/permission and the applicable Paradox game-asset terms, retain attribution, pin source/version and checksums, and document any transformation.

**Workflow recommendation:** use this as an optional QGIS reference layer for visual QA only. Any extracted real-world comparison geometry must have its own source, license, date applicability and provenance. This intake changes no anchor, evidence-matrix entry, candidate geometry, review binding, or canonical asset. Current political geometry gate remains blocked; `SAFE TO DELETE = 0`.

### 2026-10-10 — EU5toGIS license/provenance audit (second pass)

**Verdict: NOT CLEARED for repository redistribution, committed binary assets, or publication of derivative game-map geometry.** This is a provenance/risk decision, not a legal opinion.

#### A. Dataset files (datasets/*.gpkg, *.tif)

The supplied EU5toGIS/README.md asks users to credit DavidRMilos but states no SPDX identifier, Creative Commons license, explicit grant, or redistribution terms for the GIS datasets. A request for attribution is not, by itself, a license grant. The source thread was not readable by the automated browser due to a forum client challenge; the linked Reddit announcement confirms that the author distributes the package and describes it as a georeferenced EU5 map with embedded in-game location data, but the accessible announcement does not add a dataset license: https://www.reddit.com/r/EU5/comments/1rcf6z1/complete_version_of_georeferenced_eu5_dataset_is/.

The data is expressly derived from EU5 map/game content (location map, location tags/IDs, game-object locators, port/sea-zone data and in-game attributes). Paradox's current User Agreement, updated 2026-01-21, says Paradox or its licensors reserve intellectual-property rights in the Services; its UGC clause says users' rights extend only to their original new content and do not grant rights to Paradox or third-party content. It also cautions that Paradox does not own IP in every published game and therefore cannot unconditionally permit UGC for all games. Source: https://legal.paradoxplaza.com/eula (see §§1 and 5). This does not, on its own, adjudicate the exact rights status of this specific dataset; it means the dataset author cannot be assumed to grant rights that they do not hold.

**Dataset disposition:** LICENSE_UNCONFIRMED / REDISTRIBUTION_BLOCKED. Do not add the ZIP, GeoPackages, TIFFs, extracted EU5 polygons, or derivatives of EU5 map geometry to this repository or a public release unless (1) the dataset author supplies explicit written permission/license covering the intended use and redistribution, and (2) any necessary Paradox rights/terms are confirmed. Private inspection of the supplied copy is not treated as clearance for publishing or incorporating its geometry. The archive remains outside the repository; SHA-256: c8a92838f7ab3a37f72bc875da0f52fbfe22084fd07ab7e71f16128a6d0b7c0c.

#### B. Bundled QGIS plugin (plugins/valuetool_for_eu5/)

The plugin is a separately licensed third-party component and must not be conflated with the GIS dataset:

- metadata.txt identifies the upstream project as https://github.com/jorgealmerio/valuetool, names Jorge Almerio as maintainer, and lists multiple original contributors.
- The ZIP includes a GNU GPL v3 license text, while source-file headers state GPL version 2 or later. Treat the exact licensing/modified-distribution state as requiring upstream verification rather than assuming the bundle is internally consistent.
- Crucially, the dataset README says the author has **not yet received the copyright holder's consent for uploading this modified plugin to the QGIS plugin site**.

**Plugin disposition:** do not commit, mirror, or redistribute the bundled plugin. If a GIS workflow needs this functionality, obtain the plugin directly from its upstream source/QGIS distribution under the license and terms supplied there, or implement an independent minimal tool without copying its code. This restriction is independent of the dataset-license question.

#### C. Required clearance record

Before changing either disposition, obtain and record:
1. Dataset author's explicit license/permission for the specific data layers and any derivatives, including whether public GitHub distribution is allowed.
2. Confirmation whether the author's work includes EU5/Paradox-owned game assets or data and, if it does, the applicable permission/terms for redistribution outside the game-mod context.
3. For the plugin, an upstream source/version and license confirmation, plus resolution of the README's stated missing consent before any redistribution of the bundled copy.
4. The exact version/date, source URL, author/rights-holder, permission evidence, checksum, and allowed-use scope in the project provenance record.

**Safe interim use:** use only as a local, non-redistributed visual inspection reference while assessing rights; do not commit the package or create a public derived layer from EU5 polygons. For production province geometry, prefer independently licensed public-domain/open-license real-world geography and independently sourced historical evidence. The EU5toGIS package remains a comparative workflow reference, not 1326 historical boundary authority. No anchor, evidence-matrix entry, candidate geometry, review binding, or canonical asset was changed; SAFE TO DELETE = 0.


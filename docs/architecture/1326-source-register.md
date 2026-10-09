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

# Historia AI — 1326 Anchor Candidate Ledger

## Status

**Research ledger — NOT PRODUCTION AUTHORITY**

This ledger consolidates the current 1326 anchor research without promoting any record into canonical authority.

Scenario date:

    1326-04-07

Core rule:

    historical applicability != coordinate authority != controller authority != political geometry authority

No row in this ledger may be converted into a province polygon, controller assignment, or canonical geometry without the production gates defined in `1326-anchor-authority-research.md`.

## Field semantics

| Field | Meaning |
|---|---|
| Anchor | Stable research identifier / historical reference |
| Theatre | Historical-geographic theatre |
| Historical applicability | Evidence status for 1326-04-07 |
| Coordinate evidence | Current independent coordinate state |
| Controller evidence | Whether scenario-date controller is explicitly bound |
| Production state | Current readiness for production registry |
| Main blocker | Missing evidence that must be resolved |

Temporal classes:

- **SCENARIO_WINDOW** — directly covers or immediately surrounds 1326-04-07.
- **PRE_SCENARIO** — evidence predates the scenario date and remains applicable.
- **POST_SCENARIO** — later evidence; cannot establish April 1326 controller/boundary by itself.
- **UNDATED** — insufficient temporal bound.

Production states:

- **CANDIDATE** — historically useful but evidence chain incomplete.
- **COORDINATE_PENDING** — historical side is adequate enough for research, coordinate authority incomplete.
- **TEMPORAL_BINDING_PENDING** — coordinate exists, but 1326 applicability needs stronger binding.
- **CONTROLLER_BINDING_PENDING** — anchor existence is established, controller-at-date remains open.
- **EXPLICIT_NEGATIVE** — a tempting historical shortcut is invalid for 1326.
- **GEOGRAPHIC_REFERENCE_ONLY** — useful spatial reference but not currently suitable as a political anchor.

## Candidate ledger

| ID | Anchor | Theatre | Historical applicability | Coordinate evidence | Controller evidence | Production state | Main blocker |
|---|---|---|---|---|---|---|---|
| 1326-settlement-bursa | Bursa / Prusa | Bithynia | SCENARIO_WINDOW — surrender 6 Apr 1326 | GeoNames + existing research coordinate | Strong event-linked Ottoman evidence | CANDIDATE | Stable machine-readable historical refs + final coordinate precision |
| 1326-settlement-nicaea | Nicaea / İznik | Bithynia | PRE_SCENARIO / SCENARIO_RELEVANT | Wikidata + existing research coordinate | Needs explicit 7 Apr controller binding | CONTROLLER_BINDING_PENDING | Scenario-date controller evidence |
| 1326-settlement-nicomedia | Nicomedia / İzmit | Bithynia | TEMPORAL BINDING PENDING | Existing independent coordinate | Not sealed | TEMPORAL_BINDING_PENDING | Explicit 1326 source binding |
| 1326-settlement-sogut | Söğüt | Ottoman frontier | PRE_SCENARIO / SCENARIO_RELEVANT | Existing independent coordinate | Historical Ottoman association strong; date-specific binding needed | CONTROLLER_BINDING_PENDING | Exact scenario-date binding |
| 1326-settlement-bilecik | Bilecik | Ottoman frontier | PRE_SCENARIO / SCENARIO_RELEVANT | Existing independent coordinate | Early Ottoman/Edebâli context; date-specific binding needed | CONTROLLER_BINDING_PENDING | Exact scenario-date binding |
| 1326-corridor-geyve | Geyve / Sangarios | Ottoman–Byzantine frontier | PRE_SCENARIO / geographic | GeoNames coordinate | Not a controller anchor | GEOGRAPHIC_REFERENCE_ONLY | Keep corridor semantics; no political inference |
| 1326-settlement-dorylaion | Dorylaion / Eskişehir | Western Phrygia | TEMPORAL BINDING PENDING | GeoNames / existing coordinate | Not sealed | TEMPORAL_BINDING_PENDING | Explicit 1326 historical binding |
| 1326-settlement-kutahya | Kütahya | Germiyan | SCENARIO_RELEVANT — Germiyan centre | Existing independent coordinate | Strong centre evidence; frontier/controller extent separate | CONTROLLER_BINDING_PENDING | Scenario-date controller/boundary evidence |
| 1326-settlement-uluborlu | Uluborlu | Hamid / Pisidia | PRE_SCENARIO / SCENARIO_RELEVANT | Existing research coordinate | Strong Hamid centre evidence | CONTROLLER_BINDING_PENDING | Stable refs + coordinate confirmation |
| 1326-settlement-egirdir | Eğridir | Hamid / Pisidia | SCENARIO_RELEVANT with 1324–1328 disruption | GeoNames + Wikidata city points | Controller deliberately not asserted | CONTROLLER_BINDING_PENDING | 7 Apr 1326 local status; 1324 occupation and 1328 restoration must not be collapsed |
| 1326-settlement-isparta | Isparta | Hamid / Pisidia | SCENARIO_RELEVANT; 1326 internal transition requires care | GeoNames + independent city-point reference | Controller deliberately not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 status within the 1326 Demirtaş/Dündar transition |
| 1326-settlement-burdur | Burdur | Hamid / Pisidia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Regional Hamid evidence | COORDINATE_PENDING | Independent coordinate source |
| 1326-settlement-beysehir | Beyşehir | Eşref / Pisidia | SCENARIO_RELEVANT; 9 Oct 1326 collapse is POST_SCENARIO | Existing research coordinate | April controller must remain pre-collapse | CONTROLLER_BINDING_PENDING | Pre-9 Oct 1326 controller source |
| 1326-settlement-larende | Lârende / Karaman | Karaman / Lycaonia | SCENARIO_RELEVANT as regional centre | GeoNames + Wikipedia city points | Karamanid institutional continuity is strong, exact 7 Apr controller not sealed | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; do not use 1328–29 expansion backward |
| 1326-settlement-balikesir | Balıkesir | Karasi / Mysia | SCENARIO_RELEVANT | GeoNames + Wikipedia city points | Karasi control predates 1326; exact 7 Apr controller not sealed | CONTROLLER_BINDING_PENDING | Exact April 1326 local controller; 1328 two-centre evidence cannot be projected backward |
| 1326-settlement-bergama | Bergama | Karasi / Mysia | SCENARIO_RELEVANT | GeoNames + Wikipedia city points | Karasi centre evidence strong; exact 7 Apr controller not sealed | CONTROLLER_BINDING_PENDING | Exact April 1326 local controller; 1328 Yahşi-centre evidence is post-scenario |
| 1326-settlement-manisa | Manisa | Saruhan / Lydia | SCENARIO_RELEVANT — Manisa-centred Saruhan polity established before scenario | GeoNames + Wikidata city points converge exactly | Saruhan centre evidence strong; exact 7 Apr 1326 controller not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; no controller inference from institutional continuity |

| 1326-settlement-birgi | Birgi | Aydın / Lydia-Ionia | SCENARIO_RELEVANT — first Aydınoğulları centre | GeoNames + Wikidata city points | Aydınoğulları control established before scenario; exact 7 Apr controller not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; no boundary inference |
| 1326-settlement-ayasuluk | Ayasuluk / Selçuk | Aydın / Lydia-Ionia | SCENARIO_RELEVANT — captured by Mehmed Bey before scenario | GeoNames + Wikidata city points | Aydınoğulları control established before scenario; exact 7 Apr controller not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; historical site vs modern city-point semantics |
| 1326-settlement-tire | Tire | Aydın / Lydia-Ionia | SCENARIO_RELEVANT — captured by Mehmed Bey before scenario | GeoNames + Wikidata city points | Aydınoğulları control established before scenario; exact 7 Apr controller not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; no boundary inference |
| 1326-settlement-birgi | Birgi | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid centre evidence strong; exact date binding needed | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-ayasuluk | Ayasuluk | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid evidence strong; later İzmir events excluded | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-tire | Tire | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid evidence strong; exact date binding needed | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-sinop | Sinop | Candar / Paphlagonia | PRE_SCENARIO — Pervâneoğulları ended 1322 | Existing independent coordinate | Candar transition strongly evidenced | CANDIDATE | Stable machine-readable refs + precision policy |
| 1326-settlement-kastamonu | Kastamonu | Candar / Paphlagonia | SCENARIO_RELEVANT — Candar centre before scenario | GeoNames + Wikipedia city points | Candar centre evidence strong; exact 7 Apr 1326 controller not asserted | CONTROLLER_BINDING_PENDING | Exact 7 Apr 1326 controller binding; 1327 independence must not be projected backward |
| 1326-settlement-milas | Milas / Mylasa | Menteşe / Caria | PRE_SCENARIO / SCENARIO_RELEVANT | GeoNames + Wikidata converge closely | Menteşe centre evidence; boundary separate | COORDINATE_PENDING | Site/reference-point semantics + stable refs |
| 1326-settlement-pecin | Peçin / Beçin | Menteşe / Caria | PRE_SCENARIO / SCENARIO_RELEVANT | GeoNames + Wikidata; points differ slightly | Menteşe centre evidence | COORDINATE_PENDING | Resolve settlement vs fortress reference point |
| 1326-settlement-mugla | Muğla | Menteşe / Caria | PRE_SCENARIO — documented temporary relocation | GeoNames city point; second city-specific source needed | Administrative-centre relevance, not permanent-capital inference | COORDINATE_PENDING | Second coordinate source + role semantics |
| 1326-reference-balat | Balat / Miletus-area | Menteşe / Aegean coast | Historical candidate | Wikidata coordinate candidate | No controller binding | GEOGRAPHIC_REFERENCE_ONLY | Medieval Balat identity/source binding |
| 1326-settlement-trabzon | Trebizond / Trabzon | Pontus | SCENARIO_RELEVANT — imperial capital | Wikidata coordinate; second stable source required | Strong Empire of Trebizond centre evidence | COORDINATE_PENDING | Second coordinate source + stable refs |
| 1326-settlement-giresun | Giresun / Kerasus | Pontus | PRE_SCENARIO historical context; April status not explicit enough | Coordinate source needed | Controller binding not sealed | TEMPORAL_BINDING_PENDING | Explicit 7 Apr 1326 local evidence |
| 1326-settlement-halep | Halep / Aleppo | Mamluk Levant | PRE_SCENARIO / SCENARIO_RELEVANT | GeoNames + Wikidata converge | Strong Mamluk administrative-centre context | COORDINATE_PENDING | Second stable coordinate source + refs |
| 1326-settlement-tripoli | Trablusşam / Tripoli | Mamluk Levant | PRE_SCENARIO / SCENARIO_RELEVANT | GeoNames + Wikidata | Strong Mamluk administrative-centre context | COORDINATE_PENDING | Second stable coordinate source + refs |
| 1326-reference-antakya | Antakya / Antioch | Cilicia–Levant | PRE_SCENARIO existence; post-1268 decline | Coordinate source needed | April 1326 political status not sealed | GEOGRAPHIC_REFERENCE_ONLY | Local 1326 evidence |
| 1326-reference-adana | Adana | Cilicia / Çukurova | Historical geography candidate | Coordinate source needed | No Ramazanoğlu 1326 claim permitted | EXPLICIT_NEGATIVE | Mamluk/frontier source chain |
| 1326-reference-ceyhan | Ceyhan | Cilicia / Çukurova | Historical geography candidate | Coordinate source needed | No Ramazanoğlu 1326 claim permitted | EXPLICIT_NEGATIVE | Mamluk/frontier source chain |
| 1326-reference-misis | Misis | Cilicia / Çukurova | Historical geography candidate | Coordinate source needed | No Ramazanoğlu 1326 claim permitted | EXPLICIT_NEGATIVE | Mamluk/frontier source chain |
| 1326-reference-constantinople | Constantinople / Istanbul | Byzantine Thrace | SCENARIO_RELEVANT geographic reference | Coordinate source needed | Not an Ottoman 1326 control anchor | GEOGRAPHIC_REFERENCE_ONLY | Dedicated Byzantine 1326 source pass |
| 1326-reference-edirne | Adrianople / Edirne | Byzantine Thrace | SCENARIO_RELEVANT geographic reference | Coordinate source needed | Not an Ottoman 1326 control anchor | GEOGRAPHIC_REFERENCE_ONLY | Dedicated Byzantine 1326 source pass |
| 1326-reference-gelibolu | Gallipoli / Gelibolu | Byzantine Thrace / Dardanelles | POST_SCENARIO for Ottoman conquest | Coordinate source needed | Ottoman control cannot be projected backward | EXPLICIT_NEGATIVE | Later-conquest chronology guard |

## Coordinate-evidence checkpoint

Current Wave 3 web research confirms:

- Milas: GeoNames approximately [27.783889, 37.316389]. citeturn0search13
- Muğla city/administrative records require care because GeoNames exposes both city/ADM2-style records; the city-level point must be distinguished from province references. citeturn0search14
- Halep: GeoNames approximately [37.161173, 36.201241]. citeturn0search2
- Trablusşam/Tripoli, Lebanon: GeoNames approximately [35.84415, 34.43352], and the alternate-name list explicitly includes Trablusşam. citeturn0search0turn0search3
- Bursa: GeoNames approximately [29.06013, 40.195593] with Prusa among alternate names. citeturn0search11

These are external research observations only. The production registry must persist stable source references and precision semantics rather than copying transient search results.

## Current ledger verdict

The accumulated pool is now broad enough for a first deterministic candidate ledger, but **not for canonical registry generation**.

Production blockers remain:

1. stable machine-readable historical evidence references;
2. independent coordinate source pair for each production anchor;
3. coordinate precision/reference-point semantics;
4. exact 1326-04-07 controller binding where controller is required;
5. alias and duplicate reconciliation;
6. theatre coverage review;
7. deterministic registry schema and validator;
8. CI validation.

## Non-negotiable prohibitions

- no 1300 registry/centroid reuse;
- no candidate-proximity controller inference;
- no Voronoi/fallback political geometry;
- no synthetic coordinate generation;
- no 1328+ events projected backward into April 1326;
- no anchor point converted directly into a province polygon;
- no canonical promotion from this ledger alone.


## Registry intake checkpoint — 2026-10-07

The evidence-layer registry now contains the following seven machine-readable candidates:

- Bursa
- Bilecik
- Kütahya
- Sinop
- Nicaea / İznik
- Söğüt
- Uluborlu

This intake does **not** change the ledger's non-canonical status. In particular:

- Nicaea remains a historical anchor candidate; its scenario-date controller is not asserted.
- Söğüt remains a strong early Ottoman administrative-centre candidate, but its post-1326 administrative decline means the exact 7 April 1326 role is not silently promoted.
- Uluborlu has the strongest regional temporal chain among the newly added candidates: TDV places it as the Hamîd government centre from around 1297 and identifies Dündar Bey's rule through 1326.

Coordinate evidence is stored as source-level points rather than averaged coordinates. No anchor point is converted into a political boundary.

The registry validator remains the gate before any candidate can enter later reconciliation work. Canonical political geography remains blocked.

## Wave 4 intake — Eğridir closure

The targeted Hamid/Pisidia pass now closes the **anchor existence + coordinate** side for Eğridir, while intentionally leaving controller authority open.

- TDV Eğridir identifies Eğridir as the second centre of the Hamîdoğulları beylik and records a Timurtaş occupation in 1324, followed by Hızır Bey's return in 1328. This makes the settlement historically relevant to the 1326 theatre, but it also makes a simplistic April-1326 controller label unsafe. citeturn0search13
- TDV Hamîdoğulları records Dündar Bey's transfer of the government centre to Eğridir around 1307 and the use of the name Felekâbâd. citeturn0search4
- GeoNames reports the populated-place point at approximately [30.850425, 37.874616]. citeturn1search1
- Wikidata Q586434 reports the city coordinate at 37°52'30"N, 30°51'2"E, approximately [30.850556, 37.875000]. citeturn1search0

Registry decision:

- **ADD to research-candidate registry** as `1326-egirdir`.
- `controller = NOT_ASSERTED`.
- `geometry = NOT_ASSERTED`.
- No monument/site coordinate is substituted for the city point.
- No controller or political boundary is inferred from the anchor.
- The candidate remains blocked from canonical promotion.

This is a deliberate closure of the coordinate/existence gate, not a closure of the political-control question.


## Wave 5 intake — Isparta closure

The targeted pass closes the coordinate/existence side for Isparta without collapsing the 1326 internal political transition into a single controller label.

- TDV Isparta places Isparta within the Hamîdoğulları sphere from the late 13th century and describes the city during Feleküddin Dündar Bey's 1301–1326 period. It also records a 1326 change in the region after Demirtaş's withdrawal. citeturn0search1
- TDV Feleküddin Dündar Bey identifies him as ruler of the Isparta–Burdur region from 1301 to 1326. citeturn1search6
- GeoNames gives the Isparta city point as approximately [30.5522222, 37.7644444]. citeturn3search5
- An independent city-coordinate reference reproduces the same city point. citeturn3search19

Registry decision:

- **ADD** `1326-isparta` as a research candidate.
- `controller = NOT_ASSERTED`.
- `geometry = NOT_ASSERTED`.
- Keep the 1326 transition as unresolved chronology rather than inferring a controller from a broad regional statement.

## Wave 6 intake — Burdur + Beyşehir

### Burdur

- `1326-settlement-burdur` is now closed on the coordinate/existence side for registry intake.
- TDV places Burdur inside the Hamîdoğulları Isparta–Burdur regional sphere and identifies Dündar Bey as ruler of the Isparta–Burdur region in 1301–1326. citeturn0search1turn0search10
- GeoNames and an independent city-coordinate reference converge on [30.2908333, 37.7202778]. citeturn2search1turn2search15
- Production state remains **CONTROLLER_BINDING_PENDING**; no province geometry or exact 7 April controller is asserted.

### Beyşehir

- `1326-settlement-beysehir` is now closed on the coordinate/existence side for registry intake.
- TDV identifies Beyşehir as an Eşrefoğlu political centre before the scenario date. citeturn1search5turn1search7
- TDV explicitly dates the Demirtaş capture of Beyşehir and killing of II. Süleyman Bey to **9 October 1326**. The subsequent Hamîdoğulları takeover is therefore POST_SCENARIO and is not projected backward to 7 April. citeturn1search0
- GeoNames and Wikidata provide independent city-point references near [31.724577, 37.677348] and [31.726111, 37.676389]. citeturn0search6turn1search2
- Production state remains **CONTROLLER_BINDING_PENDING**; the April controller still requires a pre-9-October source binding.

### Hygiene correction

- Isparta's historical evidence temporal class was normalized from the invalid `SCENARIO_RELEVANT` value to `PRE_SCENARIO`.
- `SCENARIO_RELEVANT` remains valid only at the registry record's top-level `historicalApplicability` field.


## Wave 8 intake — Lârende / Karaman

The targeted Lârende pass closes the coordinate side for research-registry intake while deliberately leaving exact scenario-date controller authority open.

- TDV Karamanoğulları records Lârende as Karamanlı territory from the Güneri Bey period and later states that, after Demirtaş's departure, Lârende was the Karamanlı capital under Bedreddin İbrâhim. The same chronology dates the Karamanlı capture of Konya, Gevele and Beyşehir to 1328–29; those later events are not projected backward to 7 April 1326.
- GeoNames and the English Wikipedia city record provide independent city-point references near [33.215000, 37.1811111] and [33.21806, 37.18194].
- The coordinate points remain source-level evidence and are not averaged.
- Candidate remains CONTROLLER_BINDING_PENDING.
- No geometry or controller extent is inferred from the anchor.

The machine-readable registry may retain Lârende as candidate-evidence-only; canonical political geography remains blocked.


## Wave 9 intake — Karasi / Balıkesir–Bergama

The targeted Karasi pass closes the coordinate/reference-point side for both candidates.

- TDV Karesioğulları places Balıkesir and Bergama inside the Karasi theatre from the late 13th century and identifies Balıkesir as the beylik centre. Karesi Bey died before 1328 and Yahşi Bey succeeded him.
- TDV records the Balıkesir/Demirhan and Bergama/Yahşi two-centre structure from evidence surrounding the 1328 Byzantine agreement. This is post-scenario chronology and is not projected backward to 7 April 1326.
- Balıkesir coordinate evidence: GeoNames + city-level Wikipedia.
- Bergama coordinate evidence: GeoNames + city-level Wikipedia.
- Both remain CONTROLLER_BINDING_PENDING and geometry NOT_ASSERTED.
- No anchor point is converted into a political polygon.


## Wave 10 — Saruhan / Manisa coordinate and temporal checkpoint

### Manisa

The Manisa pass closes the **independent coordinate** gate for the existing Saruhan candidate and strengthens its pre-scenario historical applicability, but deliberately leaves the exact scenario-date controller unasserted.

- TDV Saruhanoğulları identifies the polity as a Türkmen beylik ruling from Manisa and its surrounding area from the late 13th to early 15th centuries. The entry states that Saruhan Bey established the polity with Manisa as its centre and that Manisa became the beylik's centre after its capture, after which Saruhan Bey expanded his regional power. citeturn0search6
- TDV Saruhan Bey identifies him as the founder of the Manisa-centred Saruhanoğulları beylik. citeturn0search10
- GeoNames reports the Manisa city point as [27.426465, 38.612018]. citeturn0search0
- Wikidata Q147089 reports the same city coordinate, 38°36′43″N, 27°25′35″E, and identifies Manisa in relation to the Beylik of Saruhan. citeturn1search0

Decision:

- register `1326-manisa` as a research-candidate anchor;
- selected coordinate is the exact coordinate reported by both independent coordinate source types;
- `controller = NOT_ASSERTED`;
- `geometry = NOT_ASSERTED`;
- do not infer the 7 April 1326 controller solely from the beylik's pre-scenario institutional continuity;
- do not infer any province polygon or frontier from the Manisa anchor.

This closes the **existence + independent-coordinate** gate for Manisa. The **exact scenario-date controller** gate remains open.


## Wave 11 — Aydın / Birgi–Ayasuluk–Tire

The Aydın pass closes the independent-coordinate gate for three existing high-value candidates without promoting controller or geometry authority.

- TDV Aydınoğulları states that Mehmed Bey took control of Aydın-ili in 1308, then captured Ayasuluk and Tire, and settled in Birgi with his youngest son. It also records the establishment of a naval presence at Ayasuluk. citeturn1search0
- TDV Birgi explicitly identifies Birgi as the first centre of the Aydınoğulları Beyliği. citeturn0search6
- TDV Tire records the transition from Sasa Bey to Aydınoğlu Mehmed Bey during the beyliks period and subsequent Aydınoğulları development of the city. citeturn1search1
- GeoNames reports Birgi [28.059167, 38.250278], Selçuk [27.3684883117676, 37.951371965992], and Tire [27.73508, 38.088769]. citeturn2search13turn2search0turn2search6
- Wikidata provides independent city-point coordinates for Birgi (Q2220449), Selçuk (Q876176), and Tire (Q630533). citeturn1search7turn1search3turn2search2

Decisions:

- register `1326-birgi`, `1326-ayasuluk`, and `1326-tire` as research-candidate anchors;
- retain `controller = NOT_ASSERTED` for all three;
- retain `geometry = NOT_ASSERTED`;
- use city-point semantics only;
- do not project the later 1328/29 İzmir harbour event backward into the scenario date;
- do not infer political boundaries from these anchors.

This closes the **existence + independent-coordinate** gate for the three Aydın candidates. Their exact 7 April 1326 controller binding remains a separate open gate.


## Wave 12 — Candar / Kastamonu

Kastamonu now has a stronger research checkpoint.

- TDV Candaroğulları states that Süleyman Bey took Kastamonu and Safranbolu and moved the beylik centre to Kastamonu. It separately places the end of Demirtaş's Anatolian governorship in 1327 and the Candar ruler's independence after that disruption. This prevents the later independence status from being projected backward into 7 April 1326. citeturn1search0
- TDV Kastamonu likewise states that the Candaroğulları replaced the Çobanoğulları in the early 14th century and that Kastamonu subsequently became the beylik centre. citeturn1search2
- GeoNames city record reports approximately [33.775275, 41.378052]. citeturn0search0
- Wikipedia reports approximately [33.77639, 41.37639]. citeturn3search24

Decision:

- register `1326-kastamonu`;
- retain `historicalApplicability = SCENARIO_RELEVANT`;
- retain `controller = NOT_ASSERTED`;
- retain `geometry = NOT_ASSERTED`;
- do not use the 1327 independence event as April 1326 evidence;
- do not derive political geometry from the city point.

This closes the **existence + independent-coordinate** gate for Kastamonu while leaving exact scenario-date controller binding open.


## Wave 13 — Pontus / Trabzon checkpoint

Trabzon closes the historical-existence and independent-coordinate gates for the Pontus capital candidate.

- TDV Trabzon states that Trabzon became the centre of the state founded by Alexios Komnenos in 1204 and that the Komnenian capital retained its centre status through 1461. It also records Ilkhanid influence and increasing Türkmen pressure in the surrounding region from the 1320s. The pressure is treated as regional chronology, not as evidence of a controller transfer at Trabzon.
- Wikidata Q45301 independently identifies Trabzon/Trebizond and records the Empire of Trebizond association for 1204–1461.
- GeoNames city point: [39.726944, 41.005].
- Wikidata city point: [39.7225, 41.005].
- Selected registry coordinate: the GeoNames source-reported point; no averaging.
- register 1326-trabzon with historicalApplicability = SCENARIO_RELEVANT.
- controller remains NOT_ASSERTED.
- geometry remains NOT_ASSERTED.
- No Ottoman/post-1461 control is projected backward into the 1326 scenario.
- No province polygon or frontier is derived from the anchor.

This closes the existence + independent-coordinate gate for Trabzon; canonical controller binding and geometry reconciliation remain separate production gates.


## Wave 14 — Pontus / Giresun checkpoint

Giresun closes the historical-existence and independent-coordinate gates while adding a strong post-scenario chronology guard.

- TDV Giresun identifies Giresun as the second important centre in the Trebizond Empire's regional geography and a fortified western outpost against surrounding Türkmen groups.
- TDV Tirebolu states that Türkmen groups first reached Tirebolu in 1380 and that Hacı Emîr Bey's son Süleyman Bey captured Giresun in 1396–97. These are POST_SCENARIO events and are not projected backward to 7 April 1326.
- GeoNames city point: [38.387406, 40.91698].
- Wikipedia city point: [38.38944, 40.91528].
- Selected registry coordinate: GeoNames source-reported point; no averaging.
- register 1326-giresun with historicalApplicability = SCENARIO_RELEVANT.
- controller remains NOT_ASSERTED.
- geometry remains NOT_ASSERTED.
- No later Hacıemîroğulları conquest is used as 1326 controller evidence.
- No province polygon or frontier is derived from the anchor.

This closes the existence + independent-coordinate gate for Giresun; exact scenario-date controller binding remains separate.


## Wave 15 — Menteşe / Caria

### 1326-milas
- Status: research candidate / candidate-evidence-only.
- Role: former and initial Menteşe centre; settlement anchor for the 1326 theatre.
- Temporal basis: PRE_SCENARIO evidence; TDV places the initial centre at Milas and records the 1320-1321 transfer toward Muğla.
- Coordinate: [27.783889, 37.316389] from GeoNames; independent Wikidata city point is approximately [27.783333, 37.316667].
- Controller: NOT_ASSERTED.
- Geometry: NOT_ASSERTED.
- Boundary generation: prohibited.

### 1326-mugla
- Status: research candidate / candidate-evidence-only.
- Role: Menteşe political-centre anchor for the 1320s.
- Temporal basis: PRE_SCENARIO evidence; TDV dates the capital transfer from Milas to Muğla to the 1320-1321 Rhodes campaign aftermath.
- Coordinate: [28.366497, 37.218066] from GeoNames; independent German Wikipedia city point is approximately [28.364444, 37.214722].
- Controller: NOT_ASSERTED.
- Geometry: NOT_ASSERTED.
- Boundary generation: prohibited.

### Peçin
- Not added to machine-readable registry in Wave 15.
- Reason: current source chain does not satisfy the strict pre-1326 temporal-binding gate despite strong later Menteşe-centre evidence.


## Wave 16 — Southern Anatolia / Antalya–Alâiye intake

### 1326-antalya
| Field | Value |
|---|---|
| historicalName | Antalya / Attaleia |
| theatre | Southern Anatolia / Hamîd |
| applicability | SCENARIO_RELEVANT |
| coordinate | GeoNames [30.695565, 36.908118] |
| independent coordinate | Wikidata Q6487 [30.666666666666668, 36.96666666666667] |
| controller | NOT_ASSERTED |
| geometry | NOT_ASSERTED |
| state | CANDIDATE_EVIDENCE_ONLY |

TDV Antalya and TDV Hamîdoğulları provide the historical chain connecting Antalya with the Hamîd political sphere and the 1326 chronology. Later 1327 events are retained only as chronology guards and are not projected backward.

### 1326-alaiye
| Field | Value |
|---|---|
| historicalName | Alâiye / Alanya |
| theatre | Southern Anatolia / Karaman–Mamluk frontier |
| applicability | SCENARIO_RELEVANT |
| coordinate | GeoNames [31.999817, 36.543747] |
| independent coordinate | Wikidata Q207341 [31.99972222222222, 36.54388888888889] |
| controller confidence | MEDIUM; not asserted |
| geometry | NOT_ASSERTED |
| state | CANDIDATE_EVIDENCE_ONLY |

TDV Alâiye Beyliği and TDV Alanya establish the pre-scenario Karaman-linked historical chain. Later 1333 evidence is retained as chronology only and does not become an April 1326 controller assertion.

### Wave 16 decision

- Add both candidates to the machine-readable registry and retain candidate-evidence-only status.
- Preserve source-reported coordinates; do not average or derive coordinates.
- Keep controller and political geometry as separate unresolved authority axes.
- No province polygon, frontier, Voronoi surface, or fallback geometry may be generated from either anchor.
- Canonical promotion remains BLOCKED.


## Wave 17 — Central/Eastern Anatolia temporal-gate review

| Target | 1326 registry decision | Reason |
|---|---|---|
| Sivas | HOLD | Eretna political-centre evidence is post-1335; no exact 7 Apr 1326 binding sealed |
| Kayseri | HOLD | Eretna administration is post-scenario in the current source chain |
| Tokat | HOLD | TDV places Eretna control after 1327/1335 chronology; April 1326 controller unresolved |
| Amasya | HOLD | Strong settlement/geographic importance, but current retrieved evidence does not bind political authority to 7 Apr 1326 |
| Tâceddinoğulları | EXCLUDE | Dynasty/polity belongs to the later 14th-century sequence |

No new machine-readable candidate is promoted from this wave. The ledger records these as explicit research targets and temporal guards rather than filling the gap with coordinate-only or later-dynasty inference.


## Wave 18 — Levant / Aleppo–Tripoli intake

| Target | Registry decision | Coordinate gate | Historical gate | Controller | Geometry |
|---|---|---|---|---|---|
| 1326-halep | ADD | GeoNames + Wikidata | Mamluk chronology established before scenario; no post-scenario projection | NOT_ASSERTED | NOT_ASSERTED |
| 1326-trablussam | ADD | GeoNames + Wikidata | Mamluk conquest in 1289; major niyaba centre thereafter | NOT_ASSERTED | NOT_ASSERTED |

Both records remain candidate-evidence-only. Their points are city reference coordinates, not political centroids or boundary seeds. No province polygon, frontier, Voronoi surface, or fallback geometry may be generated from these anchors.


## Wave 19 — Levant core / Damascus intake

| Target | Registry decision | Coordinate gate | Historical gate | Controller | Geometry |
|---|---|---|---|---|---|
| 1326-dimask | ADD | GeoNames + Wikidata | Mamluk continuity plus direct 1312–1340 scenario-era institutional context | NOT_ASSERTED | NOT_ASSERTED |

The Damascus point remains a city reference coordinate only. No provincial boundary or control surface is inferred from it. Canonical promotion remains BLOCKED.


## Wave 20 — Levant coastal corridor / Beirut–Sayda–Safed

| Target | Registry decision | Coordinate gate | Historical gate | Controller | Geometry |
|---|---|---|---|---|---|
| 1326-beyrut | ADD | GeoNames + Wikidata | Mamluk conquest in 1291; Mamluk trade/administrative relevance | NOT_ASSERTED | NOT_ASSERTED |
| 1326-sayda | ADD | GeoNames + Wikidata | Mamluk conquest in 1291; direct Damascus-niyaba relationship | NOT_ASSERTED | NOT_ASSERTED |
| 1326-safed | ADD | GeoNames + Wikidata | Mamluk capture in 1266; one of six Mamluk niyaba centres | NOT_ASSERTED | NOT_ASSERTED |

All three records remain candidate-evidence-only. Their coordinates are source-reported city points and are not political centroids, boundary seeds, or geometry inputs. No later Ottoman administrative structure is projected backward to 1326.


## Wave 21 — Levant interior / Jerusalem settlement

| Target | Registry decision | Coordinate gate | Historical gate | Controller | Geometry |
|---|---|---|---|---|---|
| 1326-kudus | ADD | GeoNames + Wikidata | Mamluk continuity; Jerusalem listed among six Damascus-attached Palestinian areas | NOT_ASSERTED | NOT_ASSERTED |

Jerusalem is intentionally classified as SETTLEMENT, not as an asserted political centre. Its point is a city reference coordinate only; no administrative polygon or exact boundary is inferred.


## Wave 22 — Registry integrity / Tier-1 audit

| Audit | Result |
|---|---|
| Registry records | 32 |
| Unique anchor IDs | 32/32 |
| Duplicate coordinates | 0 |
| Candidate authority status | 32/32 |
| Geometry confidence NOT_ASSERTED | 32/32 |
| Required record fields | 32/32 |

No new anchor is added in this wave. The registry is being treated as an evidence surface only. Alias reconciliation, exact-date controller binding, theatre coverage and confidence/precision review remain open before any canonical geometry work.


## Wave 23 — Exact-date controller confidence audit

| Audit | Result |
|---|---|
| Registry candidates reviewed | 32 |
| Exact-date HIGH retained | 1 (1326-bursa) |
| MEDIUM controller confidence retained | 0 |
| MEDIUM to NOT_ASSERTED corrections | 6 |
| Candidate deletions | 0 |
| Geometry confidence | 32/32 NOT_ASSERTED |
| Canonical promotion | BLOCKED |

The six corrected records are Alâiye, Bilecik, Kütahya, Sinop, Söğüt and Uluborlu. Their historical candidate status is unchanged; only controller confidence was corrected because their stored evidence does not directly bind political control to the exact 7 April 1326 scenario instant. Bursa remains the sole HIGH controller-confidence record because its stored evidence dates the surrender to 6 April 1326.

This wave closes the current exact-date controller-confidence audit without converting historical continuity into controller authority and without opening any geometry promotion path.


## Wave 24 — Tier-1 theatre coverage matrix

| Intended theatre | Registry anchors | Coverage state | Production interpretation |
|---|---:|---|---|
| Anatolia | 22 | PARTIAL / anchor-covered | Candidate surface exists; not a complete historical province inventory |
| Byzantine geography | 3 | PARTIAL / anchor-covered | Nicaea + Trabzon/Giresun represented; Byzantine Thrace remains open |
| Balkans | 0 | RESEARCH GAP | No 1326 production candidate; later Ottoman Rumelia evidence is not projected backward |
| Levant | 7 | PARTIAL / anchor-covered | Levant core represented; Cilicia/Çukurova remains open |

### Guardrails

- Registry coverage is not political-boundary coverage.
- Zero Balkan anchors is an explicit research state, not a missing geometry placeholder.
- Byzantine Thrace requires its own 1326 evidence/temporal-binding pass.
- Cilicia/Çukurova requires a local Mamluk/frontier evidence pass.
- No new anchor is added from this matrix alone.
- Canonical promotion remains BLOCKED.

Wave 24 closes the coverage classification. The next ledger step is confidence/coordinate-precision consistency across the 32 records.


## Wave 25 — Confidence / coordinate-precision consistency audit

| Check | Result |
|---|---|
| Existence confidence | 32/32 HIGH |
| Coordinate confidence | 32/32 HIGH |
| Temporal applicability confidence | 21 HIGH / 11 MEDIUM |
| Controller confidence | 1 HIGH / 31 NOT_ASSERTED |
| Geometry confidence | 32/32 NOT_ASSERTED |
| Coordinate precision | 32/32 SOURCE_REPORTED |
| Independent coordinate source-type pairs | 32/32 |
| Selected point matches declared source | 32/32 |

The live registry requires no record-level correction from this audit. The deterministic validator was hardened so invalid confidence and coordinate-precision values fail the gate instead of relying only on the JSON schema. Contract tests now include negative cases for those two classes.

Canonical promotion remains BLOCKED until the hardened gate is proven green in CI.


## Wave 26 — Deterministic registry gate closure / transition review

| Gate | State |
|---|---|
| 32-anchor registry integrity | PASS |
| Exact-date controller confidence | PASS |
| Theatre coverage classification | CLOSED |
| Confidence / precision consistency | PASS |
| Runtime deterministic registry validator | PASS |
| Negative confidence / precision tests | PASS |
| Historia AI CI #3413 | SUCCESS |
| Cliopatria acquisition #104 | SUCCESS |
| Canonical political geometry | BLOCKED |

The hardened registry gate is now CI-proven. The next controlled layer is explicit physical-authority evidence binding for the selected T3-B pilot review set. No automatic candidate-to-polygon transition is authorized.

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
| 1326-settlement-balikesir | Balıkesir | Karasi / Mysia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | 1328 two-centre evidence is POST_SCENARIO | CONTROLLER_BINDING_PENDING | April 1326 local controller |
| 1326-settlement-bergama | Bergama | Karasi / Mysia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Controller extent not sealed | CONTROLLER_BINDING_PENDING | April 1326 local controller |
| 1326-settlement-manisa | Manisa | Saruhan / Lydia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Saruhan centre evidence strong; exact date binding needed | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-birgi | Birgi | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid centre evidence strong; exact date binding needed | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-ayasuluk | Ayasuluk | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid evidence strong; later İzmir events excluded | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-tire | Tire | Aydın / Lydia-Ionia | PRE_SCENARIO / SCENARIO_RELEVANT | Coordinate evidence pending second-source seal | Aydınid evidence strong; exact date binding needed | CONTROLLER_BINDING_PENDING | Stable 1326 source binding |
| 1326-settlement-sinop | Sinop | Candar / Paphlagonia | PRE_SCENARIO — Pervâneoğulları ended 1322 | Existing independent coordinate | Candar transition strongly evidenced | CANDIDATE | Stable machine-readable refs + precision policy |
| 1326-settlement-kastamonu | Kastamonu | Candar / Paphlagonia | SCENARIO_RELEVANT regional candidate | Coordinate evidence pending second-source seal | Controller not sealed | CONTROLLER_BINDING_PENDING | Explicit April 1326 local binding |
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

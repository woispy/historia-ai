# Historia AI — 1326 Anchor Authority Research Contract

## Status

**Research-backed anchor authority preparation — NOT YET PRODUCTION-READY**

This document establishes the evidence contract for the missing 1326 anchor registry required by T3-B candidate surface screening.

It deliberately does not promote the existing 1300 political builder, 1300 province metadata, test fixtures, or legacy polygon centroids into 1326 authority.

## Authority model

T3-B needs explicit WGS84 point anchors, but an anchor is narrower than a political province:

- an anchor identifies a historically relevant settlement, site, corridor, fortress, pass, port, or regional reference point;
- its coordinate is a cartographic location, not a political boundary;
- historical applicability must be demonstrated for scenario date 1326-04-07;
- controller ownership is a separate evidence axis;
- an anchor must never imply a province polygon.

Authority chain:

    historical-source evidence
            +
    independent cartographic coordinate
            ↓
    1326 anchor record
            ↓
    candidate surface screening
            ↓
    geometry review

## Required production record

Every production anchor must contain:

- anchorId — stable immutable identifier;
- scenarioDate — exactly 1326-04-07;
- historicalName;
- modernName when applicable;
- geometry.coordinates — WGS84 [longitude, latitude];
- anchorType;
- historicalApplicability;
- historicalEvidenceRefs;
- coordinateEvidenceRefs;
- coordinatePrecision;
- confidence;
- authorityStatus.

The registry must also declare:

    sourcePolicy = historical-evidence-plus-independent-coordinate
    geometryGeneration = false
    controllerInference = false
    canonicalPromotion = false

## Initial research candidates

These records are research candidates, not yet the final production registry.

### A-001 — Bursa / Prusa

anchorId: 1326-settlement-bursa
coordinate: approximately [29.061, 40.192]
historical role: Byzantine Bithynian centre; captured by Orhan in 1326.
scenario relevance: HIGH
status: research-backed-candidate

TDV Orhan records the 1326 spring campaign and surrender on 6 April 1326. TDV Bursa independently records the surrender on 6 April 1326.

### A-002 — Nicaea / İznik

anchorId: 1326-settlement-nicaea
coordinate: approximately [29.721, 40.429]
historical role: major fortified Byzantine Bithynian city and active Ottoman objective before 1326.
scenario relevance: HIGH
status: research-backed-candidate

TDV Orhan records the sustained Ottoman pressure around İznik before the 1326 Bursa campaign. Wikidata records İznik/Nikaia and its coordinate location.

### A-003 — Nicomedia / İzmit

anchorId: 1326-settlement-nicomedia
coordinate: approximately [29.918, 40.763]
historical role: major Bithynian urban centre.
scenario relevance: HIGH
status: research-backed-candidate-awaiting-temporal-source-binding

The historical role is present in the existing project research, but a source explicitly bound to the 1326 temporal window must still be attached before production sealing.

### A-004 — Söğüt

anchorId: 1326-settlement-sogut
coordinate: approximately [30.181, 40.019]
historical role: early Ottoman frontier settlement and former political centre.
scenario relevance: HIGH
status: research-backed-candidate

TDV Söğüt describes its importance in the earliest Ottoman period and its declining administrative importance after Bursa's 1326 conquest.

### A-005 — Bilecik

anchorId: 1326-settlement-bilecik
coordinate: approximately [29.980, 40.146]
historical role: early Ottoman-associated settlement and Edebâli/Osman network site.
scenario relevance: MEDIUM-HIGH
status: research-backed-candidate

TDV Dursun Fakih records Bilecik in the early Ottoman political and religious network. TDV Edebâli Zâviyesi records the 1326 context of the Bilecik site.

### A-006 — Geyve / Sangarios corridor

anchorId: 1326-corridor-geyve
coordinate: approximately [30.296, 40.517]
historical role: geographic corridor associated with the Sangarios/İznik frontier system.
scenario relevance: MEDIUM
status: research-backed-candidate

TDV Orhan records the Absu/Hypsu fortress in the Geyve Gorge among Orhan's early operations against İznik. The point is a corridor/reference anchor only, not evidence for a political polygon.

### A-007 — Dorylaion / Eskişehir

anchorId: 1326-settlement-dorylaion
coordinate: approximately [30.521, 39.777]
historical role: inland western-Anatolian geographic reference.
scenario relevance: MEDIUM
status: research-backed-candidate-awaiting-temporal-source-binding

The coordinate is independently available, but a dedicated 1326 historical source binding is still required.

### A-008 — Kütahya

anchorId: 1326-settlement-kutahya
coordinate: approximately [29.983, 39.424]
historical role: Germiyan political centre.
scenario relevance: MEDIUM-HIGH
status: research-backed-candidate-awaiting-temporal-source-binding

Existing project research identifies Kütahya as the high-confidence Germiyan anchor around 1300. A dedicated 1326 source binding is still required before production authority.

## Important distinction

The initial set is deliberately heterogeneous:

- settlement anchors provide spatial reference points;
- corridor anchors provide physical/geographic reference;
- none define political boundaries;
- none may be converted into province polygons by proximity.

A source proving that a settlement existed or mattered in 1326 does not prove its surrounding political extent.

## Wave 4 — Hamid/Pisidia targeted closure

This wave intentionally narrows the work to the next unresolved Hamid/Pisidia candidate rather than reopening already-closed research.

### Eğridir / Eğirdir

The evidence chain is now sufficient to register Eğridir as a **research candidate anchor**, but not to assert its 1326-04-07 controller.

- TDV Eğridir identifies the city as the second centre of the Hamîdoğulları beylik and states that Timurtaş occupied it in 1324; Hızır Bey returned to Eğridir in 1328. citeturn0search13
- TDV Hamîdoğulları states that Dündar Bey moved the government centre to Eğridir around 1307 and that the city was named Felekâbâd in this period. citeturn0search4
- GeoNames provides a populated-place coordinate of approximately [30.850425, 37.874616]. citeturn1search1
- Wikidata Q586434 provides the city coordinate 37°52'30"N, 30°51'2"E, approximately [30.850556, 37.875000]. citeturn1search0

Decision:

- add `1326-egirdir` to the machine-readable research-candidate registry;
- retain `controller = NOT_ASSERTED`;
- retain `geometry = NOT_ASSERTED`;
- use only city-point coordinate semantics;
- do not use the 1324 occupation or 1328 restoration as a shortcut to infer the exact April 1326 political controller;
- do not derive any political polygon from the anchor.

This closes the **existence + independent-coordinate** gate for Eğridir. It does **not** close the controller-at-scenario-date gate.

## Current verdict

The project now has enough material to establish a research ledger, but not enough to seal the complete production registry.

Required before production:

1. temporal source binding for every anchor;
2. independent coordinate source for every anchor;
3. stable machine-readable source references;
4. coverage review for the full intended 1326 theatre;
5. duplicate and alias reconciliation;
6. explicit confidence and precision policy;
7. deterministic registry validator;
8. CI validation of the final registry.

Until those gates pass:

    anchorRegistry.authorityStatus = research-candidate
    anchorRegistry.promotion = BLOCKED

## Prohibited shortcuts

- copying the 1300 political registry into 1326;
- copying 1300 province centroids into 1326;
- deriving anchors from 1300 polygon geometry;
- using test fixtures as production authority;
- generating anchors from candidate proximity;
- using anchors to infer controller;
- generating or clipping political geometry from anchor points.

## Next research wave

Expand by historical theatre rather than repeating Bithynia:

1. Marmara / Bithynia
2. Ottoman frontier / western Phrygia
3. Germiyan / inner-western Anatolia
4. Karaman / Lycaonia
5. Hamid / Pisidia
6. Eşref / Beyşehir transition
7. Menteşe / Caria
8. Aydın / Lydia-Ionia transition
9. Saruhan / Lydia
10. Karasi / Mysia
11. Candar / Paphlagonia
12. Pontus / Trebizond
13. central and eastern Anatolian reference centres
14. Cilicia and Levant-facing southern corridor

Each theatre must be completed from historical evidence first; coordinate assignment is a separate cartographic step.

## Sources used for this checkpoint

- TDV İslâm Ansiklopedisi — Orhan: 1326 Bursa campaign and preceding İznik frontier operations.
- TDV İslâm Ansiklopedisi — Bursa: surrender on 6 April 1326.
- TDV İslâm Ansiklopedisi — Söğüt: early Ottoman settlement and its changing role after Bursa.
- TDV İslâm Ansiklopedisi — Dursun Fakih: early Bilecik/Edebâli context.
- TDV İslâm Ansiklopedisi — Edebâli Zâviyesi: Bilecik site and 1326 context.
- Wikidata — İznik (Q217125): historical name and coordinate location.
- GeoNames — Geyve İlçesi: coordinate reference.
- GeoNames — Eskişehir: coordinate reference.
- independent historical-site/cartographic coordinate records for Nicomedia, Söğüt, Bilecik and Kütahya.


## Wave 1 historical-temporal findings

The regional source pass strengthens several anchors and also exposes where a 1326 date must be treated carefully.

### Hamid / Pisidia

TDV Hamîdoğulları states that Hamîd Bey made Uluborlu the government centre around 1297 and that the Hamidid political sphere included Isparta, Burdur, Eğirdir and surrounding settlements. It also records Dündar Bey's rule and his death in 1326. TDV Eğridir states that Eğridir became the second centre of the Hamidid beylik and that the city was occupied by Timurtaş in 1324, with Hızır Bey restoring control only in 1328.

Implication:

- Uluborlu is a strong historical anchor candidate for the 1326 theatre.
- Eğridir is a strong historical/geographic anchor candidate, but its 1326 controller state must not be simplified from later 1328 evidence.
- Isparta and Burdur remain useful regional anchors.
- No Hamidid polygon should be inferred from these points.

### Eşref / Beyşehir

TDV Eşrefoğulları records that II. Süleyman was killed by Timurtaş at Beyşehir on 9 October 1326 and that the beylik then broke apart, with Beyşehir, Seydişehir, Akşehir and surrounding territory subsequently taken by Hamîdoğulları.

Implication:

- Beyşehir is a high-value 1326 anchor candidate.
- The date is especially important: evidence after 9 October 1326 cannot be silently treated as evidence for the scenario date 7 April 1326.
- The registry must therefore distinguish pre-event and post-event evidence.

### Germiyan / Kütahya

TDV Germiyanoğulları identifies Kütahya as the centre of Germiyan and Yakub Bey as its ruler from 1300 to 1340. It also describes Timurtaş's 1325-1327 campaign against the western Anatolian beyliks.

Implication:

- Kütahya is a strong regional anchor candidate.
- The anchor establishes historical relevance of the settlement/centre, not the exact 1326 Germiyan frontier.
- A separate 1326 controller/boundary review remains mandatory.

### Sinop / Candar transition

TDV Pervâneoğulları records the end of the Pervâneoğulları polity in 1322 and the incorporation of Sinop into Süleyman Bey's Candaroğlu sphere. TDV Sinop independently records the same transition.

Implication:

- Sinop is a strong 1326 settlement anchor.
- The project must not carry the 1300 Pervâneoğulları controller into the 1326 scenario.
- This is a useful example of why temporal anchor evidence and controller evidence must be separated.

### Aydın / Birgi / Ayasuluk

TDV Aydınoğulları places the formation of the beylik in the Büyük Menderes–Tire–Ayasuluk–Birgi region and records Mehmed Bey's control of Ayasuluk, Tire, Sultanhisarı and Birgi-area territory beginning in 1308.

Implication:

- Birgi and Ayasuluk are valid historical anchor candidates for the 1326 theatre.
- Their exact political extent requires separate source reconciliation.
- Later events such as the İzmir conquest of 1328/1329 must not be projected backward to 7 April 1326.

## Temporal rule added to the authority model

For scenario date 1326-04-07, an anchor evidence reference must be classified as one of:

- PRE_SCENARIO — evidence ending before 1326-04-07;
- SCENARIO_WINDOW — evidence directly covering or immediately surrounding the scenario date;
- POST_SCENARIO — evidence occurring after 1326-04-07;
- UNDATED — historical evidence without a usable temporal bound.

POST_SCENARIO evidence may support historical existence or later change history, but it cannot by itself establish the scenario-date controller or boundary.

This is especially important for the 1326 Eşref/Hamid transition and for events occurring later in the same year.

## Wave 1 verdict

The research pass now supports a larger candidate pool than the initial Bithynia-only set:

- Bursa
- Nicaea
- Nicomedia
- Söğüt
- Bilecik
- Geyve / Sangarios corridor
- Dorylaion / Eskişehir
- Kütahya
- Uluborlu
- Eğridir
- Isparta
- Burdur
- Beyşehir
- Sinop
- Birgi
- Ayasuluk

These remain **research candidates**, not production anchors, until independent coordinate references and machine-readable historical evidence bindings are attached.



## Wave 2 historical-temporal findings

### Karaman / Lycaonia

TDV Karamanoğulları records that after Demirtaş left Anatolia, the Karamanids took Konya, Gevele Castle and Beyşehir in 1328-1329. It also identifies Lârende as the Karamanid capital from Bedreddin İbrahim Bey onward.

Implication for 1326-04-07:

- Lârende/Karaman is a valid high-value regional anchor candidate.
- Konya must not be labelled Karamanid on 7 April 1326 solely from the later 1328-1329 conquest.
- Beyşehir must remain tied to the Eşrefid/Hamid transition chronology rather than being assigned to Karaman from the later event.
- The anchor registry must separate settlement existence from controller-at-scenario-date.

### Germiyan / Kütahya

TDV Germiyanoğulları and TDV Yâkub Bey both identify Kütahya as the Germiyan political centre. TDV Germiyanoğulları also records Timurtaş's 1325 campaign against Eşref and Hamid and the subsequent pressure on Germiyan, Denizli, Alaşehir and Menteşe.

Implication:

- Kütahya is a strong 1326 regional anchor.
- The surrounding Germiyan political extent remains a separate boundary question.
- The 1325-1327 Timurtaş campaign is scenario-relevant evidence, but must not be converted into a polygon or controller inference without local evidence.

### Hamid / Pisidia

TDV Hamîdoğulları states that Hamîd Bey made Uluborlu the government centre around 1297 and established the beylik around Isparta, Burdur, Eğridir and nearby districts. TDV related material identifies Feleküddin Dündar Bey as ruler in 1301-1326.

Implication:

- Uluborlu, Isparta, Burdur and Eğridir are strong regional anchor candidates.
- Dündar Bey's death in 1326 requires exact-date care: evidence after his death cannot be used as if it described the 7 April start frame.
- Eğridir's political chronology must remain distinct from the settlement anchor itself.

### Eşref / Beyşehir

TDV Eşrefoğulları records II. Süleyman's death at Beyşehir on 9 October 1326, after which Beyşehir, Seydişehir, Akşehir and surrounding territory were taken by Hamîdoğulları.

Implication:

- Beyşehir is a high-value settlement anchor.
- The 9 October 1326 event is POST_SCENARIO for the 7 April start date.
- Later Hamid control must not be projected backward to April.

### Karasi / Mysia

TDV Karesioğulları records that Karesi Bey's polity controlled much of Mysia, including Balıkesir and Bergama, from the late thirteenth/early fourteenth century. It records Karesi Bey's death before 1328 and Yahşi Bey's succession, with Demirhan governing Balıkesir. The 1328 Biga agreement provides later evidence of the two-centre structure.

Implication:

- Balıkesir and Bergama are strong settlement/regional anchor candidates.
- The 1328 two-centre arrangement is POST_SCENARIO and cannot by itself define the April 1326 political configuration.
- Balıkesir remains an anchor candidate; exact 1326 controller/boundary requires separate reconciliation.

### Saruhan / Lydia

TDV Saruhanoğulları places the beylik in the Manisa region from the 1290s, centred on Manisa.

Implication:

- Manisa is a strong regional anchor candidate.
- Saruhan political extent requires local temporal evidence before geometry review.
- Later Aegean expansion must not be projected backward.

### Aydın / Lydia-Ionia

TDV Aydınoğulları records Mehmed Bey's conquest of Aydın-ili in 1308 and his control of İzmir's Muslim quarter, Ayasuluk, Tire, Sultanhisarı and Bodemya, with Birgi as his residence. The İzmir harbour conquest is dated to 1328 or 1329.

Implication:

- Birgi, Ayasuluk and Tire are strong settlement anchor candidates.
- İzmir harbour conquest is POST_SCENARIO and cannot establish April 1326 control.
- The anchor can identify the settlement; it cannot define the surrounding Aydınid polygon.

### Candar / Paphlagonia

TDV Candaroğulları states that Süleyman Bey succeeded Candar around 1308 and later annexed Sinop when the Pervâneoğulları line ended in 1322. TDV Pervâneoğulları independently records the end of the Sinop polity in 1322.

Implication:

- Sinop is a strong 1326 settlement anchor.
- Sinop must not retain the 1300 Pervâneoğulları controller.
- Kastamonu is a regional anchor candidate, but the precise 1326 political configuration requires further local evidence.

### Pontus / eastern Black Sea

The current Wave 2 source pass confirms that the eastern Black Sea remained a distinct historical theatre, but the present source set does not yet provide a sufficiently explicit 7 April 1326 anchor/controller binding for all intended Pontus settlements.

Implication:

- Trebizond remains a high-value geographic anchor candidate.
- Giresun/Kerasus is a candidate requiring caution: TDV Giresun documents continued Trabzon imperial context but also early fourteenth-century Turkmen pressure.
- No Pontus political polygon should be inferred until the local temporal source chain is completed.

## Wave 2 temporal classification summary

**Strong candidate anchors:**

- Lârende / Karaman
- Kütahya
- Uluborlu
- Isparta
- Burdur
- Eğridir
- Beyşehir
- Balıkesir
- Bergama
- Manisa
- Birgi
- Ayasuluk
- Tire
- Sinop
- Kastamonu
- Trebizond

**Requires additional 1326 temporal binding before production:**

- Konya
- Giresun/Kerasus
- other eastern Black Sea settlements

**Explicit post-scenario evidence that must not be projected backward:**

- Karamanid conquest of Konya/Beyşehir in 1328-1329
- Eşrefid collapse on 9 October 1326
- Karesi two-centre evidence from 1328
- Aydınid İzmir harbour conquest in 1328/1329

This wave reinforces the central rule: **anchor existence, controller-at-date, and political boundary are three different evidence claims.**


## Wave 3 historical-temporal findings

Wave 3 expands the research ledger into Caria/Menteşe, Pontus/Trabzon, Byzantine Marmara–Thrace context, and the southern Cilicia/Levant corridor. The pass also records where a theatre should remain an evidence-only geographic reference rather than being forced into a 1326 political anchor.

### Menteşe / Caria

TDV Menteşeoğulları places the beylik in southwestern Anatolia, extending across Muğla, Peçin, Milas and Balat toward the Aegean coast, and identifies Milas as the capital with Peçin as a nearby seasonal residence. TDV Muğla adds an important temporal detail: after Orhan Bey's unsuccessful 720-721/1320-1321 Rhodes expedition, the capital was moved for a period from Milas to the more inland Muğla for security.

Implication for 1326-04-07:

- Milas/Peçin is a strong historical centre anchor candidate for the Menteşe theatre.
- Muğla is a separate high-value administrative anchor candidate because the documented relocation occurred before the scenario date.
- The wording indicates a temporary relocation; therefore the registry must not silently replace Milas/Peçin with Muğla as the permanent Menteşe capital.
- Balat remains a high-value coastal/trade reference anchor.
- None of these centres establish the Menteşe political boundary by themselves.

Temporal classification:

- Menteşe territorial-centre evidence: PRE_SCENARIO / SCENARIO_RELEVANT.
- Muğla relocation evidence: PRE_SCENARIO.
- 1330 Hacı İlyas Mosque evidence is POST_SCENARIO and must not be used as direct April 1326 controller evidence.

### Pontus / Trabzon / Giresun

TDV Trabzon identifies Trabzon as the capital of the Empire of Trebizond throughout 1204-1461. TDV Giresun identifies Kerasus/Giresun as a fortified settlement within the wider Trabzon imperial context after 1204, while also documenting early-fourteenth-century Çepni/Türkmen pressure. It records that in 1301 Emperor Alexios II defeated the Türkmen leader Koustougans and strengthened the fortress.

Implication:

- Trebizond/Trabzon is a strong high-value 1326 geographic and political-centre anchor candidate.
- Giresun/Kerasus is a strong geographic anchor candidate, but the present source does not provide a sufficiently explicit 7 April 1326 controller statement to seal a production controller binding.
- The 1301 Kerasus fortification episode is PRE_SCENARIO evidence; it demonstrates historical relevance but does not by itself prove the exact April 1326 local political status.
- The project must preserve the distinction between Trabzon imperial context, local fortress status, Türkmen pressure, and a province boundary.
- No Pontus polygon may be inferred from the Trabzon/Giresun anchor pair.

### Byzantine Marmara / Thrace transition

The current source pass confirms that the 1326 scenario remains overwhelmingly an Anatolian/Byzantine Marmara frame rather than an Ottoman Rumelian frame. TDV Bizans and TDV Osmanlılar place Bursa's capture on 6 April 1326 and date the later European expansion to the mid-fourteenth century. TDV Gelibolu records the much later Ottoman capture of Gelibolu, while the broader Byzantine chronology places Ottoman Rumeli expansion after 1353-1354.

Implication:

- Istanbul/Constantinople, Adrianople/Edirne, and Gallipoli/Gelibolu may be retained as geographic reference anchors for the full 1326-1800 theatre, but they must not be treated as Ottoman 1326 control anchors.
- Gelibolu is explicitly a POST_SCENARIO Ottoman theatre; its later strategic importance cannot be projected back to 1326.
- For the 1326 start frame, Byzantine Thrace should be represented through separate Byzantine geographic anchors and historical evidence, not through Ottoman ownership assumptions.
- A dedicated Byzantine 1326 anchor pass remains required before adding production records for Thrace/Balkan centres.

### Cilicia / Çukurova

TDV Ramazanoğulları dates the emergence of the Ramazanoğulları beylik to the mid-fourteenth century, with Ramazan Bey becoming prominent around 1352-1354. Therefore Adana/Ceyhan/Misis cannot be assigned to a Ramazanoğlu political anchor in the 1326 scenario.

TDV Antakya records Baybars's 1268 destruction of Antioch and the subsequent decline of the city; it also records Antioch within the later Mamluk administrative structure. This makes Antakya a useful geographic reference but a poor candidate for a strong urban-political anchor at the 1326 start without additional local evidence.

Implication:

- Do not create a 1326 Ramazanoğlu anchor for Adana, Ceyhan, or Misis.
- Çukurova must be researched as a Mamluk/Anatolian frontier theatre for 1326, with separate local source bindings.
- Antakya may be retained as a southern geographic reference anchor, but its post-1268 reduced status must be reflected in confidence and anchor type.
- The absence of a 1326 Ramazanoğlu polity is itself a source-backed exclusion and should be preserved in the research ledger.

### Levant / North Syria

TDV Halep records Halep as the major northern Syrian crossroads and states that after the 1260 Mongol episode the city was left to the Mamluks; the Mamluk period continued until the Ottoman conquest in 1516.

TDV Trablusşam records Sultan Kalavun's conquest of Tripoli in 1289 and explicitly identifies Trablusşam as the centre of one of the six major Mamluk nāibliks. This makes Tripoli a strong 1326 Levant anchor candidate.

Implication:

- Halep is a strong 1326 settlement/administrative-centre anchor candidate under the Mamluk theatre.
- Trablusşam/Tripoli is a strong 1326 settlement/administrative-centre anchor candidate under the Mamluk theatre.
- These anchors are useful for the intended Levant coverage, but their coordinates still require independent cartographic evidence before production sealing.
- Antakya should remain lower-confidence than Halep/Tripoli because of its severe post-1268 destruction and later reduced status.
- No Mamluk province boundary should be generated from anchor proximity.

### Wave 3 temporal classification summary

**New strong historical anchor candidates:**

- Milas / Mylasa
- Peçin / Beçin
- Muğla
- Balat
- Trebizond / Trabzon
- Halep / Aleppo
- Trablusşam / Tripoli

**Strong geographic candidates requiring explicit 1326 local binding:**

- Giresun / Kerasus
- Antakya / Antioch
- Adana
- Ceyhan
- Misis

**Explicit exclusions / chronology guards:**

- Ramazanoğulları cannot be used as a 1326 controller: the dynasty's documented emergence is mid-fourteenth century.
- Gelibolu cannot be used as an Ottoman 1326 anchor: Ottoman Rumeli expansion belongs to the later 1350s.
- Later Aegean/Marmara Ottoman expansion must not be projected backward from post-1326 events.
- The 1330 Milas Hacı İlyas Mosque is post-scenario evidence and is not a substitute for April 1326 political evidence.

### Wave 3 verdict

The research ledger now covers the previously missing Menteşe and Levant-facing theatres with source-backed chronology. It also produces two important negative findings:

1. **Cilicia cannot be shortcut through Ramazanoğlu history**; the 1326 theatre must be reconstructed from the Mamluk/frontier evidence.
2. **Rumelia cannot be shortcut through later Ottoman conquest history**; Byzantine Thrace requires its own 1326 anchor/evidence pass.

The next production-facing research task is therefore no longer broad discovery. It is **targeted temporal binding + independent coordinate collection** for the accumulated anchor pool, while filling the remaining gaps in Menteşe, Pontus, Cilicia and Byzantine Thrace.

### Wave 3 sources

- TDV İslâm Ansiklopedisi — Menteşeoğulları.
- TDV İslâm Ansiklopedisi — Muğla.
- TDV İslâm Ansiklopedisi — Trabzon.
- TDV İslâm Ansiklopedisi — Giresun.
- TDV İslâm Ansiklopedisi — Bizans.
- TDV İslâm Ansiklopedisi — Osmanlılar.
- TDV İslâm Ansiklopedisi — Gelibolu.
- TDV İslâm Ansiklopedisi — Ramazanoğulları.
- TDV İslâm Ansiklopedisi — Antakya.
- TDV İslâm Ansiklopedisi — Halep.
- TDV İslâm Ansiklopedisi — Trablusşam.


## Wave 3 coordinate-evidence intake

This is a cartographic evidence checkpoint only. No coordinate below is promoted to production authority until the final registry has stable source references, precision policy, duplicate/alias review, and CI validation.

### Candidate coordinate records

**Milas / Mylasa**
- GeoNames: approximately [27.783889, 37.316389].
- Wikidata Mylasa: approximately [27.78333, 37.31667].
- The two records converge closely enough to establish a stable research coordinate candidate.
- Historical applicability remains sourced separately through the Menteşe/Milas evidence; coordinate evidence does not establish political extent.

**Beçin / Peçin**
- GeoNames: approximately [27.795992, 37.273648].
- Wikidata Beçin: approximately [27.789056, 37.274925].
- The small difference is compatible with different settlement/reference-point definitions; production precision policy must decide whether the anchor represents the settlement centroid, fortress/site, or another named reference.
- Do not silently collapse the two coordinate meanings into one canonical point.

**Muğla**
- GeoNames: approximately [28.366497, 37.218066].
- Wikidata province-level records also place Muğla near [28.5064, 37.0308], but that result is a province reference rather than a safe city-point authority.
- For the 1326 anchor registry, the city-level GeoNames point is the better research candidate; it still requires a second city-specific coordinate source before sealing.

**Balat / Miletus-area**
- The modern Balat/Didim Wikidata record gives approximately [27.276875, 37.512092].
- This is a useful coordinate candidate for the Menteşe/Aegean coastal theatre, but historical identity must be explicitly bound to medieval Balat before production use.

**Trabzon / Trebizond**
- Wikidata gives approximately [39.7225, 41.005], with the entity explicitly linked to the Empire of Trebizond (1204-1461).
- This is a strong coordinate candidate for the historical centre anchor, but the production record still needs a second stable coordinate source and explicit source-reference persistence.

**Halep / Aleppo**
- GeoNames gives approximately [37.161173, 36.201241].
- Wikidata gives approximately [37.16, 36.20].
- The close convergence makes this a strong coordinate candidate for the 1326 Levant anchor.

**Trablusşam / Tripoli**
- GeoNames gives approximately [35.84415, 34.43352].
- Wikidata gives approximately [35.83444, 34.43667].
- The difference is small but should be retained as source-level evidence rather than silently averaged.

### Coordinate-evidence policy reaffirmed

The current intake establishes a useful pattern for the production registry:

1. historical evidence answers **"was this place relevant at 1326-04-07?"**;
2. coordinate evidence answers **"where is the named place/reference point?"**;
3. controller evidence answers **"who controlled it at the scenario date?"**;
4. geometry evidence answers **"what was the political boundary?"**.

These four claims remain independent.

Therefore:

- no coordinate average is generated automatically;
- no coordinate is derived from a 1300 polygon or centroid;
- no coordinate is used to infer controller;
- no coordinate is used to generate a political polygon;
- coordinate precision must be recorded explicitly;
- when two sources identify different physical reference points for the same historical name, the registry must preserve the distinction until alias/reference-point reconciliation is complete.

### Wave 3 coordinate verdict

The coordinate gap is now partially reduced for the newly researched Menteşe and Levant anchors, but it is **not closed**.

Still required before production sealing:

- stable source URLs/IDs persisted in machine-readable records;
- a second city/site-specific coordinate source for each production anchor;
- explicit precision semantics;
- alias and historical-site reconciliation;
- deterministic validator checks;
- CI validation.

The research phase should now move toward a **candidate anchor ledger**, not yet a canonical registry.


## Machine-readable anchor candidate registry — 2026-10-07

The first machine-readable research candidate registry is now stored at:

    data/gis/1326/anchor-candidate-registry.json

Its contract is:

    data/gis/1326/anchor-candidate-registry.schema.json

The registry currently contains four evidence-layer candidates:

- `1326-bursa`
- `1326-bilecik`
- `1326-kutahya`
- `1326-sinop`

These records are deliberately **not** canonical authority. The registry root is `research-candidate-registry`, every record is `candidate-evidence-only`, and geometry confidence is `NOT_ASSERTED`.

### Registry gates

Every candidate record now requires:

1. scenario date `1326-04-07`;
2. at least one historical evidence reference with `PRE_SCENARIO` or `SCENARIO_WINDOW` temporal applicability;
3. at least two coordinate evidence references from distinct source types;
4. explicit WGS84 `[longitude, latitude]` coordinates;
5. explicit physical reference-point semantics;
6. selected anchor coordinates that exactly match one declared source coordinate;
7. `geometryGeneration = false`;
8. `controllerInference = false`;
9. `canonicalPromotion = false`.

The selected point is therefore never an average, interpolation, polygon centroid, or proximity-derived coordinate.

### Current evidence posture

**Bursa** is the strongest current candidate. TDV Orhan and TDV Bursa independently place the surrender on 6 April 1326, immediately before the scenario date. GeoNames and Wikidata provide the coordinate evidence pair. This supports a high-confidence settlement/centre anchor, but does not provide a political province polygon.

**Bilecik** has strong pre-scenario Ottoman administrative evidence and a convergent GeoNames/Wikidata city-point pair. Its exact scenario-date political extent remains a separate review question.

**Kütahya** has strong historical centre evidence through TDV Kütahya and TDV Germiyanoğulları, with matching GeoNames/Wikidata city coordinates. The registry intentionally leaves scenario-date controller confidence below the Bursa level because centre existence does not by itself define the 7 April 1326 frontier.

**Sinop** has strong historical relevance and independent city-point coordinate evidence from GeoNames and the direct Sinop city page, but the exact April 1326 controller chronology remains deliberately below sealed/high confidence. The registry therefore preserves it as a candidate rather than projecting later Candaroğlu administration backward without a date-specific binding.

### Validation

The registry is fail-closed through:

    npm run validate:1326-anchor-candidate-registry -- --input data/gis/1326/anchor-candidate-registry.json

and its contract test:

    npm run test:1326-anchor-candidate-registry

The validator rejects duplicate anchor IDs, single-source coordinate pairs, generated/averaged points, invalid WGS84 coordinates, missing temporal evidence, and any attempt to mark candidate geometry as asserted.

This is the first machine-readable bridge from the research ledger toward T3-B screening. It is intentionally still below production authority.

### Next controlled research gate

The next work should expand this registry only where the evidence chain is genuinely closable:

- exact 1326-04-07 temporal/controller binding for the remaining high-value anchors;
- second independent coordinate sources for anchors still marked coordinate-pending;
- historical-name/modern-name alias reconciliation;
- source-reference stability review;
- dedicated Byzantine Thrace and Cilicia/Mamluk temporal passes;
- CI execution of the new registry validator and test.

No candidate registry record may be converted directly into a political polygon.


## Wave 5 — Isparta targeted closure

Isparta now has a research-grade candidate coordinate pair and historical relevance, but the scenario-date controller remains deliberately unresolved.

- TDV Isparta places the city within the Hamîdoğulları sphere and describes the Feleküddin Dündar Bey period (1301–1326), while also recording a regional political change in 1326 after Demirtaş's withdrawal. citeturn0search1
- TDV Feleküddin Dündar Bey identifies Dündar as ruler of the Isparta–Burdur region in 1301–1326. citeturn1search6
- GeoNames supplies the Isparta city point [30.5522222, 37.7644444]. citeturn3search5
- An independent city-coordinate reference reports the same point. citeturn3search19

Decision:

- add `1326-isparta` to the candidate registry;
- retain `controller = NOT_ASSERTED`;
- retain `geometry = NOT_ASSERTED`;
- treat the 1326 political transition as unresolved for the exact 7 April frame;
- do not turn regional historical evidence into a province boundary.

## Wave 6 — Burdur + Beyşehir controlled intake

### Burdur

The targeted Burdur pass closes the coordinate/existence side while keeping the exact 7 April 1326 controller assignment unasserted.

- TDV places Hamîdoğulları in the Isparta–Burdur–Eğridir region and identifies Feleküddin Dündar Bey as ruler of the Isparta–Burdur region from 1301 to 1326. This supports Burdur as a historically relevant regional anchor, but does not by itself define a province boundary or an exact April-7 controller snapshot. citeturn0search1turn0search10
- GeoNames reports the Burdur city point at [30.2908333, 37.7202778]; an independent city-coordinate reference reports the same point. citeturn2search1turn2search15

Registry decision:

- **ADD** `1326-burdur` as a research candidate.
- `controller = NOT_ASSERTED`.
- `geometry = NOT_ASSERTED`.
- Coordinate evidence is stored as two source-level city points; no averaging or generated point is introduced.
- Regional Hamîd evidence is not converted into a political polygon.

### Beyşehir

The Beyşehir pass is deliberately asymmetric: settlement/political-centre relevance is strong, but the exact controller on 1326-04-07 remains open.

- TDV identifies Beyşehir as the centre associated with Eşrefoğlu Süleyman Bey and describes its Eşrefoğlu development before the scenario date. citeturn1search5turn1search7
- TDV's Eşrefoğulları chronology dates Demirtaş's capture of Beyşehir and the killing of II. Süleyman Bey to **9 October 1326**. The subsequent Hamîdoğulları seizure of Beyşehir is therefore **POST_SCENARIO** and cannot be projected backward to 7 April 1326. citeturn1search0
- GeoNames gives the Beyşehir city point as approximately [31.724577, 37.677348], while Wikidata Q127389 gives approximately [31.726111, 37.676389]. citeturn0search6turn1search2

Registry decision:

- **ADD** `1326-beysehir` as a research candidate.
- `controller = NOT_ASSERTED`.
- `geometry = NOT_ASSERTED`.
- Preserve the 9 October event as POST_SCENARIO evidence only.
- Do not infer April control from the later Hamîdoğulları occupation.

### Registry hygiene correction

The Isparta record had used `SCENARIO_RELEVANT` inside `historicalEvidenceRefs.temporalClass`, although the schema reserves that field for `PRE_SCENARIO`, `SCENARIO_WINDOW`, `POST_SCENARIO`, or `UNDATED`. The record is now normalized to `PRE_SCENARIO`; its top-level `historicalApplicability` remains `SCENARIO_RELEVANT` because that field has a separate schema meaning.

## Wave 7 — Beyşehir temporal-controller refinement

The dedicated temporal pass strengthens the April-1326 interpretation without silently promoting it to canonical controller authority.

- TDV's Eşrefoğulları entry states that II. Süleyman succeeded Mehmed Bey in 1320 and that Demirtaş entered Beyşehir and killed II. Süleyman on **9 October 1326**. The same entry states that Beyşehir and the surrounding Eşrefoğlu territory were seized by Hamîdoğulları **after this event**. citeturn0search0
- TDV's Beyşehir entry identifies the city as the centre of the Eşrefoğlu polity and associates the city's name and development with the Eşrefoğlu rulers. citeturn0search3
- An academic review by Sait Kofoğlu likewise identifies II. Süleyman as successor in 1320 and places his assassination by Demirtaş in 1326. citeturn1search2

Interpretation for the 1326-04-07 scenario:

- The evidence is materially stronger than a generic historical association: a named ruler is documented from 1320 until a dated death event on 9 October 1326, with the territorial takeover described as subsequent.
- This supports **Eşrefoğlu control as the leading historical interpretation for Beyşehir on 1326-04-07**.
- Nevertheless, the registry remains `controller = NOT_ASSERTED` until the project accepts the continuity inference as an explicit controller-binding rule or obtains a source that directly binds the controller to the April scenario date.
- The 9 October event remains `POST_SCENARIO`; no later Hamîdoğulları control is projected backward.

Decision: **retain the candidate, do not promote controller authority yet**.


## Wave 8 — Lârende / Karaman temporal-controller and coordinate refinement

The targeted Lârende pass strengthens the historical existence / centre side and the independent coordinate side, but it does not close the exact 1326-04-07 controller binding.

### Historical evidence

- TDV Karamanoğulları states that Güneri Bey captured Lârende in 1286 and that Lârende and Ereğli became Karamanlı territory during his period. [TDV Karamanoğulları]
- The same source states that after Yahşi Bey, Bedreddin İbrâhim became ruler in 1318 and that, after Demirtaş left Anatolia, Lârende became the capital of the Karamanlı beylik and İbrâhim Bey built a palace there. [TDV Karamanoğulları]
- Crucially, the source then dates the Karamanlı capture of Konya, Gevele and Beyşehir to 1328–29, after Demirtaş's departure. That later expansion is not projected backward into the 7 April 1326 scenario.
- TDV Karaman identifies the modern city as the historical Lârende and describes its development under Karamanoğulları rule.

### Temporal interpretation

The evidence supports the following restrained interpretation:

- Lârende/Karaman is unquestionably a high-value Karamanlı historical anchor for the surrounding period.
- The 1318 succession of Bedreddin İbrâhim and the later statement that Lârende was the beylik capital establish a strong pre-/near-scenario institutional continuity chain.
- However, the source excerpt does not provide a clean, independently dated statement of who controlled Lârende specifically on 1326-04-07.
- Therefore the project must not convert the later 1328–29 Karamanlı territorial expansion into an April-1326 controller assignment.
- Controller remains NOT_ASSERTED until the exact-date binding rule is satisfied.

### Coordinate evidence

Two independent city-point references provide a stable research coordinate pair:

- GeoNames city record: approximately [33.215000, 37.1811111] WGS84, with Lârende listed among alternate names.
- English Wikipedia city record: approximately [33.21806, 37.18194] WGS84.

The points differ because they represent different modern city reference points. They must remain source-level evidence; no averaged coordinate is introduced.

### Decision

- ADD/retain Lârende as a research candidate.
- Historical applicability: SCENARIO_RELEVANT, with exact 7 April controller binding still open.
- Coordinate evidence: research-grade pair available.
- controller = NOT_ASSERTED.
- geometry = NOT_ASSERTED.
- No province polygon, controller extent, or boundary is inferred from the city anchor.
- 1328–29 territorial expansion remains explicitly POST_SCENARIO.

This closes a useful evidence gap for the Lârende candidate but does not justify canonical promotion.

### Sources

- TDV İslâm Ansiklopedisi — Karamanoğulları: https://islamansiklopedisi.org.tr/Karamanogullari
- TDV İslâm Ansiklopedisi — Karaman: https://islamansiklopedisi.org.tr/karaman
- GeoNames — Karaman city record.
- Wikipedia — Karaman city record.


## Wave 9 — Karasi / Balıkesir–Bergama temporal refinement

The targeted Karasi pass closes the settlement/reference-point side for Balıkesir and Bergama and sharpens the chronology, but it does not close the exact 1326-04-07 controller binding.

### Historical evidence

TDV Karesioğulları states that Kalem Bey and Karesi Bey had taken control of much of the Mysia region, including Balıkesir and Bergama, from the late 13th century. It identifies Balıkesir as the beylik centre and states that Karesi Bey died before 1328, after which Yahşi Bey succeeded him. The same entry records a 1328 agreement between Byzantine emperor III Andronikos and Demirhan Bey at Biga/Pegae and interprets the evidence as showing a later two-centre structure: Balıkesir under Demirhan and Bergama under Yahşi. [TDV Karesioğulları]

This produces an important temporal guard:

- Karesi political control of the Balıkesir–Bergama theatre clearly predates 1326.
- The specific Balıkesir/Demirhan + Bergama/Yahşi two-centre arrangement is explicitly evidenced in 1328, not directly on 7 April 1326.
- Therefore the 1328 division must not be projected backward into the scenario start.
- The research ledger should preserve both cities as separate high-value Karasi candidates while leaving exact April-1326 controller assignment open.

TDV Bergama independently identifies Bergama as a medieval strategic position and as a centre of the Karesioğulları.

### Coordinate evidence

Balıkesir:
- GeoNames city point: approximately [27.886111, 39.649167].
- German Wikipedia city point: approximately [27.884167, 39.651111].

Bergama:
- GeoNames populated-place point: approximately [27.18052, 39.12074].
- German Wikipedia city point: approximately [27.178333, 39.122778].

The points are retained as source-level city references. No averaging or site substitution is performed.

### Decision

- Balıkesir: retain/add as SCENARIO_RELEVANT, controller NOT_ASSERTED, geometry NOT_ASSERTED.
- Bergama: retain/add as SCENARIO_RELEVANT, controller NOT_ASSERTED, geometry NOT_ASSERTED.
- The 1328 two-centre evidence is retained as a post-scenario chronology guard.
- No 1328 controller split is projected backward to 7 April 1326.
- No city anchor is converted into a political polygon.

This closes the coordinate/reference-point gap for the Karasi pair while preserving the exact-date controller question as an explicit unresolved gate.

### Sources

- TDV İslâm Ansiklopedisi — Karesioğulları.
- TDV İslâm Ansiklopedisi — Karesi Bey.
- TDV İslâm Ansiklopedisi — Bergama.
- GeoNames — Balıkesir and Bergama populated-place records.
- Wikipedia — Balıkesir and Bergama city records.


## Wave 10 — Saruhan / Manisa

This wave closes the independent-coordinate gate for the existing Manisa/Saruhan research candidate while keeping the exact scenario-date controller explicitly unresolved.

### Manisa

TDV Saruhanoğulları describes the polity as a Türkmen beylik ruling from Manisa and its surrounding area from the late 13th to early 15th centuries. It states that Saruhan Bey established the polity with Manisa as its centre and that, after Manisa became the beylik's centre, Saruhan Bey expanded his regional power. citeturn0search6

TDV Saruhan Bey independently identifies Saruhan Bey as the founder of the Manisa-centred Saruhanoğulları beylik. citeturn0search10

Coordinate cross-check:

- GeoNames city point: [27.426465, 38.612018]. citeturn0search0
- Wikidata Q147089 city point: [27.426465, 38.612018]. citeturn1search0

Decision:

- register `1326-manisa` as a research-candidate anchor;
- retain `historicalApplicability = SCENARIO_RELEVANT`;
- selected coordinate is the exact point independently reported by both GeoNames and Wikidata;
- retain `controller = NOT_ASSERTED`;
- retain `geometry = NOT_ASSERTED`;
- do not infer the 7 April 1326 controller merely from pre-scenario Saruhan institutional continuity;
- do not infer political boundaries or province geometry from the anchor.

The **existence + independent-coordinate** gate is now closed for Manisa. The **exact scenario-date controller** gate remains open.



## Wave 13 — Pontus / Trabzon

The Trabzon pass closes the historical-existence and independent-coordinate gates for the Pontus capital candidate, while deliberately keeping canonical controller and geometry authority unasserted.

### Trabzon

TDV Trabzon states that after Alexios Komnenos established the new state in 1204, Trabzon became its centre, and that the Komnenian capital retained its centre status from 1204 to 1461. The same entry describes the city's Ilkhanid-vassal context and notes that Türkmen pressure around Trabzon increased from the 1320s; this is regional pressure evidence and is not treated as a controller transfer. [TDV Trabzon]

Wikidata independently identifies Trabzon/Trebizond and records the Empire of Trebizond association for the 1204–1461 period. [Wikidata Q45301]

### Temporal interpretation

- Trabzon is a high-value political-centre candidate for the 1326 theatre because the city is documented as the capital/centre of the Trebizond state throughout 1204–1461.
- The 1320s Türkmen-pressure statement is retained as a regional chronology guard only; it does not imply that Trabzon itself changed controller in 1326.
- The registry nevertheless keeps controller = NOT_ASSERTED because the current production policy does not promote controller authority from continuity inference alone.
- No later Ottoman control is projected backward into the 1326 scenario.

### Coordinate evidence

- GeoNames city point: approximately [39.726944, 41.005] WGS84.
- Wikidata Q45301 city coordinate: approximately [39.7225, 41.005] WGS84.

The selected registry coordinate is the GeoNames source-reported city point. The two source points remain separate evidence; no averaging is performed.

### Decision

- register 1326-trabzon as a research-candidate anchor;
- retain historicalApplicability = SCENARIO_RELEVANT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- treat the 1320s Türkmen-pressure evidence as regional context, not a controller transfer;
- do not derive a political polygon, frontier, or province extent from the city anchor.

This closes the existence + independent-coordinate gate for Trabzon while leaving canonical controller binding and geometry reconciliation as separate production gates.

### Sources

- TDV İslâm Ansiklopedisi — Trabzon: https://islamansiklopedisi.org.tr/trabzon
- Wikidata — Trabzon Q45301: https://www.wikidata.org/wiki/Q45301
- GeoNames — Trabzon city record: https://www.geonames.org/738648/trabzon.html


## Wave 14 — Pontus / Giresun temporal guard

The Giresun pass strengthens the Pontus coastal candidate set but deliberately preserves the exact 1326 controller question as unresolved.

### Giresun

TDV Giresun describes the city as the second important regional centre in the Trebizond Empire's geography and as a fortified western outpost against surrounding Türkmen groups. [TDV Giresun]

A separate TDV Tirebolu chronology provides the key negative temporal guard: Türkmen groups first reached Tirebolu in 1380, while Hacı Emîr Bey's son Süleyman Bey captured Giresun in 1396–97. Those events are substantially post-scenario and must not be projected backward into 7 April 1326. [TDV Tirebolu]

### Coordinate evidence

- GeoNames city point: approximately [38.387406, 40.91698] WGS84.
- Wikipedia city point: approximately [38.38944, 40.91528] WGS84.

The selected registry coordinate is the GeoNames source-reported city point. The source points remain separate; no averaging or derived site substitution is performed.

### Decision

- register 1326-giresun as a research-candidate anchor;
- retain historicalApplicability = SCENARIO_RELEVANT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- explicitly retain 1380 and 1396–97 as POST_SCENARIO temporal guards;
- do not infer a 1326 controller from the later Hacıemîroğulları conquest;
- do not derive political geometry from the city anchor.

This closes the existence + independent-coordinate gate for Giresun while preserving the exact-date controller binding as unresolved.

### Sources

- TDV İslâm Ansiklopedisi — Giresun: https://islamansiklopedisi.org.tr/giresun
- TDV İslâm Ansiklopedisi — Tirebolu: https://islamansiklopedisi.org.tr/tirebolu
- GeoNames — Giresun city record: https://www.geonames.org/746881/giresun.html
- Wikipedia — Giresun: https://en.wikipedia.org/wiki/Giresun


## Wave 15 — Menteşe / Caria closure

This wave closes the next unresolved Menteşe settlement-centre pair without collapsing historical centre chronology into a single 1326 controller claim.

### Milas

TDV Menteşeoğulları places Milas inside the Menteşe sphere and states that the beylik centre was initially Milas. TDV Menteşe likewise states that the centre was first Milas and that, after Orhan Bey's unsuccessful Rhodes campaign in 1320-1321, the capital was moved for a period from Milas to inland Muğla.

Decision:

- add `1326-milas` as a research-candidate settlement anchor;
- treat Milas as a historically important former Menteşe centre, not as an automatically current 1326 capital;
- keep `controller = NOT_ASSERTED`;
- keep `geometry = NOT_ASSERTED`;
- use only independent city-point coordinates;
- do not infer a province boundary from the former-capital status.

Coordinate evidence:

- GeoNames city point: approximately [27.783889, 37.316389].
- Wikidata Q924252 city point: approximately [27.783333, 37.316667].

The 1320-1321 capital transfer is PRE_SCENARIO evidence and therefore establishes scenario relevance, but it does not by itself establish the exact political controller or territorial boundary on 1326-04-07.

### Muğla

TDV Muğla provides the strongest temporal binding in this wave: Orhan Bey moved the Menteşe capital from Milas to Muğla after the unsuccessful Rhodes campaign of 1320-1321 for security reasons. The same source records Ibn Battûta's 1333 visit and identifies Orhan Bey's son İbrahim Bey as the administrator in Muğla. TDV Menteşe separately describes Muğla as a temporary centre before Peçin later became the beylik centre.

Decision:

- add `1326-mugla` as a research-candidate political-centre anchor;
- classify temporal applicability as SCENARIO_RELEVANT;
- keep `controller = NOT_ASSERTED`;
- keep `geometry = NOT_ASSERTED`;
- do not use the later Peçin-centre chronology to erase Muğla's earlier 1320s central role;
- do not infer a Menteşe political polygon from the city point.

Coordinate evidence:

- GeoNames city point: approximately [28.366497, 37.218066].
- German Wikipedia city point: approximately [28.364444, 37.214722].

### Peçin guard

Peçin remains deliberately **out of the machine-readable 1326 registry in this wave**. TDV describes Peçin as the later Menteşe centre and records its major rebuilding by the 1330s, but the currently attached source chain does not provide a sufficiently clean pre-1326 temporal binding for the registry's strict evidence gate. Its geographic relevance is retained in research notes only.

### Wave 15 verdict

Menteşe now has two distinct machine-readable candidates:

- `1326-milas` — former/initial Menteşe centre, scenario-relevant settlement anchor;
- `1326-mugla` — 1320s Menteşe centre, scenario-relevant political-centre anchor.

This wave does **not** promote either to canonical political geometry. The controller and boundary axes remain independently reviewable.



## Wave 16 — Southern Anatolia / Antalya–Alâiye checkpoint

The targeted southern-corridor pass closes two high-value settlement-anchor candidates for registry intake while keeping controller and geometry authority explicitly separate.

### 1326-antalya

- TDV Antalya records that Dündar Bey captured Antalya, entrusted it to his brother Yunus Bey, and that Yunus's son Mahmud Bey held Antalya. It also records Mahmud's surrender of Dündar to Demirtaş and the later chronology around Demirtaş's departure in 1327.
- TDV Hamîdoğulları independently records Mahmud Bey's possession of Antalya and Dündar Bey's death in 1326.
- Coordinate evidence: GeoNames [30.695565, 36.908118] and Wikidata Q6487 [30.666666666666668, 36.96666666666667]. The registry retains the selected source-reported GeoNames point; coordinates are not averaged.
- Decision: register `1326-antalya` as `candidate-evidence-only` with `historicalApplicability = SCENARIO_RELEVANT`.
- `controller = NOT_ASSERTED`; `geometry = NOT_ASSERTED`.
- The anchor does not imply a Hamîd polygon or an exact political frontier.

### 1326-alaiye

- TDV Alâiye Beyliği records the transfer of Alâiye to Karamanoğlu Mecdüddin Mahmud Bey in 1293 and its subsequent governance by Karaman-linked beys under Mamluk overlordship.
- TDV Alanya independently records the 1293 Karaman capture and identifies Alâiye as a Türkmen centre; later 1333 evidence names Yusuf b. Karaman as ruler. The later evidence is retained as chronology only and is not projected backward as an exact April 1326 controller assertion.
- Coordinate evidence: GeoNames [31.999817, 36.543747] and Wikidata Q207341 [31.99972222222222, 36.54388888888889]. The registry retains the selected source-reported GeoNames point; coordinates are not averaged.
- Decision: register `1326-alaiye` as `candidate-evidence-only` with `historicalApplicability = SCENARIO_RELEVANT`.
- `controller = MEDIUM` in the confidence field, but this is not a canonical controller assertion; `geometry = NOT_ASSERTED`.
- No Karamanid/Mamluk frontier polygon is inferred from the anchor.

### Wave 16 gate result

- The southern Anatolian anchor coverage is expanded without importing 1300 geometry or controller state.
- Both records satisfy the registry's independent-coordinate evidence requirement through two source types.
- Historical evidence is preserved as source-level claims with explicit temporal classes.
- Canonical promotion remains blocked pending the full theatre review, temporal/controller reconciliation, alias checks, and geometry review.


## Wave 17 — Central/Eastern Anatolia temporal-gate review

This pass was intentionally run as a **negative-gate review** to avoid repeating closed western theatres or projecting later beylik formations backward into 1326.

### Sivas / Kayseri / Eretna guard

TDV Eretnaoğulları dates the Eretna polity to **1335–1381** and describes Alâeddin Eretna's later administration of Sivas, Kayseri and other central-Anatolian cities. Therefore Eretna authority is **POST_SCENARIO** for 1326-04-07 and cannot be used to assign Sivas, Kayseri, Amasya or Tokat to Eretna in the start frame. citeturn0search0

### Tokat

TDV Tokat states that the region entered Eretna rule only after Timurtaş's 1327 departure and Ebû Saîd's 1335 death, placing Eretna control after the scenario date. The present source chain therefore does not establish a sufficiently precise 7 April 1326 controller for a production political anchor. citeturn0search4

### Amasya

TDV Amasya confirms Amasya's strategic geographic role and continuous settlement importance, but the current retrieved passage does not provide a sufficiently explicit 7 April 1326 controller binding. A 1326-built monument demonstrates activity in the city but is not, by itself, political-control evidence. Therefore Amasya remains a **research/reference candidate**, not a machine-registry promotion in this wave. citeturn1search1

### Tâceddinoğulları guard

TDV Tâceddinoğulları dates that dynasty's establishment to the second half of the fourteenth century and places its early political activity after the Ilkhanid collapse. It must not be projected backward into the April 1326 scenario. citeturn0search6

### Wave 17 decision

- **No new machine-readable anchor was promoted in this wave.**
- Sivas, Kayseri, Tokat and Amasya remain open historical-reference targets pending a source chain explicitly binding the settlement/political authority to 1326-04-07.
- Eretna and Tâceddinoğulları are recorded as explicit temporal guards, preventing accidental backward projection.
- This is a deliberate research closure, not a missing-data workaround: no coordinate-only or later-dynasty evidence is allowed to create a 1326 controller claim.


## Wave 18 — Levant / Aleppo–Tripoli closure

This wave closes two previously identified Levant-facing candidates after completing both historical and coordinate evidence gates.

### 1326-halep

- TDV Halep records that after the Mongol defeat at Aynicâlût in 1260, Aleppo was left to the Mamluks. It records a brief Mongol reoccupation in the early 14th century, followed by the continuing Mamluk period until 1516. This establishes scenario relevance without requiring a later political label to be projected backward.
- Independent coordinate evidence: GeoNames [37.161173, 36.201241] and Wikidata Q41183 [37.16, 36.2]. The registry retains the GeoNames source-reported point; no averaging is performed.
- Decision: register `1326-halep` as `candidate-evidence-only` with `historicalApplicability = SCENARIO_RELEVANT`.
- `controller = NOT_ASSERTED`; `geometry = NOT_ASSERTED`.
- The anchor establishes a historical city/reference point only; no Mamluk provincial boundary is inferred.

### 1326-trablussam

- TDV Trablusşam records Sultan Kalavun's conquest in 1289 and states that the rebuilt city became the centre of one of the six major Mamluk niyabas. It also describes the city as an important administrative and commercial centre during the Mamluk period.
- Independent coordinate evidence: GeoNames [35.84415, 34.43352] and Wikidata Q168954 [35.83444444444444, 34.43666666666667]. The registry retains the GeoNames source-reported point; no averaging is performed.
- Decision: register `1326-trablussam` as `candidate-evidence-only` with `historicalApplicability = SCENARIO_RELEVANT`.
- `controller = NOT_ASSERTED`; `geometry = NOT_ASSERTED`.
- No Mamluk niyaba boundary is derived from the anchor.

### Wave 18 gate result

- Both Levant candidates satisfy the registry's two-source coordinate requirement.
- Historical chronology is pre-scenario and does not depend on post-1326 conquest evidence.
- No later Ottoman or unrelated modern administrative boundary is imported into the 1326 authority layer.
- Canonical political geometry remains BLOCKED.


## Wave 19 — Levant core / Damascus closure

### 1326-dimask

- TDV Şam identifies Dımaşk as a principal centre of Bilâdüşşam and records Mamluk control in the relevant period, including the brief Ilkhanid occupation of 1300 and the subsequent return to Mamluk control.
- TDV also records major development under al-Nâsır Muhammad and governor Tengiz during 1312–1340, providing direct scenario-era institutional context.
- Coordinate evidence: GeoNames [36.29127502441406, 33.51019814679501] and Wikidata Q3766 [36.292, 33.513]. No averaging.
- Decision: register `1326-dimask` as `candidate-evidence-only` with `historicalApplicability = SCENARIO_RELEVANT`.
- `controller = NOT_ASSERTED`; `geometry = NOT_ASSERTED`.
- No political boundary is inferred from the city anchor.

### Wave 19 gate result

The major Levant-core candidate passes the historical and independent-coordinate gates. Canonical political geometry remains BLOCKED.


## Wave 20 — Levant coastal corridor / Beirut–Sayda–Safed closure

This wave extends the Levant candidate surface south-westward using the same strict two-axis gate: historical evidence first, independent coordinates second. No controller or geometry is promoted by anchor existence.

### 1326-beyrut

TDV Beirut records that the city remained under Crusader control until 1291, when it was conquered for Sultan al-Malik al-Ashraf Khalil. It then describes Beirut under Mamluk rule as an important city in East-West trade and records early-14th-century al-Fidâ evidence for two castles and gardens. TDV Lebanon independently describes strong Mamluk rule over the Lebanese coastal region from the 14th century.

Coordinate evidence:
- GeoNames city point: [35.50157, 33.89332].
- Wikidata Q3820 city point: [35.51305555555556, 33.88694444444444].

Decision:
- add `1326-beyrut` as SCENARIO_RELEVANT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- no Mamluk provincial boundary is inferred from the city point.

### 1326-sayda

TDV Sayda gives a direct chronology: after Acre fell in 1291, the Templar garrison abandoned Sidon's sea castle and the city came under Mamluk control in July 1291. The same source states that during the Mamluk period Sidon was subordinate to the Damascus niyaba and governed by governors appointed from Damascus. This is sufficient historical evidence for scenario relevance without projecting a later administrative boundary backward.

Coordinate evidence:
- GeoNames city point: [35.37148, 33.55751].
- Wikidata Q163490 city point: [35.37583333333333, 33.56055555555556].

Decision:
- add `1326-sayda` as SCENARIO_RELEVANT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- preserve the Damascus-niyaba relationship as historical evidence, not as a generated province boundary.

### 1326-safed

TDV Safed records Baybars's capture of the city in 1266 and explicitly states that Safed became one of the six niyaba centres of Mamluk Syria. It also describes Safed as a rich and important city in the first half of the 14th century. This gives a particularly strong pre-scenario institutional chain.

Coordinate evidence:
- GeoNames populated-place point: [35.495997, 32.964648].
- Wikidata Q188336 city point: [35.49833333333333, 32.96583333333333].

Decision:
- add `1326-safed` as SCENARIO_RELEVANT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- do not infer the historical niyaba extent from the city point.

### Wave 20 gate result

All three records satisfy the current registry's historical-evidence and independent-coordinate gates. Their points remain city reference coordinates only. No averaging, centroid generation, proximity matching, polygon generation, or controller inference is performed. Canonical promotion remains BLOCKED pending the later full-theatre reconciliation and geometry authority stages.


## Wave 21 — Levant interior / Jerusalem settlement gate

### 1326-kudus

This pass deliberately classifies Jerusalem as a **SETTLEMENT** anchor rather than a political-centre assertion. TDV records a more stable Mamluk period after the 1260 Aynicâlût victory and notes that Jerusalem's political importance had declined relative to the principal commercial routes. TDV Filistin independently places Jerusalem among the six Mamluk-administered areas attached to Damascus during the Mamluk period. citeturn0search2turn0search6

Coordinate evidence:
- GeoNames city point: [35.216331481933594, 31.76904009837115].
- Wikidata Q1218 city point: [35.23415611111111, 31.77667888888889].

Decision:
- add `1326-kudus` as SCENARIO_RELEVANT SETTLEMENT;
- retain controller = NOT_ASSERTED;
- retain geometry = NOT_ASSERTED;
- do not interpret the six-area administrative statement as a polygon or exact boundary;
- do not promote Jerusalem to a provincial-capital geometry without a separate exact-date authority pass.

### Wave 21 gate result

The historical and independent-coordinate gates are closed for Jerusalem as a settlement/reference anchor. Canonical political geometry remains BLOCKED.


## Wave 22 — Registry integrity / Tier-1 audit checkpoint

No new anchor is promoted in this wave. The purpose is to reconcile the current machine-readable registry against the T3-A/T3-B authority rules recorded in the 1326 transition inventory and the current validator contract.

### Registry audit result

Current registry size: **32 anchors**.

- anchor IDs: 32 unique / 32 records
- duplicate coordinates: none detected
- authorityStatus: all records = `candidate-evidence-only`
- geometry confidence: all records = `NOT_ASSERTED`
- anchor types: 25 `POLITICAL_CENTRE`, 7 `SETTLEMENT`
- historical applicability: 28 `SCENARIO_RELEVANT`, 3 `PRE_SCENARIO`, 1 `SCENARIO_WINDOW`
- required record fields: present for all 32 records

The root registry remains `scenarioDate = 1326-04-07`, with geometry generation, controller inference, and canonical promotion all disabled. The validator additionally requires each selected point to match a declared source coordinate and requires at least two coordinate source types.

### Authority interpretation

This audit does **not** convert the 32 points into province centres, centroids, political polygons, or controller surfaces. The transition-inventory rule remains active: historical nodes are inputs to an evidence/constraint graph, not direct province geometry.

The T3-B contract therefore remains:

`Historical evidence → Anchor Graph → constraints → candidate surface → review → canonical`

and not:

`anchor → polygon → runtime`.

### Remaining Tier-1 work

The next production-gate tasks are now reconciliation rather than indiscriminate anchor expansion:

1. alias/identity audit across historical and modern names;
2. exact-date controller binding audit, distinguishing direct evidence from continuity inference;
3. intended 1326 theatre coverage matrix;
4. confidence/precision consistency audit;
5. deterministic registry gate as the machine-readable evidence contract;
6. only after those gates, research-backed geometry reconciliation.

Canonical political geometry remains **BLOCKED**.

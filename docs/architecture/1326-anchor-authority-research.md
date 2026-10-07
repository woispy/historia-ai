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

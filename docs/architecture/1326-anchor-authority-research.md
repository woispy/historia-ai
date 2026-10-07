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

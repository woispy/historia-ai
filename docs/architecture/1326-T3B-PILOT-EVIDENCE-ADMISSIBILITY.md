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

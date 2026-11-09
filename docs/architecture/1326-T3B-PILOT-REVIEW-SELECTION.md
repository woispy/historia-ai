# Historia AI — 1326 T3-B Pilot Review Selection

## Status

**Stage:** research-backed review preparation  
**Authority:** candidate/review-only  
**Scenario:** 1326-04-07  
**Canonical promotion:** BLOCKED

This document selects a small set of T3-B review records for the next explicit historical-evidence adjudication pass.

It does **not** create review bindings, does **not** alter source geometry, and does **not** promote any candidate to canonical geography.

## Selection principle

Pilot selection is based on:

1. explicit historical evidence already present in the project;
2. relevance to the existing 1326 anchor graph;
3. usefulness for testing historical-boundary adjudication;
4. ability to distinguish political evidence from physical/edge evidence;
5. keeping the first pilot small enough for manual/research verification.

A high-priority pilot record is **not** assumed to have a correct boundary.

## Selected pilot records

| Priority | Review ID | Candidate | Why selected |
|---|---|---|---|
| P1 | `cliopatria-1326-feature-6204-760f7a0da05d42da` | Ottoman Empire | Directly connected to the current Bithynia research surface; the project already contains Bursa/Nicaea/Sangarius edge evidence and historical Ottoman anchor material. |
| P1 | `cliopatria-1326-feature-6241-eb6b78911fe2e881` | Byzantine Empire | Directly tests the opposing historical political surface around Bithynia and the Byzantine/Ottoman frontier without assuming that the source polygon is authoritative. |
| P2 | `cliopatria-1326-feature-6092-af809c314ff27761` | Beylik of Menteshe | Strong existing historical-source context for western Anatolian beylik geography; useful as a non-Bithynian comparison case. |
| P2 | `cliopatria-1326-feature-6227-d74baf119f1e7fa5` | Beylik of Karasi | Strong existing historical-source context in northwest Anatolia; useful for testing a second neighbouring beylik surface and preventing the pilot from becoming Ottoman-only. |

## Why these four

### 1. Ottoman Empire — first pilot

The project already has historical anchor material around Bursa, Nicaea and related Bithynian corridors. The TDV historical overview records Ottoman expansion through Bilecik, İnegöl, Yarhisar, Köprühisar and neighbouring settlements before Bursa's 1326 conquest. It also distinguishes later Nicaea and Nicomedia dates, which is important because the 1326 scenario must not retroactively import later Ottoman boundaries. citeturn0search2turn0search6turn0search7

Therefore the Ottoman candidate is valuable precisely because it forces the review process to answer:

- what was actually established by 1326-04-07;
- which areas are supported as controlled;
- where the exact frontier remains uncertain;
- which source geometry claims exceed the historical evidence.

### 2. Byzantine Empire — paired pilot

The Byzantine candidate should be reviewed alongside the Ottoman candidate rather than independently. TDV's Byzantine chronology records the continued Byzantine presence in the region and places the decisive Pelekanon event in 1329, with Nicaea falling in 1331 and Nicomedia in 1337. citeturn0search3turn0search6turn0search7

This makes the record especially useful for the 1326 boundary contract: later events must not be projected backwards into the scenario date.

The paired Ottoman + Byzantine review is therefore a test of **temporal boundary discipline**, not merely ownership labeling.

### 3. Menteşe — comparative western-Anatolia pilot

TDV identifies Menteşeoğulları as a late-13th-century southwestern Anatolian Türkmen polity and identifies Milas as its capital, with Peçin and Balat as important centres. citeturn0search1turn0search4

This gives the review process a non-Bithynian comparison case where historical geography, settlement hierarchy and coastal/river connectivity can be examined without depending on the Bursa/Nicaea edge evidence.

### 4. Karasi — neighbouring beylik pilot

TDV places Karesioğulları in northwestern Anatolia and describes its expansion around Balıkesir, Bergama, Erdek, Biga and Edremit; it also records Yahşi Bey's succession before 1328 and the relationship with neighbouring Saruhan and Ottoman territories. citeturn0search0

This makes Karasi useful for testing whether the review process can distinguish a plausible historical polity surface from an exact canonical province boundary.

## Deferred records

The following are deliberately **not** first-pilot targets:

- Mamluk Sultanate
- Empire of Trebizond
- Genoa
- Kastamonu
- Ilkhanate
- Golden Horde
- Saruhan
- Karaman
- Venice
- Teke
- Aydin
- Hamid
- Byzantine sub-surfaces already covered by the paired pilot
- Sinop/Isfendiyar
- Germiyan
- Armenian Kingdom of Cilicia
- Kingdom of Cyprus

They remain pending review. Deferral is not rejection.

## Important geometry rule

The four selected candidates retain their original immutable Cliopatria geometry.

The review process may conclude:

- `ACCEPT`
- `ACCEPT_WITH_UNCERTAINTY`
- `REVIEW_REQUIRED`
- `REJECT`
- `INSUFFICIENT_EVIDENCE`

It may also conclude that the historical evidence supports the entity but **does not support the candidate polygon as an exact boundary**.

In that case the correct outcome is not to repair the polygon with Voronoi, anchor expansion, jitter, or another synthetic operation.

## Next operation

For P1 Ottoman and P1 Byzantine:

1. bind each review ID only to explicit, relevant historical/edge evidence;
2. verify that each evidence item actually addresses the claimed boundary;
3. separate temporal ownership/control evidence from geometry evidence;
4. record unresolved frontier segments explicitly;
5. only then prepare reviewed geometry;
6. run topology and provenance validation;
7. keep canonical promotion blocked until the full authority gate passes.

For P2 Menteşe and P2 Karasi, the same process follows after the first pair establishes the review pattern.

**No automatic review matching is authorized by this selection document.**

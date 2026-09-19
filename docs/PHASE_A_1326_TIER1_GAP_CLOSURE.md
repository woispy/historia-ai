# Phase A — 1326 Tier-1 Gap Closure Evidence

Status: **historical existence/control evidence closed for the three reconciliation gaps at the scenario-date level; geometry authority remains BLOCKED**

Scenario date: **1326-04-07**

## Scope

This note closes only the **historical entity/evidence gap** created by the Cliopatria candidate set. It does not promote any geometry and does not alter the canonical political-geography authority.

The distinction remains:

```
historical existence/control evidence
    ≠ source geometry
    ≠ province boundary
    ≠ canonical authority
```

## Ottoman Beylik — cross-polity label

Cliopatria contains a candidate named **Ottoman Empire** with Wikidata **Q12560** and temporal interval **1326–1332**. The reconciliation tool therefore records it as `manualReview` with reason `cross-polity-label`, rather than silently converting the source label into the project's `ottoman-beylik` entity.

Independent historical evidence anchors Ottoman control at the scenario date:

- TDV *Orhan* records the surrender of Bursa in spring 1326 and gives the date as **6 April 1326**.
- The scenario date is **7 April 1326**, so this event precedes the scenario boundary by one day.
- TDV *Bursa* likewise records the city's surrender to the Ottomans on **6 April 1326**.

This supports the historical-control existence of the Ottoman polity immediately before the scenario date. It does **not** authorize treating the Cliopatria polygon as canonical Ottoman geometry.

## Eşrefoğulları — source gap

Cliopatria's 1326 candidate set contains no mechanically reconciled Eşrefoğulları record.

Independent historical evidence establishes that the polity existed at the scenario date:

- TDV *Eşrefoğulları* identifies the polity as a Turkish beylik founded around the end of the 13th century in the Beyşehir/Seydişehir region.
- It records that **II. Süleyman was killed on 9 October 1326** by Demirtaş.
- It further records that only after this event were Beyşehir, Seydişehir, Akşehir and surrounding territories seized by Hamîdoğulları and other territories divided.

Therefore, the 7 April 1326 scenario date precedes the documented termination event. The evidence closes the **historical existence/control gap**, while the Cliopatria **geometry source gap remains explicit**.

## Alâiye — source gap

Cliopatria's 1326 candidate set contains no mechanically reconciled Alâiye record.

Independent historical evidence establishes the polity's existence across the scenario date:

- TDV *Alâiye Beyliği* describes Alâiye (Alanya) as a Turkish beylik ruling the Alanya region from the **late 13th century until 1471**.
- The same source records that after **1293**, Alâiye and its surrounding area were ruled by beys affiliated with the Karamanoğulları, under Mamluk suzerainty.
- TDV *Anadolu Beylikleri* independently gives **Alâiye Beyliği (1293–1471)**.

Thus the 7 April 1326 scenario date falls inside the documented existence interval. This closes the **historical existence/control evidence gap**, but not the missing Cliopatria geometry.

## Gate interpretation

The three former reconciliation gaps now have distinct statuses:

| Tier-1 entity | Cliopatria status | Historical evidence at 1326-04-07 | Geometry status |
| --- | --- | --- | --- |
| Ottoman Beylik | Cross-polity label: `Ottoman Empire` / Q12560 | Supported | Candidate only; manual review |
| Eşrefoğulları | Source gap | Supported | Missing in Cliopatria |
| Alâiye | Source gap | Supported | Missing in Cliopatria |

No row above authorizes canonical geometry promotion.

## Promotion lock

The following remain unchanged:

- no 1300 → 1326 geometry copy/relabel;
- no synthetic Voronoi/jitter/anchor/filler authority;
- no candidate source becomes canonical solely from historical identity evidence;
- `SAFE TO DELETE = 0`;
- `MIN_AREA = 0.00005`;
- canonical political-geography authority remains unchanged.

## Next gate

The Tier-1 **identity/evidence closure** can now move forward to:

1. candidate geometry review for entities that actually have candidate geometry;
2. independent geometry acquisition for Eşrefoğulları and Alâiye;
3. cross-source temporal/entity reconciliation;
4. topology and physical-land validation;
5. only then, canonical promotion review.

Historical evidence alone must not be converted into polygon authority.

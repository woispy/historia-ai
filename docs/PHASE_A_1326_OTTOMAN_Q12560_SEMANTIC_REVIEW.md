# Phase A — 1326 Ottoman Q12560 Entity-Semantics Review

Date: 2026-09-20
Scenario: **1326-04-07**
Status: **semantic review confirms cross-polity distinction; candidate geometry remains blocked from promotion**

## Objective

Resolve whether Cliopatria's source identity `Q12560 / Ottoman Empire` can be treated as identical to Historia AI's Tier-1 entity `ottoman-beylik` for the 1326-04-07 scenario.

## Source identity finding

The retained Cliopatria candidate uses:

- Wikidata ID: `Q12560`
- source label: `Ottoman Empire`
- source temporal interval: `1326–1332`

The project entity is intentionally named **Ottoman Beylik** for the early-1326 scenario.

Wikidata Q12560 itself identifies the entity as **Ottoman Empire** and describes it as the multiethnic empire of the Ottoman dynasty, with a broad historical span beginning in the late 13th/early 14th century. The same record contains a separate relationship to the **Beylik of Osman**, demonstrating that the broad Q12560 identity and the early polity concept should not be silently collapsed into one project entity. citeturn0search0turn0search1

## Semantic decision

The source label and Wikidata identity are **not sufficient to prove an exact identity equivalence** with the project's `ottoman-beylik` entity.

Therefore the current reconciliation state remains:

`manualReviewRequired = true`

`reason = cross-polity-label`

This is a deliberate fail-closed decision, not a rejection of the candidate's historical relevance.

## Scenario-date historical context

Independent historical chronology already recorded in the Tier-1 gap-closure evidence places the Ottoman capture of Bursa on **6 April 1326**, immediately before the project's **7 April 1326** scenario date.

That chronology supports Ottoman control existing at the scenario boundary, but it does not solve the semantic problem of whether the Cliopatria `Ottoman Empire / Q12560` polygon is intended to represent:

- the early Ottoman beylik;
- a broader retrospective Ottoman state entity;
- a source-specific polity classification;
- or another temporal/entity convention.

The geometry cannot be promoted until that interpretation is explicitly recorded.

## Geometry decision

The Q12560 candidate remains:

- source geometry: **candidate**;
- geometry generation: **forbidden**;
- canonical authority: **false**;
- promotion: **blocked**.

No geometry is copied, relabelled, clipped, expanded, or repaired during this semantic review.

## Required resolution record

Before the candidate can move from `manual-review-required` to reviewed staging, record explicitly:

1. project entity identity: `ottoman-beylik`;
2. source identity: `Q12560 / Ottoman Empire`;
3. why the source temporal record is applicable to 1326-04-07;
4. whether the source's historical entity semantics are accepted for this scenario;
5. whether the candidate polygon represents effective control, nominal extent, maximum extent, or another boundary concept;
6. any source-specific uncertainty;
7. reviewer decision.

A simple name match or Wikidata ID match must not substitute for this review.

## Current gate matrix

| Gate | State |
| --- | --- |
| Historical Ottoman existence/control at scenario date | **Supported** |
| Q12560 source identity | **Confirmed: Ottoman Empire** |
| Project identity equivalence | **Not yet approved** |
| Candidate geometry | **Retained as candidate** |
| Geometry promotion | **BLOCKED** |
| Physical-land validation | **Not started for this candidate** |
| Topology validation | **Not started for this candidate** |
| Canonical MapBin | **Untouched** |

## Locks

- no automatic `Q12560 → ottoman-beylik` rename;
- no candidate geometry promotion from identity match alone;
- no synthetic geometry;
- no canonical MapBin mutation;
- `SAFE TO DELETE = 0`.

## Next executable step

The semantic gate is now explicitly documented. The next review must inspect the **candidate polygon's own geometry semantics/provenance** and determine whether the Cliopatria feature can be accepted as a scenario-date Ottoman Beylik candidate without changing its source identity.

Only after entity semantics and geometry semantics both pass can physical-land/topology validation begin.

# Phase A — 1326 Tier-1 Geometry Gap Matrix

Status: **identity/evidence closed; geometry acquisition unresolved for Eşrefoğulları and Alâiye; Ottoman candidate remains manual-review**

Scenario date: **1326-04-07**

Working branch: `codex/phase-a-1326-reviewed-staging`

## Purpose

This note consolidates the current Tier-1 geometry gate after the Alâiye acquisition pass.

It is a planning/closure matrix only. It does not generate geometry and does not alter canonical political-geography authority.

## Current state

| Entity | Historical existence/control | Candidate geometry | Geometry gate | Immediate action |
| --- | --- | --- | --- | --- |
| Ottoman Beylik | Supported immediately before scenario date | Cliopatria Q12560 candidate | Manual review | Resolve cross-polity label/entity semantics |
| Eşrefoğulları | Supported at scenario date | No retained machine-readable 1326 artifact | Source gap | Continue traceable cartographic acquisition |
| Alâiye | Supported across scenario date | No retained machine-readable 1326 artifact | Source gap | Continue traceable cartographic acquisition |

## Evidence that must remain separate

The following distinctions are mandatory:

```
temporal existence
    ≠
political control
    ≠
cartographic extent
    ≠
machine-readable geometry
    ≠
reviewed reconstruction
    ≠
canonical authority
```

Named historical centres remain control-point candidates only. A historical existence interval cannot become a polygon. Near-scenario maps cannot be relabelled as 1326-04-07.

## Eşrefoğulları

Current retained evidence provides:

- Beyşehir as a historical centre candidate;
- pre-scenario expansion constraints toward Seydişehir/Bozkır and Doğanhisar/Şarkikaraağaç;
- Bolvadin acquisition in 1320 as a dated territorial constraint;
- a strong temporal exclusion: II. Süleyman's death and subsequent territorial division occurred on/after 9 October 1326.

The Alperen 2001 map reproduction and independent map candidates remain cartographic evidence, but the original artifact has not been retained with a project-controlled SHA-256 and rights review.

**Decision:** no polygon generation yet.

## Alâiye

Current retained evidence provides:

- Alanya as a historical centre candidate;
- southern Anatolia coastal placement;
- existence/control context spanning 1326;
- 1321/1326/1329 dated monetary/political context.

The inspected SALT, Wikimedia, Phersu and later/local cartographic material does not currently provide a retained immutable 1326-04-07 machine-readable boundary.

**Decision:** no polygon generation yet.

## Ottoman Beylik

Cliopatria's Q12560 record is labelled **Ottoman Empire**, with temporal interval 1326–1332. The project's Tier-1 entity is **Ottoman Beylik**.

The existing reconciliation deliberately classifies this as:

- candidate geometry;
- `manual-review-required`;
- reason: `cross-polity-label`.

Historical chronology supports Ottoman control immediately before the scenario date through Bursa's surrender on 6 April 1326, but this does not remove the entity-semantics review.

**Decision:** review the source label/temporal semantics before geometry can enter reviewed staging.

## Gate ordering

The next work must follow this order:

1. **Complete Ottoman Q12560 semantic review** without silently renaming the source entity.
2. **Continue Eşrefoğulları acquisition** for a traceable cartographic artifact or documented reconstruction basis.
3. **Continue Alâiye acquisition** for a traceable date-appropriate boundary artifact.
4. Only after geometry exists: establish georeference/control-point proof where required.
5. Run physical-land/coastline validation.
6. Run topology validation.
7. Produce reviewed candidate geometry.
8. Perform canonical promotion review.

No step may skip directly from historical evidence to canonical geometry.

## Promotion locks

- no 1300 → 1326 relabel;
- no 1330 → 1326 relabel;
- no 1400 → 1326 relabel;
- no synthetic Voronoi/jitter/anchor/filler geometry;
- no capital-radius approximation;
- no undocumented image tracing;
- no canonical MapBin mutation;
- `SAFE TO DELETE = 0`;
- `MIN_AREA = 0.00005`.

## Exit condition

The Tier-1 geometry gate is not closed until each required entity has either:

1. a traceable, date-appropriate machine-readable boundary artifact with provenance/licensing/hash and semantic review; or
2. a formally documented reconstruction with source artifacts, georeferencing/control points, residuals, assumptions, uncertainty, physical validation, topology validation and independent review.

Current state therefore remains:

**GEOMETRY PROMOTION = BLOCKED.**

## Next executable task

Continue source acquisition for the two genuine geometry gaps while performing the Ottoman Q12560 entity-semantics review in parallel.

Canonical geometry remains untouched.

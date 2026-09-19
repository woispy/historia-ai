# Phase A — Eşrefoğulları Source Acquisition Review

Date: 2026-09-19  
Scenario: **1326-04-07**  
Status: **artifact acquisition unresolved; geometry blocked**

## Objective

Determine whether the cartographic source behind **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** can be retained as a traceable artifact suitable for documented georeference work.

## Findings

1. The 2017 Tekkanat & Yavuz paper is directly available through the Necmettin Erbakan University repository and reproduces **Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)** on PDF page 8 / printed page 211.
2. The figure explicitly distinguishes:
   - the beylik centre;
   - selected settlements;
   - an **approximate** widest territorial extent;
   - territories attached for a short period.
3. The paper identifies the underlying work as **Bilal Bülent Alperen, Beyşehir ve Tarihi, Konya, 2001**.
4. Independent bibliographic records confirm the 2001 book exists and is held by institutional libraries; the web review did not locate a clearly licensed, directly downloadable digital copy of the book or an independently retained original map artifact.
5. The 2017 paper's repository record is open to view, but the current evidence does not establish a separate unrestricted licence for extracting and transforming the embedded historical map into production geometry.

## Source qualification

The 2017 reproduction is therefore retained as:

- authorityRole = cartographic-reconstruction-candidate
- geometryUse = blocked-until-artifact-retention-and-rights-review
- georeference = not-yet-calibrated

The underlying 2001 book is a **bibliographic acquisition lead**, not an acquired binary artifact.

## What this closes

This review closes the question of whether the cited Alperen work can be identified and traced bibliographically:

- source work identified: **yes**
- reproduction identified and page-addressed: **yes**
- original book metadata independently corroborated: **yes**
- project-controlled raw artifact + SHA-256: **no**
- transformation rights established: **no**
- date-exact 1326-04-07 boundary authority: **no**

## Required next gate

Before any pixel↔geo calibration:

1. retain a stable source artifact or an explicitly reusable derivative;
2. record its exact byte-level SHA-256;
3. record rights/provenance;
4. define the image coordinate frame;
5. bind independently sourced geographic anchors to image pixels;
6. calculate affine calibration and residuals;
7. keep the result evidence-only until boundary, physical-land, and topology review.

No polygon, ring, MapBin, or canonical authority is created by this review.

## 2026-09-19 — independent availability check

A further web search found current second-hand catalogue records for the 2001 book, consistently identifying:

- title: **Beyşehir ve Tarihi**
- author: **Bilal Bülent Alperen**
- publication year: **2001**
- place: **Konya**
- length: **196 pages**

These records demonstrate that physical copies are currently catalogued, but they do not provide a reusable digital map artifact or establish permission to transform the map into project geometry. The project therefore keeps the acquisition state unchanged.

A separate academic bibliography also cites the same work as **Büyük Sistem Dershanesi Matbaası, Konya, 2001**, providing an additional bibliographic corroboration.

### Decision

The new evidence strengthens **source identity and acquisition feasibility**, but does not satisfy the artifact gate:

- physical bibliographic availability: **confirmed**
- reusable digital map artifact: **not located**
- raw source SHA-256: **not available**
- transformation rights: **not established**
- georeference calibration: **blocked**
- geometry generation: **blocked**

No attempt is made to treat a catalogue listing, bibliographic citation, or web-rendered reproduction as the map bytes required for calibration.


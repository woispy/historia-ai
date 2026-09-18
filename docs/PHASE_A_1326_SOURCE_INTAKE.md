# Phase A — 1326 Source Intake Contract

Status: **intake contract established; acquisition and promotion remain blocked**  
Date: **2026-09-18**  
Canonical branch: `integration/phase-a-h-production`

## Purpose

The production blocker is now narrowed from "find 1326 data" to a reproducible **source-intake gate**.

The repository already records candidate evidence in `data/gis/1326/`. This document defines what must happen before any candidate source can become reviewed geometry or canonical political authority.

## Intake stages

```text
external source
    ↓
pinned snapshot / release identity
    ↓
raw source retained outside canonical runtime
    ↓
source manifest + hash + license/provenance record
    ↓
temporal filter: 1326-04-07
    ↓
entity reconciliation
    ↓
candidate geometry review
    ↓
topology / physical validation
    ↓
canonical promotion
```

A source being downloadable or historically relevant does **not** make it canonical.

## First intake targets

The current acquisition manifest identifies five sources:

1. **Cliopatria v0.2.0** — global political-entity candidate evidence.
2. **Medieval Europe Digital Atlas** — late-medieval European ecclesiastical boundary context only.
3. **OpenHistoricalMap** — historical feature/boundary evidence with feature-level licensing checks.
4. **World Historical Gazetteer** — historical-place identity and reconciliation evidence.
5. **Tabula Imperii Byzantini** — Byzantine historical-geography reference evidence.

The manifest remains the source of truth for their intended roles and restrictions.

## Snapshot rule

For every acquired dataset, record:

- provider and dataset identity;
- release/version or immutable snapshot identifier;
- source URL;
- acquisition timestamp or snapshot date;
- license classification and any feature-level exceptions;
- raw-file SHA-256;
- archive/file name and format;
- temporal extraction parameters;
- importer version/commit;
- resulting record count;
- validation result.

Until these fields exist, the source remains **acquisition-required** and cannot enter the canonical promotion path.

## Acquisition decision

The first acquisition target is **Cliopatria v0.2.0** because it is a versioned, downloadable GeoJSON source with explicit temporal intervals and Wikidata/Seshat identifiers. Its role remains candidate political evidence; it cannot directly become canonical province geometry.

The second operational source is **OpenHistoricalMap**, but the repository should acquire a reproducible bulk snapshot rather than rely on an interactive area export. The current service documentation points to Planet OHM and Overpass for bulk acquisition.

**WHG is reconciliation-only for the current phase.** Its API documentation requires tokens for most endpoints, so no authenticated WHG acquisition is claimed until credentials and an actual pinned response/export are available.

## External verification notes

Current external documentation confirms that Cliopatria publishes a versioned GeoJSON dataset with temporal `FromYear/ToYear` records and explicitly warns that its maps represent one historical interpretation with border and territorial uncertainty. It is therefore candidate evidence, not automatic province authority.

OpenHistoricalMap exposes historical data exports and states that data is generally CC0, while directing users to preserve exceptions and use bulk sources for large exports.

WHG provides machine-readable historical-place records and reconciliation services, but current API documentation states that most API endpoints require tokens. An authenticated acquisition must not be represented as completed without an actual pinned response/export and its provenance record.

These observations validate the intake design; they do **not** constitute an acquisition of source data into this repository.

## Promotion locks

The following remain locked:

- no 1300 → 1326 geometry copy or relabel;
- no synthetic Voronoi/jitter/anchor/filler authority;
- no evidence-only source promoted directly to canonical;
- no runtime generated with `authorityStatus: canonical` until the full review chain passes;
- `SAFE TO DELETE = 0`;
- `MIN_AREA = 0.00005`.

## Verification command

The repository now has a structural intake check:

```powershell
npm run validate:1326-source-intake
```

This verifies the manifest/registry/evidence contracts. It intentionally does **not** claim that external data has been acquired.

## Exit condition

Source intake is complete only when each production-relevant source has a pinned snapshot identity, raw hash, license/provenance record, reproducible extraction parameters, and a retained artifact that can be independently revalidated.

After that, the next stage is temporal/entity reconciliation — not automatic geometry promotion.

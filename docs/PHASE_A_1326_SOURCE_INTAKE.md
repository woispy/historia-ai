# Phase A — 1326 Source Intake Contract

Status: **byte acquisition, temporal extraction and mechanical entity reconciliation gates evidenced for Cliopatria; 5/8 Tier-1 entities have candidate matches, 3 remain explicit source gaps; promotion remains BLOCKED**  
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

The first acquisition target is **Cliopatria v0.2.0** because it is a versioned, downloadable GeoJSON source with explicit temporal intervals and Wikidata/Seshat identifiers. Its role remains candidate political evidence; it cannot directly become canonical province geometry. The repository command `npm run acquire:1326-cliopatria` explicitly performs the byte acquisition path; `npm run verify:1326-cliopatria` verifies the retained artifact hash. Neither command promotes geometry.

The acquisition workflow also performs deterministic archive extraction and selects the first valid GeoJSON FeatureCollection rather than assuming an archive filename.

The second operational source is **OpenHistoricalMap**, but the repository should acquire a reproducible bulk snapshot rather than rely on an interactive area export. The current service documentation points to Planet OHM and Overpass for bulk acquisition.

**WHG is reconciliation-only for the current phase.** Its API documentation requires tokens for most endpoints, so no authenticated WHG acquisition is claimed until credentials and an actual pinned response/export are available.

## External verification notes

Current external documentation confirms that Cliopatria publishes a versioned GeoJSON dataset with temporal `FromYear/ToYear` records and explicitly warns that its maps represent one historical interpretation with border and territorial uncertainty. It is therefore candidate evidence, not automatic province authority.

OpenHistoricalMap exposes historical data exports and states that data is generally CC0, while directing users to preserve exceptions and use bulk sources for large exports.

WHG provides machine-readable historical-place records and reconciliation services, but current API documentation states that most API endpoints require tokens. An authenticated acquisition must not be represented as completed without an actual pinned response/export and its provenance record.

These observations validate the intake design; they do **not** constitute an acquisition of source data into this repository.

## First source identity pin

The first acquisition target, **Cliopatria v0.2.0**, now has a pinned immutable source reference in:

`data/gis/1326/source-snapshots/cliopatria-v0.2.0.json`

The public v0.2.0 release resolves to commit **ad28a69**. The exact repository blob for `cliopatria.geojson.zip` is also addressable as Git blob **`cefab0f4b622e2e7fb3daf68d4f461f83991204c`**. This is a Git object identity, **not** a raw SHA-256 checksum. The source repository identifies the payload as `cliopatria.geojson.zip`, and its v0.2.0 license file declares **CC BY 4.0**. This establishes source identity and licensing metadata, but it does **not** establish byte acquisition: the raw SHA-256, acquisition timestamp, retained artifact, and record count remain intentionally unset until the actual archive bytes are acquired and hashed.

The source documentation describes Cliopatria as a historical political-entity dataset with EPSG:4326 geometry and inclusive `FromYear/ToYear` intervals. For Historia AI, the extraction rule remains `FromYear <= 1326 <= ToYear`; the resulting records remain candidate evidence and require entity reconciliation and review before any geometry promotion.

## Verified Cliopatria acquisition evidence

The acquisition-only forensic workflow completed successfully on **2026-09-18** (workflow run **35374512708**, head **b97653c23688998ce44f5179f20a362cec306ec6**).

Verified retained source bytes:

- source: `cliopatria-v0.2.0`
- immutable source commit: `ad28a69`
- source Git blob: `cefab0f4b622e2e7fb3daf68d4f461f83991204c` (Git object identity, not raw SHA-256)
- raw SHA-256: `d01ae3a20d358cc5d54f69d9d725d390767d9c8759ac89ad6f90c58d106f3370`
- byte length: `44231317`
- ZIP signature validation: PASS
- independent retained-byte verification: PASS
- acquisition timestamp: `2026-09-18T17:28:53.478Z`
- retained outside canonical runtime as GitHub Actions artifact **10559198772**
- artifact ZIP digest: `sha256:fc93ba2c4481344269ab3d731fd4899f8425eb8cc395aadf4da96e1625c88c11`

This closes the **byte-acquisition gate only**. Temporal extraction, entity reconciliation, candidate geometry review, topology/physical validation and canonical promotion remain blocked until their respective gates pass.

## Verified 1326 temporal extraction evidence

The same forensic acquisition workflow was extended to perform the first deterministic temporal extraction without promoting any geometry. Successful workflow run **35381065057** executed from PR #108's merge ref and completed all extraction steps.

The archive was unpacked and the selected input was validated as a GeoJSON **FeatureCollection** before invoking the repository extractor. The selected file was:

`cliopatria_polities_only.geojson`

Extractor result:

- scenario date: **1326-04-07**
- input features: **13,765**
- temporal candidates: **150**
- excluded outside temporal range: **13,608**
- excluded non-polity: **7**
- missing geometry: **0**
- output: `data/build/gis/1326/cliopatria-1326-candidates.json`
- authority status: **candidate-evidence-only**
- retained source ZIP SHA-256: `d01ae3a20d358cc5d54f69d9d725d390767d9c8759ac89ad6f90c58d106f3370`
- retained source ZIP byte length: `44,231,317`

This closes the **Cliopatria temporal extraction gate**. It does not close entity identity, political-control, geometry-authority, topology, physical validation, or canonical promotion.

The workflow artifact for this extraction is **10562680169** with uploaded-artifact ZIP digest `sha256:727b3c7bf53b53f411439aaf5565c800519dddf49f4c6c42f79e0296f8b322c0`. The raw source ZIP remains outside canonical runtime.

## Verified 1326 entity reconciliation evidence

The fail-closed reconciliation stage was re-executed after temporal extraction in successful workflow run **35383554275** (head **3b7abc8593d6b623e3d68b303dabec372622e15b**).

The stage consumes the extracted candidate report plus the canonical 1326 evidence matrix and evaluates only the eight established Tier-1 entities. Result:

- required Tier-1 entities: **8**
- entities with at least one name/alias candidate: **5**
- unmatched: **3**
- ambiguous: **0**
- automatic promotion: **false**
- overall promotion state: **BLOCKED**

The three unmatched entities are not treated as absent from history; they are explicit **reconciliation gaps in this source's 1326 candidate set under the current name/alias matching policy**. The five matched entities are only candidate identity matches and are not geometry authority. The current matched set is Byzantine Empire, Ilkhanate, Karesi, Saruhan and Aydın. Ottoman Beylik, Eşrefoğulları and Alâiye remain unmatched in this source.

The successful workflow retained the combined acquisition/intake evidence as artifact **10562704435** (uploaded-artifact ZIP digest `sha256:6746314cb22629b8ad755f7de19ba9c3ca1950b1807a0f3c819fc3a7dc8157fe`). The reconciliation report records schemaVersion **2**, with alias matches for `beylik of karasi`, `beylik of saruhan` and `beylik of aydin`.

This establishes that the source can now be mechanically evaluated against the Tier-1 matrix, while the unresolved three-entity gap remains the active forensic work item.

## Entity reconciliation gate

A dedicated fail-closed reconciliation stage exists at:

`tools/historical-gis/cli/reconcile-1326-cliopatria-entities.js`

It consumes only the extracted 1326 candidate report and the canonical 1326 evidence matrix. The current gate covers the eight Tier-1 entities already established by the matrix: Ottoman Beylik, Byzantine Empire, Eşrefoğulları, Ilkhanate, Karesi, Saruhan, Aydın and Alâiye.

Name/alias matches are recorded as **candidate matches only**. An exact name, Wikidata/Seshat identifier, or alias match cannot promote geometry. Multiple matches become `manual-review-required`; unmatched entities remain explicit gaps. Geometry authority is never derived from a name match alone.

This keeps the required distinction intact:

```text
temporal match
    ≠ entity identity
    ≠ political control
    ≠ province geometry
    ≠ canonical authority
```

The next executable gate is therefore **evidence-backed closure of the three remaining Tier-1 reconciliation gaps** (Ottoman Beylik, Eşrefoğulları, Alâiye), using source identifiers and/or additional historical sources plus the evidence matrix, without relaxing the promotion locks.

## Reproducible Cliopatria byte-acquisition path

A dedicated local acquisition helper exists at:

`tools/historical-gis/cli/acquire-1326-cliopatria.js`

The intended operator sequence is:

```powershell
npm run acquire:1326-cliopatria
npm run verify:1326-cliopatria
```

The helper downloads the pinned v0.2.0 payload, requires a ZIP signature, retains the exact bytes outside the canonical runtime, records acquisition time, byte length and raw SHA-256, and provides an independent re-hash verification path. It does not perform temporal extraction or canonical promotion.

This command is intentionally a local acquisition operation. The repository tooling in this environment cannot materialize the binary GitHub blob because binary repository content is not returned as UTF-8; therefore no raw SHA-256 is claimed until the command is actually executed against the external source and the resulting bytes are retained. The successful GitHub Actions run now provides that independent execution evidence.

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

For Cliopatria, byte acquisition, temporal extraction and mechanical reconciliation are now evidenced. The next stage is **closing the three remaining Tier-1 reconciliation gaps with stronger source identifiers/additional historical evidence**, followed by candidate geometry review and topology/physical validation — not automatic geometry promotion.

# Historia AI — 1326 Candidate Surface Screening

## Status

**Evidence-layer tooling only.** This work branch is not a production promotion.

The screening stage narrows source candidates around an explicitly supplied 1326 anchor set. It does not create, clip, reshape, or promote political geometry.

## Position in the migration chain

```
source acquisition
  -> temporal extraction
  -> entity reconciliation
  -> candidate surface screening
  -> geometry reconciliation
  -> topology validation
  -> review / provenance / confidence
  -> canonical political geography
```

The tool is intentionally placed before geometry reconciliation.

## Input

- Cliopatria candidate output from `extract-1326-cliopatria-candidates.js`.
- A separate anchor document with `scenarioDate = 1326-04-07` and WGS84 `[longitude, latitude]` coordinates.

The tool does not derive anchors from the legacy 1300 political builder.

## Screening rule

For each candidate geometry:

1. calculate its finite WGS84 bounding box;
2. create an influence rectangle around each supplied anchor;
3. retain candidates whose bounding box intersects an influence rectangle;
4. record matching anchor IDs and conservative bbox distance;
5. preserve the source candidate geometry unchanged.

The default influence radius is 120 km and is configurable.

This is deliberately a conservative screening operation. False positives are acceptable at this stage; silently dropping evidence is not.

## Explicit non-authority rules

The tool must never:

- construct Voronoi cells;
- synthesize missing borders;
- infer ownership from proximity;
- clip a candidate polygon to an anchor;
- alter physical geography;
- write a 1326 production runtime;
- publish MapBin;
- mark evidence as reviewed or canonical.

Every screened result is marked:

```text
screeningOnly = true
promotion = BLOCKED
```

## Why this step exists

Cliopatria provides political-entity evidence, but its temporal match does not establish an exact 1326 political province boundary. The screening layer therefore answers only the spatial-relevance question before historical geometry review.

The intended authority chain remains:

```
Evidence -> Candidate -> Reviewed -> Canonical
```

## Verification

The branch contains a deterministic fixture and:

```text
npm run test:1326-candidate-surface-screening
```

The test checks that nearby evidence is retained, distant evidence is rejected, the source identity/date are preserved, and promotion remains blocked.

## Integrated candidate pipeline

Once a verified Cliopatria GeoJSON artifact exists locally, the extraction, entity reconciliation, and screening stages can be run as one deterministic chain:

```text
npm run run:1326-cliopatria-candidate-pipeline -- --input <1326-cliopatria.geojson> --anchors <1326-anchor-registry.json>
```

The orchestrator writes three evidence-layer reports under `data/build/gis/1326/`:

1. `cliopatria-1326-candidates.json` — temporal candidate extraction with source SHA-256;
2. `cliopatria-entity-reconciliation.json` — entity matching against the 1326 evidence matrix;
3. `cliopatria-candidate-surface-screening.json` — spatial relevance screening against an explicitly supplied 1326 anchor registry.

The anchor registry is an explicit input. It is **not** generated from the 1300 political builder, and the pipeline refuses to promote any result to reviewed or canonical geometry.

This branch does not claim that the raw Cliopatria artifact has been acquired. Acquisition remains a separate provenance gate; `acquire:1326-cliopatria` must produce and verify the retained artifact before its contents are treated as an acquired source snapshot.

## Acquisition gate

The Cliopatria acquisition contract is independently guarded by:

    npm run test:1326-cliopatria-acquisition-contract

This contract verifies that the downloader and `data/gis/1326/acquisition-manifest.json` agree on the pinned v0.2.0 source URL, source ID, immutable Git blob reference, and blocked promotion state. It accepts both the pre-acquisition and post-acquisition manifest states without treating either state as canonical geometry authority.

On successful `--download`, the acquisition script now records the retained ZIP SHA-256, byte length, acquisition timestamp, and repository-relative artifact path back into the tracked acquisition manifest. `--verify` then cross-checks the retained ZIP against both the acquisition record and the tracked manifest before reporting PASS.

The actual acquisition sequence remains:

    npm run acquire:1326-cliopatria
            ↓
    retained ZIP + acquisition record
            ↓
    npm run verify:1326-cliopatria
            ↓
    extract → reconcile → screen

Until the retained artifact has a recorded SHA-256 and passes verification, no candidate count from an external acquisition is treated as repository evidence. Successful acquisition changes only source provenance state (`acquired`); it does not change `authorityStatus`, and candidate geometry remains blocked from promotion.


## T3-B Geometry Reconciliation Contract

The next stage is now defined as a **review-queue preparation step**, not an automatic polygon generator.

Command:

    npm run prepare:1326-geometry-reconciliation -- --screening <screening-report> --reconciliation <entity-reconciliation-report>

Output:

    data/build/gis/1326/cliopatria-geometry-reconciliation.json

The stage performs only evidence packaging:

1. consumes the already-screened candidate surface;
2. links source features to any entity-reconciliation matches;
3. records temporal applicability and spatial anchor evidence;
4. preserves the exact source geometry inside the evidence packet without mutation;
5. records a SHA-256 identity for the source candidate packet;
6. creates a pending review record with explicit historical/physical/topological/provenance gates.

The contract deliberately forbids:

- modifying source candidate geometry;
- constructing a new polygon;
- clipping a candidate to an anchor;
- inferring a boundary from proximity;
- treating controller evidence as geometry authority;
- synthetic/Voronoi/fallback geometry;
- reviewed or canonical promotion.

Each review item therefore has:

    sourceGeometry.immutable = true
    sourceGeometry.mutationPolicy = immutable-source-evidence
    reviewedGeometry = null
    reviewStatus = pending
    promotion = BLOCKED

The queue has a dedicated integrity validator:

    npm run validate:1326-geometry-reconciliation -- --input <geometry-reconciliation-queue>

It verifies the scenario/source identity, blocked promotion policy, immutable source geometry, geometry SHA-256, pending review state, and null reviewed geometry.

The contract test is:

    npm run test:1326-geometry-reconciliation

This creates the missing bridge between **T3-B candidate surface screening** and the future human/research-backed **geometry reconciliation** stage without prematurely opening canonical geometry authority.


## T3-B Geometry Review Ledger

The review queue is now convertible into a dedicated research ledger:

    npm run prepare:1326-geometry-review-ledger -- --input <geometry-reconciliation-queue>

The ledger separates four confidence axes:

    existence / controller / boundary / geometry

It also records temporal applicability, boundary evidence, physical constraints, topology state, source provenance, and an explicit review decision. Initial records are always `pending`; boundary evidence starts `uncertain`; topology starts `not-run`; reviewed geometry remains `null`; and promotion remains `BLOCKED`.

This ledger is a **review evidence contract**, not a geometry generator. A controller match or source polygon cannot populate canonical geometry by itself. The existing 1326 registry requirement remains unchanged: temporal, entity, geometry, topology, provenance, confidence, and historical review gates must all pass before canonical promotion.


### Edge-level evidence contract

The ledger is now edge-aware. A review record may contain multiple independent edge assessments, each with:

- `edgeId`
- `edgeType`
- `status`
- `confidence`
- `evidenceRefs`
- optional review notes

Supported edge types follow the 1326 transition inventory: `POLITICAL_ADJACENCY`, `FRONTIER`, `REGIONAL_PROXIMITY`, `ROAD_CORRIDOR`, `RIVER_CORRIDOR`, `MOUNTAIN_BARRIER`, `LAKE_BARRIER`, `COASTAL_ACCESS`, `STRATEGIC_PASS`, and `STRATEGIC_CROSSING`. `UNKNOWN` is retained for unresolved relationships.

Confidence is deliberately split into `existence`, `controller`, `frontier`, `exactBoundary`, and `geometry`. No aggregate score is generated and no edge assessment grants canonical authority. An unresolved or buffered frontier can therefore remain explicitly uncertain instead of being forced into a sharp political boundary.


### Pilot edge evidence registry — Bithynia core

The first pilot edge registry is stored separately from the review ledger at `data/gis/1326/pilot-edge-evidence/bithynia-core-01.json`. It records evidence relationships only; it does not generate geometry or infer controller ownership.

The pilot deliberately distinguishes Bursa–Nicaea frontier evidence from regional proximity, Nicaea–Sangarius river/corridor evidence, the Lefke route corridor, and the Nicomedia–Nicaea network relationship. Where the source describes a relationship as physical accessibility, the registry does not promote it to political control. Where exact boundary evidence is weak, the edge remains uncertain rather than being converted into a hard boundary.

### Edge evidence-reference bridge

The pilot edge registry is intentionally kept separate from the Geometry Review Ledger. A controlled bridge is now available through:

    npm run bridge:1326-edge-evidence -- --ledger <review-ledger> --evidence <pilot-edge-evidence> --bindings <explicit-bindings>

The bridge requires an explicit reviewId -> edgeEvidenceIds[] binding. It never matches records by proximity, entity name, coordinates, or controller. This is important because the pilot registry contains relationship evidence while the review ledger contains candidate-specific review records; silently joining the two would turn an evidence relationship into an implicit historical inference.

The bridge performs a reference-copy only:

- copies the selected edge ID, type, status, confidence, evidence references, and notes;
- preserves the review record's existing decision and reviewedGeometry;
- rejects unknown review IDs or unknown evidence edge IDs;
- rejects duplicate edge IDs within a review record;
- keeps geometryGeneration = false;
- keeps controllerInference = false;
- keeps canonicalPromotion = false;
- keeps ledger authorityStatus = review-ledger-only;
- keeps promotion = BLOCKED.

The binding contract is stored at:

    data/gis/1326/edge-evidence-bridge.schema.json

No real Bithynia review binding is asserted yet because the currently verified repository state does not contain an acquired Cliopatria candidate set with stable candidate-specific review IDs. The pilot evidence registry therefore remains a standalone evidence reference until a real review queue supplies those IDs.

A deterministic contract test covers the bridge:

    npm run test:1326-edge-evidence-bridge

The test binds three pilot edges to a synthetic review record, validates the resulting ledger, and verifies that no reviewed geometry or promotion state changes.

### Schema integrity correction

The Geometry Review Ledger implementation and validator use schemaVersion = 2. The JSON Schema contract had a stale top-level schemaVersion constant of 1 while the document root declared schemaVersion = 2. That contradiction is now corrected so the schema contract matches the generator and validator.

### Candidate-bound review identity

The geometry reconciliation queue now derives each review ID from the immutable candidate packet:

    cliopatria-1326-feature-<sourceFeatureIndex>-<candidatePacketSha256[0:16]>

This prevents a review record from silently referring to a different candidate after source content changes. The queue also records the derivation contract explicitly. The queue validator recomputes the expected review ID from the stored candidate packet SHA-256 and rejects mismatches.

This is an identity/provenance guard only. It does not establish historical ownership, political boundaries, or geometry authority.


### Explicit Edge Evidence Binding Pipeline

The bridge now has a separate preparation/validation contract:

`prepare:1326-edge-evidence-bindings` accepts an explicit `reviewId → edgeEvidenceIds[]` mapping. It does not discover relationships, match candidates automatically, infer controller, generate geometry, or promote anything.

The binding validator requires candidate-bound review IDs in the form:

    cliopatria-1326-feature-<sourceFeatureIndex>-<candidatePacketSha256[0:16]>

This keeps edge evidence attachment referentially tied to the immutable candidate packet identity.

The resulting artifact remains `authorityStatus: bridge-reference-only` and `promotion: BLOCKED`. A real Bithynia binding file must not be fabricated until the actual acquired Cliopatria candidate queue contains the corresponding review IDs.


### Acquisition-state gate correction

The 1326 acquisition manifest validator now accepts both lifecycle states: `reference-pinned-not-acquired` and verified `acquired`. Once a raw snapshot is acquired, the validator requires the retained raw SHA-256, artifact path, and acquisition timestamp. It does not promote the source beyond the evidence layer.

This keeps the intake validator usable before and after the first real source download instead of making successful acquisition itself look like a contract failure.


### Verified archive → extraction input gate

The Cliopatria acquisition chain now has an explicit extraction-input artifact between the retained ZIP and temporal candidate extraction.

`prepare:1326-cliopatria-extraction-input`:
- verifies the retained archive SHA-256 and byte length against the acquisition record;
- requires the pinned immutable source reference;
- inspects the archive and requires exactly one `.geojson` member;
- extracts that member;
- parses it as a GeoJSON FeatureCollection;
- records the extracted member SHA-256;
- remains promotion-blocked.

Candidate extraction can consume this record with `--extraction-input`. The extractor re-hashes the extracted GeoJSON before processing, so a changed extraction file cannot silently enter the candidate pipeline.

This gate binds:

    immutable source snapshot → archive bytes → selected archive member → extracted GeoJSON → candidate report

without treating acquisition or extraction as historical geometry authority.


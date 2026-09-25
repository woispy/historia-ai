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
5. records both the complete candidate-packet SHA-256 and the per-candidate record SHA-256;
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

The geometry reconciliation queue now derives each review ID from the immutable per-candidate record:

    cliopatria-1326-feature-<sourceFeatureIndex>-<candidateRecordSha256[0:16]>

This prevents a review record from silently referring to a different candidate after source content changes. The queue also records the derivation contract explicitly. The queue validator binds the review item to the top-level candidate-packet SHA-256 and derives the review ID from the per-candidate record SHA-256. Reconciliation preparation independently checks that its candidateRecordSha256 matches the screened candidate before the review queue is created.

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


### End-to-end candidate provenance lineage

The extracted GeoJSON SHA-256 is now propagated through every T3-B evidence stage:

    extraction input
      → candidate report
      → entity reconciliation
      → candidate surface screening
      → geometry reconciliation queue

Each stage validates the expected source identity and the shared extracted GeoJSON SHA-256. The candidate pipeline also rejects reconciliation/screening reports whose source hash differs from the candidate report.

The geometry review queue retains this source-level hash alongside its candidate-packet SHA-256. Therefore the provenance chain distinguishes:

- source/extracted dataset identity;
- candidate packet identity;
- source geometry identity;
- candidate-bound review identity.

None of these hashes confer historical authority or permit automatic canonical promotion.


### Independent candidate packet validation

The temporal extraction output now carries `candidatePacketSha256`, computed from the deterministic serialized `candidates[]` packet.

A separate `validate:1326-cliopatria-candidates` gate checks:
- source identity and immutable source reference;
- verified extracted GeoJSON SHA-256 presence;
- the locked `FromYear <= 1326 <= ToYear` rule;
- POLITY-only candidate classification;
- Polygon/MultiPolygon geometry presence;
- pending reconciliation and candidate-evidence-only authority state;
- candidate count consistency;
- candidate packet SHA-256 integrity.

The integrated candidate pipeline executes this validator before entity reconciliation.

The packet hash is then propagated into reconciliation, screening, and geometry review preparation. Cross-stage packet-hash mismatches are fatal. This makes the candidate packet itself an immutable provenance boundary rather than relying only on the underlying source hash.


### Candidate exclusion accounting gate

Candidate extraction is now required to account for every input feature exactly once:

`inputFeatures = candidates + outsideTemporalRange + nonPolity + missingGeometry`

The independent validator also rejects duplicate `sourceFeatureIndex` values and duplicate non-null `sourceFeatureId` values. This prevents silent feature loss and identity collapse between temporal extraction and downstream review.

This remains an evidence-layer integrity gate only; it does not make source geometry authoritative and does not permit canonical promotion.


### Provenance naming boundary

Two hash levels are now explicitly distinguished:

- `candidatePacketSha256`: SHA-256 of the complete ordered `candidates[]` packet emitted by temporal extraction.
- `candidateRecordSha256`: SHA-256 of one screened candidate record used to derive its candidate-bound review ID.

The legacy `sourceEvidence.candidatePacketSha256` field is retained for compatibility and is required to equal `candidateRecordSha256` inside each review item. This prevents the top-level packet hash from being confused with the per-review candidate identity hash.

The screening layer also preserves the complete source geometry without mutation. Geometry SHA and candidate-record SHA remain separate integrity values.


### Screening → review geometry integrity

Screening now records `sourceGeometrySha256` for each preserved candidate geometry. Geometry reconciliation carries this value into `sourceGeometry.screeningSourceGeometrySha256` and validates it against the recomputed review-queue geometry SHA.

This closes the runtime lineage:

`source geometry → screening geometry hash → review geometry hash`

A mismatch is fatal. The hash is an integrity/provenance mechanism only; it does not make candidate geometry authoritative or permit canonical promotion.


### T3-B end-to-end provenance lineage gate

A dedicated lineage validator now checks the complete evidence chain without promoting geometry:

`candidate packet → screening → entity reconciliation → geometry review queue`

The gate independently recomputes the candidate packet SHA, requires extracted GeoJSON SHA continuity, binds screening and review records by `sourceFeatureIndex/sourceFeatureId`, verifies source geometry identity continuity, and verifies the candidate-record-derived review ID. Packet drift, geometry drift, or reconciliation identity drift is fatal.

The validator is evidence-integrity only. `promotion` remains `BLOCKED`, and no geometry generation, controller inference, or canonical promotion is performed.

### Bithynia Pilot 01 binding readiness

The Bithynia pilot edge-evidence set remains research/evidence-only. A guarded binding-input placeholder is now tracked at `data/gis/1326/pilot-edge-evidence/bithynia-core-01.review-bindings.json`.

It intentionally contains zero `reviewBindings`. No production review ID is fabricated. Real bindings may be added only after the verified 1326 candidate acquisition, screening, reconciliation, and geometry review queue produce candidate-bound review IDs.

The pilot evidence therefore remains usable as a research constraint set without creating false provenance or silently attaching evidence to an unverified candidate.

### T3-B Pilot Readiness Gate

The pilot now has a single fail-closed readiness validator: `validate-1326-t3b-pilot-readiness.js`.

It verifies the complete evidence lineage from candidate packet → screening → reconciliation → review → review ledger → explicit edge bindings, while preserving the separation between `candidatePacketSha256` (complete packet identity) and `candidateRecordSha256` (individual review identity).

Readiness does not mean canonical promotion. With the current guarded Bithynia pilot binding placeholder, the expected state is `WAITING_FOR_EXPLICIT_REVIEW_BINDINGS` and `promotion: BLOCKED`. Real bindings remain deferred until real 1326 acquisition and candidate-bound review IDs exist.

The gate rejects fake review IDs, packet provenance drift, non-pending review records, broken candidate/review identity, and policy drift that would permit automatic matching, geometry generation, controller inference, or canonical promotion.

### Cliopatria acquisition preflight and verification

Before byte acquisition, `validate-1326-cliopatria-acquisition-ready.js` verifies the pinned v0.2.0 release URL, immutable commit `ad28a69`, exact source blob SHA, source tag, scenario date, and legal acquisition-state transitions.

After acquisition, `acquire-1326-cliopatria.js --verify` now cross-checks the retained artifact SHA/length plus the immutable commit, source blob SHA, source tag, retained artifact path, and pinned source URL recorded in the acquisition manifest.

This keeps the acquisition chain fail-closed before extraction. Acquisition remains evidence-only and promotion-blocked; extraction is still a separate gate.

### Extraction → candidate runtime integrity gate

The extraction-to-candidate boundary now has a dedicated runtime contract. Candidate extraction with `--extraction-input` re-hashes the retained extracted GeoJSON before reading candidate features, and fails closed if the recorded extracted-member SHA or the retained bytes differ.

The candidate validator additionally requires `source.extractedGeojsonSha256 === source.inputSha256`, preventing provenance fields from silently diverging inside the candidate packet.

The runtime contract covers:
- baseline extraction success,
- extraction-record hash tampering,
- retained GeoJSON byte/content tampering.

No candidate packet is considered valid unless the extracted bytes and recorded provenance agree.

### Candidate → reconciliation integrity gate

Entity reconciliation now carries a per-candidate `candidateRecordSha256` derived from the exact candidate object. The independent reconciliation validator checks packet hash continuity, extracted GeoJSON/input SHA continuity, source feature identity, temporal identity, geometry-authority state, candidate-record hash, entity result counts, and the permanent no-auto-promotion policy.

The end-to-end T3-B lineage gate also recomputes the candidate record hash from the original candidate packet and requires the reconciliation result to carry the same hash. This prevents a reconciliation layer from silently substituting or mutating a candidate while retaining the original packet hash.


### Geometry Review Ledger → Reconciliation Queue Binding

The review ledger is now validated against its exact geometry-reconciliation queue when the queue is supplied to the validator:

    npm run validate:1326-geometry-review-ledger -- --input <geometry-review-ledger> --queue <geometry-reconciliation-queue>

This gate requires:

- the same scenario/source identity;
- the same top-level `candidatePacketSha256`;
- every ledger `reviewId` to exist in the reconciliation queue;
- the same `sourceFeatureIndex`;
- the same `candidateRecordSha256`;
- identical record counts;
- unique ledger review IDs.

The ledger preparation step also refuses a reconciliation queue whose review items do not carry the queue-level packet hash or a valid candidate-record hash. This prevents the review ledger from becoming a second, independently mutable identity layer between geometry reconciliation and research review.

The ledger remains `authorityStatus: review-ledger-only` and `promotion: BLOCKED`; this binding establishes provenance continuity only and does not approve or generate geometry.


### Explicit Edge Evidence → Pilot Readiness Hardening

The T3-B readiness gate now validates the evidence side of an explicit binding rather than only its review ID syntax. Every bound `edgeEvidenceId` must exist in the supplied pilot evidence registry, pilot edge IDs must be unique, and each ledger record's `candidateRecordSha256` must independently match the corresponding screened candidate record.

The edge bridge also refuses to attach evidence to a review record that has already left the pending state or already contains reviewed geometry. This preserves the intended order:

    candidate/review provenance
      → pending research ledger
      → explicit evidence binding
      → evidence-reference bridge
      → later human/research review

An evidence binding therefore cannot be used to bypass the pending-review gate or silently attach an edge to an already-reviewed geometry record. All authority and promotion guards remain blocked.


### Integrated Cliopatria → T3-B candidate pipeline gate

The integrated 1326 candidate pipeline now extends beyond temporal extraction, reconciliation, and candidate-surface screening into the geometry review queue preparation/validation boundary.

The command sequence is:

    extraction → candidate validation → entity reconciliation → candidate-surface screening → reconciliation validation → geometry review queue preparation → geometry review queue validation

The integrated gate requires the geometry review queue to retain the same candidate-packet SHA-256 as the candidate report, remain promotion-blocked, and contain exactly the screened candidate count. It does not perform historical review or canonical promotion; it establishes a deterministic fail-closed handoff into the pending geometry-review layer.

The package exposes this as `validate:1326-cliopatria-candidate-pipeline` alongside the existing `run:1326-cliopatria-candidate-pipeline` entry point.

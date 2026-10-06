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

    cliopatria-1326-feature-<sourceFeatureIndex>-<candidateRecordSha256[0:16]>

This keeps edge evidence attachment referentially tied to the immutable per-candidate record identity. The top-level `candidatePacketSha256` remains the dataset-level provenance hash and is validated separately.

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


### Acquisition → T3-B integration runtime contract

A dedicated runtime fixture now exercises the full pre-review chain without downloading the real Cliopatria snapshot. The fixture creates a deterministic ZIP containing one GeoJSON member, constructs a temporary acquired acquisition record and acquisition manifest, runs the verified archive → extraction-input preparation, then runs the integrated candidate pipeline against that extraction input.

The contract asserts that the resulting candidate packet reaches the geometry reconciliation queue with matching `candidatePacketSha256`, exactly one pending review item, `reviewedGeometry: null`, and `promotion: BLOCKED`. The fixture is synthetic test evidence only; it does not alter the production acquisition manifest or claim that the real Cliopatria bytes have been acquired.

Registered command: `npm run test:1326-cliopatria-integrated-pipeline-runtime`.


### Acquisition operational gate

The acquisition preflight now pins the expected source file name (`cliopatria.geojson.zip`), the immutable commit-pinned download URL, and, once acquired, the expected retained artifact path. The release page remains the human-facing source reference, while the actual download is resolved from commit `ad28a69`; this prevents a mutable tag from silently changing the bytes behind an otherwise identical acquisition contract.

The preflight remains non-destructive: it does not download bytes and does not mutate the acquisition manifest. The operational sequence remains:

    validate:1326-cliopatria-operational-gate
      → acquire:1326-cliopatria (only when snapshot is still reference-pinned-not-acquired)
      → verify:1326-cliopatria
      → prepare:1326-cliopatria-extraction-input
      → validate:1326-cliopatria-extraction-input
      → validate:1326-cliopatria-candidate-pipeline

No step in this sequence promotes candidate geometry to canonical authority.

### Acquisition operational state gate

A derived fail-closed operational state gate now models the 1326 Cliopatria chain without adding new authority states to the production manifest:

REFERENCE_PINNED_NOT_ACQUIRED → ACQUIRED_UNVERIFIED → VERIFIED → EXTRACTED → CANDIDATE_READY → REVIEW_QUEUE_READY

Run: npm run validate:1326-cliopatria-operational-state

The gate rejects downstream artifacts while the manifest is still reference-pinned, requires retained-byte SHA/length verification before extraction, requires verified extraction provenance before candidate readiness, independently recomputes the candidate packet SHA, and keeps promotion BLOCKED at every state. The production manifest may therefore remain reference-pinned-not-acquired until the real snapshot is intentionally acquired.

Extraction preparation also accepts --extract-dir, allowing runtime fixtures to isolate their extracted member directory instead of deleting a pre-existing production extraction directory.

### Operational state gate binding

The integrated Cliopatria candidate pipeline now invokes the operational state gate before temporal extraction and again after candidate packet creation. When an extraction-input record is supplied without an explicit acquisition argument, the pipeline derives the acquisition record path from the extraction input's retained acquisition provenance. This prevents the pipeline from bypassing acquisition verification while keeping the acquisition record as the single provenance source.

The final pipeline state check requires CANDIDATE_READY before the T3-B geometry review queue handoff. Missing acquisition, missing extraction, or candidate packet provenance drift therefore fails the integrated command before it can report a successful T3-B handoff.

### Integrated provenance tamper contract

The acquisition-to-T3-B runtime fixture now exercises two fail-closed mutation paths after a successful baseline handoff:

- a tampered extracted-GeoJSON SHA in the extraction-input record must prevent the integrated candidate pipeline from starting;
- a mutated candidate record with the original packet SHA must be rejected by the operational CANDIDATE_READY gate.

This keeps the runtime contract aligned with the production chain: byte/extraction provenance must be intact before candidate extraction, and candidate packet identity must remain immutable before the geometry-review queue handoff. The fixture remains synthetic test evidence and does not alter the production acquisition manifest.

### T3-B review identity tamper runtime coverage

The pilot-readiness runtime contract now exercises the review-side identity boundary in addition to packet and evidence drift. Synthetic readiness fixtures must fail closed when:

- a ledger `candidateRecordSha256` is changed while the screened candidate remains unchanged;
- a review item's candidate-bound `reviewId` is changed without changing the underlying candidate record;
- a binding references an unknown pilot evidence edge.

This keeps the review identity chain fail-closed at the point where candidate-derived identity becomes ledger and explicit binding identity. The test remains synthetic and does not create production review bindings.

### Acquisition → T3-B → review/edge bridge end-to-end runtime contract

The synthetic acquisition runtime contract now continues past the geometry reconciliation queue into the research-review boundary. After the verified archive → extraction → candidate pipeline handoff, the fixture prepares and queue-validates the geometry review ledger, creates an explicit candidate-bound edge-evidence mapping against the pilot evidence registry, validates the generated bridge bindings, runs the evidence-reference bridge, and finally runs the T3-B pilot-readiness gate with the generated artifacts.

The contract asserts that the generated review ID and both provenance hashes remain identical from the geometry review queue through the ledger and bridge, that bound edge evidence is attached only through explicit IDs, and that reviewedGeometry remains null and promotion remains BLOCKED. This is synthetic runtime evidence only; it does not acquire real Cliopatria bytes or create a production canonical binding.

### T3-B end-to-end provenance tamper closure

The integrated acquisition-to-T3-B runtime fixture now exercises fail-closed mutations after the successful review/edge bridge handoff. The runtime contract must reject ledger candidate-packet drift, ledger candidate-record drift, ledger review-ID drift, explicit binding review-ID drift, and explicit binding edge-ID drift at the bridge boundary. It also passes a tampered ledger candidate-record hash through the final pilot-readiness gate and requires rejection there.

This closes the synthetic runtime path from acquired bytes through review identity and explicit evidence binding. These cases verify provenance integrity only; they do not approve historical geometry, infer political control, or promote candidate evidence to canonical authority.


### ### Pilot readiness schema correction

The T3-B pilot-readiness validator binds review geometry through the review item's top-level `sourceGeometry.sha256`, matching the geometry reconciliation queue schema. The readiness fixture uses the same structure. `sourceEvidence` remains limited to candidate-record provenance; geometry provenance is not nested beneath it.


### T3-B binding provenance hardening
The explicit edge-evidence binding contract now carries the review ledger's `candidatePacketSha256` into the bridge-reference binding report. Pilot readiness requires this hash to equal the candidate packet hash already propagated through screening, reconciliation, and review. Binding review IDs are also required to exactly match the review-queue identity for the referenced source-feature index; an index match with a different 16-character suffix is rejected. This remains evidence/reference-only: geometry generation, controller inference, automatic review matching, and canonical promotion remain disabled.


### Edge bridge packet-provenance guard
The T3-B edge-evidence bridge now fail-closes unless the binding packet's `candidatePacketSha256` exactly matches the candidate-packet provenance carried by the review ledger. This prevents a standalone bridge invocation from accepting a binding set from a different candidate packet. The bridge remains reference-copy-only and cannot generate geometry, infer controllers, or promote canonical geography.


### T3-B CI and production-artifact verification — 2026-10-05
CI run 3303 passed on current HEAD `5ae1dee5f1fccecfdf73ae7cf7ae2b56fa5ecc5c`. The tracked pilot evidence registry `bithynia-core-01.json` remains `evidence-reference-only` with promotion `BLOCKED`. Generated build review/binding/bridge outputs are not treated as tracked production artefacts when absent from the branch. Therefore fixture/CI success is not interpreted as completed historical geometry review.

The current hard blocker is unchanged: the production acquisition manifest remains pinned to Cliopatria v0.2.0, while the verified v0.2.1 snapshot is comparison/research-only. The v0.2.0 archive bytes are still required before real candidate-specific review IDs and research-backed T3-B bindings can be created against the production source chain. No v0.2.1 geometry is substituted for v0.2.0. T3-B therefore remains **technical provenance PASS / historical review WAITING / canonical promotion BLOCKED**.

The v0.2.0 binary acquisition remains externally blocked in this working environment: the GitHub repository connector can inspect the pinned blob identity but cannot decode the ZIP blob as UTF-8, and the web fetch layer cannot retrieve the binary archive. This is an access/tooling limitation, not evidence that the artifact is missing or changed. The production manifest therefore remains untouched at `reference-pinned-not-acquired`; no substitute byte source is accepted.


### T3-B CI checkpoint — 2026-10-06

The current branch HEAD `842f94c7ea679c37f3f5e89126551f132add10ba` has a verified GitHub Actions **CI run 3304 — SUCCESS**. The run completed the full `validate` job; all 79 validation/build/test steps reported `success`.

The checkpoint explicitly includes successful execution of the 1326 source-intake contract, historical GIS runtime assets and identity tests, historical political map tests, Phase 2 province topology and authoritative province generation contracts, spatial seed/P3/P6.x contracts, physical/cartography/rendering contracts, GPU province pack integrity/build, game startup/runtime/build checks, historical GIS/map script verification, and the 15K+ province scalability/diagnostics tests.

This CI result confirms the **technical repository gate** for the current T3-B branch state. It does **not** convert evidence-layer artifacts into historical authority. The current state remains:

```
technical provenance / repository gate = PASS
historical geometry review             = WAITING
canonical political geography          = BLOCKED
```

The production acquisition manifest remains `reference-pinned-not-acquired` for Cliopatria v0.2.0. The v0.2.0 raw archive bytes are still not available through the current acquisition path, so no real candidate-specific review IDs or production edge bindings are fabricated. The verified v0.2.1 snapshot remains comparison/research-only and is not substituted for v0.2.0.

The next legitimate transition is therefore **historical evidence acquisition/reconciliation**, not another synthetic validator layer and not canonical promotion. Once the pinned v0.2.0 bytes are genuinely acquired and verified, the existing deterministic chain may proceed:

```
acquisition → extraction → candidate validation
→ entity reconciliation → candidate screening
→ geometry review queue → research-backed geometry review
→ topology / provenance / confidence review → canonical gate
```

CI success is recorded here as a repository/gate checkpoint only; it is not treated as evidence that the historical province boundaries are correct.


### T3-B CI checkpoint — 2026-10-06 / run 3305

The CI checkpoint recorded on the preceding HEAD was revalidated after the documentation commit. GitHub Actions **run 3305** completed successfully for HEAD `5d270ac2a311fa7bd2403330dc1509970bf57a5c`. Its `validate` job completed all 79 validation/build/test steps with `success`.

This confirms that the T3-B CI checkpoint itself is not stale: the repository remains technically green after recording the run-3304 evidence in this document. The successful run again covers the 1326 source-intake contract, historical GIS/runtime and identity checks, historical political map checks, province topology and authoritative generation contracts, physical/cartography/rendering/build checks, GPU province pack integrity, game runtime/startup checks, and 15K+ province scalability diagnostics.

The state remains deliberately unchanged at the authority boundary:

```
technical repository gate = PASS
historical geometry review = WAITING
canonical political geography = BLOCKED
```

The production Cliopatria v0.2.0 acquisition manifest remains `reference-pinned-not-acquired` with `rawSha256 = null`. A direct fetch attempt against the exact pinned raw URL for commit `ad28a69` also returned an access-layer cache miss. This does not establish a byte-level change or disappearance of the source; it confirms only that the current environment still cannot retrieve the binary archive through that path.

No v0.2.1 data is substituted, no synthetic geometry is introduced, and no production review bindings are fabricated. The next valid transition remains genuine v0.2.0 byte acquisition and verification, followed by the already-defined extraction → reconciliation → review chain.


### T3-B CI checkpoint — 2026-10-06 / run 3306 and v0.2.0 secondary distribution discovery

GitHub Actions **run 3306** completed successfully for HEAD `42887ba1c8c6428461b69b8491216b02c8f2bd33`. The full `validate` job again completed all 79 validation/build/test steps with `success`.

A new provenance-relevant acquisition lead was also verified independently: the official Zenodo record for Cliopatria **v0.2.0** (DOI `10.5281/zenodo.20274630`) publishes a `Seshat-Global-History-Databank/cliopatria-v0.2.0.zip` file and identifies the related software release as GitHub `v0.2.0`. The record reports the archive as 297.1 MB and supplies MD5 `6d573d5a07dfcd5a2c6c9933d6401d48`.

This is a legitimate secondary distribution of the same named v0.2.0 release, but the current working environment cannot retrieve the 297.1 MB binary into the workspace. Therefore this discovery is **not** treated as an acquired production snapshot, and the production acquisition manifest remains unchanged at `reference-pinned-not-acquired`. No SHA-256 byte identity has been established between the Zenodo file and the pinned GitHub blob `cefab0f4b622e2e7fb3daf68d4f461f83991204c`.

The required next step is byte-level verification if/when the archive can be downloaded: compute the archive SHA-256 and Git blob identity, compare against the pinned source contract, and only then transition the acquisition manifest to `acquired`. Until that succeeds, v0.2.1 remains excluded as a substitute and no candidate/review geometry is promoted.

Current authority state remains:

```
CI / technical repository gate = PASS
v0.2.0 acquisition           = NOT YET VERIFIED
historical geometry review   = WAITING
canonical political geography = BLOCKED
```


### T3-B CI checkpoint — 2026-10-06 / run 3307 and user-supplied Cliopatria archive forensic check

GitHub Actions **run 3307** completed successfully for the current HEAD `d4d8561505c1af04266321ddc02e7eb98ab46c93`. The repository CI therefore remains technically green after the run-3306 documentation checkpoint.

A user-supplied `cliopatria-main.zip` archive was also inspected locally as a potential acquisition source. The outer archive is 298,798,816 bytes; its own MD5 is `ee3cfa94bfb3d386d55130ee93d97982` and SHA-256 is `6f26816e8b7125a53239be3982a95d8baac42945cd15e15b782b1f612ae637ba`. It contains `cliopatria-main/cliopatria.geojson.zip` with 46,005,176 bytes. The nested source archive has MD5 `2681d49b59e8ff967f7c25dd4e51b57c`, SHA-256 `e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4`, and Git blob SHA-1 `a1e7093b64990bf97cd3c31bda96de1cafed822c`.

These byte identities do **not** match the pinned production source blob `cefab0f4b622e2e7fb3daf68d4f461f83991204c`, and the outer archive MD5 does not match the official Zenodo v0.2.0 archive MD5 `6d573d5a07dfcd5a2c6c9933d6401d48`. The archive README also describes the repository generally and does not itself establish that the supplied snapshot is the immutable GitHub `v0.2.0` release. Therefore the supplied archive is retained as **comparison/research evidence only** and is not accepted into `data/gis/1326/acquisition-manifest.json`.

This check is important because the archive is useful enough to inspect, but it cannot safely replace the pinned source without byte-level identity. No v0.2.1/current-main geometry is substituted, no production SHA is overwritten, and no candidate/review geometry is promoted from this archive.

The current authority state is therefore:

```
CI / technical repository gate = PASS (run 3307)
user-supplied archive         = INSPECTED / NOT VERIFIED AS v0.2.0
pinned v0.2.0 acquisition     = NOT YET VERIFIED
historical geometry review    = WAITING
canonical political geography = BLOCKED
```

The next valid transition remains exact v0.2.0 byte verification. The supplied archive has closed one uncertainty — we now have a locally inspectable Cliopatria snapshot — but its bytes are demonstrably not the pinned production artifact, so the acquisition manifest must remain unchanged.


### T3-B source identity clarification — supplied archive is the current `main` snapshot, not v0.2.0

The user-supplied `cliopatria-main.zip` was compared against the upstream repository's immutable file references. GitHub reports the `cliopatria.geojson.zip` blob at upstream `main` as `a1e7093b64990bf97cd3c31bda96de1cafed822c`, exactly matching the nested archive extracted from the supplied package. GitHub reports the same file at tag `v0.2.0` as `cefab0f4b622e2e7fb3daf68d4f461f83991204c`, which is the production source blob already pinned by the Historia AI acquisition manifest.

This resolves the provenance ambiguity: the supplied archive is not an unknown damaged copy. It is the upstream **current `main` snapshot** (as packaged in `cliopatria-main.zip`), while the required production source is the immutable **`v0.2.0` tag snapshot**. The two source blobs are different and therefore cannot be interchanged.

The official Zenodo v0.2.0 record independently identifies its related work as the GitHub `v0.2.0` tree and reports MD5 `6d573d5a07dfcd5a2c6c9933d6401d48`. citeturn0search1 The upstream repository documentation also states that each release is tagged and that the data archive is the repository's `cliopatria.geojson.zip` artifact. citeturn0search0

Therefore:

- supplied `cliopatria-main.zip` = valid upstream **main** snapshot, useful for research/comparison;
- upstream `main` GeoJSON ZIP blob = `a1e7093b64990bf97cd3c31bda96de1cafed822c`;
- required v0.2.0 GeoJSON ZIP blob = `cefab0f4b622e2e7fb3daf68d4f461f83991204c`;
- production manifest remains pinned to v0.2.0 and remains **reference-pinned-not-acquired**;
- no main-branch data is substituted for the historical acquisition target.

This is a source-identity clarification, not an authority promotion. The next transition is still genuine acquisition/verification of the exact v0.2.0 bytes, after which the existing extraction → candidate → review chain can operate against the correct immutable source.


### T3-B acquisition checkpoint — 2026-10-06 / Cliopatria v0.2.0 byte verification complete

The pinned Cliopatria v0.2.0 source has now crossed the real acquisition gate in GitHub Actions run **37482859089 / acquisition verification run #2** on branch HEAD `aeb7e49e378bf6b432c1d63d23db2930b79d2617`.

The official Zenodo v0.2.0 distribution was verified at the archive level, and the embedded `cliopatria.geojson.zip` was verified against the immutable Git blob contract:

- immutable commit: `ad28a69`
- source blob SHA-1: `cefab0f4b622e2e7fb3daf68d4f461f83991204c`
- retained source byte length: `44231317`
- retained source SHA-256: `d01ae3a20d358cc5d54f69d9d725d390767d9c8759ac89ad6f90c58d106f3370`
- acquisition record: `data/build/gis/1326/source-snapshots/cliopatria-v0.2.0.acquisition.json`
- retained artifact: `data/build/gis/1326/source-snapshots/cliopatria-v0.2.0.geojson.zip`

The acquisition script itself then executed `--download` and `--verify` in the clean CI workspace, and the direct retained ZIP was independently checked with `git hash-object`. Both acquisition verification and the normal Historia AI CI **run 3311** completed successfully.

The tracked acquisition manifest has consequently transitioned only its **source provenance state** from `reference-pinned-not-acquired` to `acquired`. `authorityStatus` remains `evidence-only`; promotion remains blocked. The acquisition record explicitly reports `temporalExtraction.status = not-yet-extracted` and `promotion = BLOCKED_UNTIL_EXTRACTION_RECONCILIATION_REVIEW`.

This is the first real byte-level acquisition of the pinned v0.2.0 source in the production chain. The previously supplied `cliopatria-main.zip` remains comparison/research-only because its source blob was the upstream `main` blob `a1e7093b64990bf97cd3c31bda96de1cafed822c`, not the pinned v0.2.0 blob.

The next legitimate transition is now:

```text
VERIFIED acquisition
  -> extraction-input preparation
  -> extraction validation
  -> temporal candidate extraction
  -> entity reconciliation
  -> candidate surface screening
  -> T3-B review queue
```

No canonical geometry is created or promoted by acquisition, and no synthetic/fallback geometry is permitted.

### Current T3-B authority state

```text
repository / CI gate          = PASS (run 3311)
pinned v0.2.0 acquisition     = ACQUIRED + VERIFIED
source byte provenance        = PASS
1326 temporal extraction      = NOT YET RUN
candidate surface             = WAITING FOR REAL EXTRACTION
historical geometry review    = WAITING
canonical political geography = BLOCKED
```

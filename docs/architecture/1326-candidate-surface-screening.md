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

This contract verifies that the downloader and data/gis/1326/acquisition-manifest.json agree on the pinned v0.2.0 source URL, source ID, immutable Git blob reference, and blocked promotion state. It does not claim that network acquisition has succeeded.

The actual acquisition sequence remains:

    npm run acquire:1326-cliopatria
            ↓
    retained ZIP + acquisition record
            ↓
    npm run verify:1326-cliopatria
            ↓
    extract → reconcile → screen

Until the retained artifact has a recorded SHA-256 and passes verification, no candidate count from an external acquisition is treated as repository evidence.

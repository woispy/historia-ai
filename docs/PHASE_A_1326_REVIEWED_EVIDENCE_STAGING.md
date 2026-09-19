# Phase A — 1326 Reviewed Evidence Staging Contract

Status: **staging implementation OPEN; canonical geometry promotion BLOCKED**

Scenario date: **1326-04-07**

## Purpose

This contract creates the production-side staging layer requested by the Phase A geometry review without pretending that missing historical polygons have been acquired.

The staging layer is an integration artifact only:

```
source evidence
    ↓
temporal/entity reconciliation
    ↓
reviewed-evidence staging
    ↓
candidate geometry review
    ↓
physical/topology validation
    ↓
canonical authority
```

The staging layer is **not** the canonical Political Geography dataset and must never overwrite the canonical MapBin.

## Authority states

- `candidate-evidence-only`: directly retained source evidence that has not passed review.
- `reviewed-evidence-staging`: evidence identity, temporal applicability and review notes are assembled into a deterministic production-side manifest; geometry may still be missing.
- `reviewed-reconstruction`: reserved for a separately authored, provenance-backed historical reconstruction whose geometry method and assumptions are explicitly recorded.
- `canonical`: reserved for the existing fail-closed political authority pipeline.

This phase does **not** assign `reviewed-reconstruction` or `canonical` to any missing geometry.

## Tier-1 1326 state

| Entity | Historical evidence | Cliopatria identity | Staging state | Geometry |
| --- | --- | --- | --- | --- |
| Ottoman Beylik | supported | Q12560 cross-polity manual review | reviewed-evidence-staging | candidate geometry; review required |
| Byzantine Empire | supported | candidate | reviewed-evidence-staging | candidate |
| Eşrefoğulları | supported | source gap | reviewed-evidence-staging | missing |
| Ilkhanate | supported | candidate | reviewed-evidence-staging | candidate |
| Karesi | supported | candidate | reviewed-evidence-staging | candidate |
| Saruhan | supported | candidate | reviewed-evidence-staging | candidate |
| Aydın | supported | candidate | reviewed-evidence-staging | candidate |
| Alâiye | supported | source gap | reviewed-evidence-staging | missing |

The Eşrefoğulları and Alâiye entries therefore enter production integration as **known historical entities with unresolved geometry**, not as invented polygons.

## Hard locks

The staging builder must fail closed if:

1. scenario date is not `1326-04-07`;
2. evidence matrix is not `authorityStatus: evidence-only`;
3. reconciliation report is not `promotion: BLOCKED`;
4. an entity is emitted with `geometryStatus: authoritative`;
5. staging output declares `authorityStatus: canonical`;
6. staging output declares `promotion: ALLOWED`;
7. a synthetic geometry source is introduced;
8. the canonical MapBin path is touched.

The builder is deliberately metadata/evidence-only. It does not generate, repair, simplify, trace or infer polygon coordinates.

## Deterministic output

The staging command is:

```powershell
npm run build:1326-reviewed-staging
```

It writes only:

```
data/build/gis/1326/reviewed-staging/manifest.json
```

The manifest records:

- scenario date;
- source IDs and reconciliation source;
- entity identity status;
- historical existence/control evidence status;
- geometry status;
- review status;
- promotion lock;
- explicit next gate.

No canonical runtime asset is modified.

## Next geometry gate

The staging layer is now ready to accept reviewed geometry adapters.

For Eşrefoğulları and Alâiye, the next admissible geometry step remains:

1. acquire a traceable machine-readable boundary or explicitly authored reconstruction source;
2. pin source identity, license and raw hash;
3. bind the geometry to 1326-04-07;
4. reconcile entity identity;
5. run physical-land validation;
6. run topology validation;
7. record reviewer decision and confidence;
8. only then evaluate canonical promotion.

No image-to-polygon tracing, 1300→1326 relabeling, Voronoi/fallback fill, jitter, anchor fill or capital-radius generation is permitted by this contract.

## Relationship to canonical production

The existing canonical publisher remains unchanged.

```
reviewed-staging manifest
        │
        │ later, after geometry gates
        ▼
reviewed source contract
        ▼
PoliticalGeographyDatasetBuilder
        ▼
canonical MapBin
```

Until that transition is explicitly reviewed, **SAFE TO DELETE = 0** and canonical geometry remains untouched.

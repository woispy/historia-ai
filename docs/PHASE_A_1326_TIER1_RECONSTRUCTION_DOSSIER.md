# Phase A — 1326 Tier-1 Reviewed Reconstruction Dossier

Status: **authoring preparation complete; geometry intentionally pending**

Scenario date: **1326-04-07**

## Purpose

This dossier is the first reviewable reconstruction artifact for the two Cliopatria source-gap entities:

- Eşrefoğulları
- Alâiye Beyliği

It is an authoring specification, not a polygon and not canonical authority.

The dossier records what is currently supported by the project evidence matrix and prior source research, then defines exactly what must be supplied before a reviewed reconstruction can carry geometry.

## Non-negotiable temporal rule

The scenario state is evaluated at the start of **7 April 1326**.

Evidence describing territorial changes after that instant may be used only to establish a later change boundary. It must not be projected backward into the scenario.

---

## Eşrefoğulları

### Historical state

- Entity: `esrefogullari`
- Display name: Eşrefoğulları
- Region: Anatolia
- Tier: 1
- Existence at scenario start: supported
- Control at scenario start: supported
- Current geometry status: `pending-source-acquisition`
- Evidence-matrix confidence: 0.90

### Evidence currently accepted

1. **TDV — Eşrefoğulları**
   - II Süleyman was killed on **9 October 1326**.
   - Therefore the polity had not yet ended on **7 April 1326**.
   - Role: temporal-existence bound.

2. **Alperen (2001) map as reproduced in the Beyşehir-focused academic study**
   - Provides a historical depiction of Eşrefoğulları's territorial extent.
   - The reproduced map is explicitly described as an **approximate widest extent**.
   - Role: cartographic reconstruction candidate.
   - It must not be treated as an exact 7 April 1326 boundary.

3. **Independent regional historical references**
   - Support Beyşehir/Seydişehir and wider territorial context.
   - Role: place/extent cross-check.
   - Not a machine-readable polygon authority.

### Reconstruction interpretation

The admissible reconstruction question is:

> What boundary representation best explains the historical evidence applicable immediately before 7 April 1326, while explicitly exposing uncertainty?

It is **not**:

> What is the exact historical polygon?

### Required geometry evidence

At least one of the following must be acquired:

- traceable machine-readable historical geometry;
- an explicitly authored georeferenced reconstruction from a traceable historical map;
- a multi-source reconstruction with documented control points and assumptions.

If a historical map is used, the reconstruction record must retain:

- source identity;
- map date/context;
- license/usage;
- image/artifact identity;
- raw SHA-256 where a retained artifact exists;
- image dimensions;
- CRS/geographic extent;
- control points;
- affine-fit residual;
- digitization method;
- uncertainty;
- reviewer.

### Forbidden shortcuts

- 1300 polygon relabelled as 1326;
- 1400 polygon relabelled as 1326;
- capital-radius geometry;
- Voronoi/fallback geometry;
- unrecorded hand coordinates;
- image tracing without georeference/provenance.

---

## Alâiye Beyliği

### Historical state

- Entity: `alaye`
- Display name: Alâiye Beyliği
- Region: Southern Anatolia
- Tier: 1
- Existence at scenario start: supported
- Control at scenario start: supported-in-general
- Current geometry status: `pending-source-acquisition`
- Evidence-matrix confidence: 0.80

### Evidence currently accepted

1. **TDV — Anadolu Beylikleri**
   - Dates Alâiye to **1293–1471**.
   - Role: polity-existence interval.

2. **TDV — Alâiye Beyliği**
   - Places the polity in the Alanya region.
   - Describes the post-1293 political context and later continuity.
   - Role: historical-control/geographic context.

3. **Phersu Atlas**
   - Public Alaiye polity record spans **1294–1493**.
   - Provides time-dependent territorial views.
   - Role: independent temporal/cartographic cross-check.
   - No immutable 1326 machine-readable geometry has been acquired.

4. **Euratlas / TTK / Salt Research / local GIS references**
   - Useful for geographic and place-name reconciliation.
   - None is currently accepted as a direct 1326 political polygon.

### Reconstruction interpretation

The admissible question is:

> What geographically and historically defensible boundary reconstruction can be produced for Alâiye at 7 April 1326 from traceable evidence?

It is not acceptable to copy a 1300 or 1400 boundary and rename it 1326.

### Required geometry evidence

The preferred path is a traceable machine-readable source.

If unavailable, a reviewed reconstruction may be authored from date-appropriate cartographic evidence, provided that:

- the source artifact is retained;
- georeferencing is reproducible;
- control points are recorded;
- temporal interpretation is explicit;
- uncertainty is quantified/declared;
- the reconstruction is marked `reviewed-reconstruction`, never `canonical` at this stage.

---

## Reconstruction source record

The first actual geometry artifact must use this minimum structure:

```json
{
  "entityId": "esrefogullari | alaye",
  "scenarioDate": "1326-04-07",
  "authorityStatus": "reviewed-reconstruction",
  "promotion": "BLOCKED",
  "sourceIdentity": {},
  "temporalApplicability": {},
  "entityReconciliation": {},
  "georeference": {
    "method": "affine",
    "controlPoints": [],
    "rmsResidual": null
  },
  "geometry": {
    "status": "pending",
    "ring": []
  },
  "assumptions": [],
  "uncertainty": {},
  "review": {
    "status": "draft"
  }
}
```

An empty ring is intentional at this stage.

## Gate for entering geometry

A polygon may be inserted only after its source artifact and reconstruction method are recorded.

The sequence is:

1. source artifact acquired;
2. source hash recorded;
3. temporal interpretation recorded;
4. entity identity reconciled;
5. georeference fitted;
6. control-point residual checked;
7. boundary digitized;
8. Province Source Studio ring validation;
9. proof-group/topology validation;
10. physical-land validation;
11. reviewer decision;
12. canonical promotion review.

## Current decision

**No geometry has been fabricated.**

The dossier therefore closes the reconstruction-definition gate but intentionally leaves the geometry gate open.

Next admissible action: acquire or retain the first traceable cartographic artifact for Eşrefoğulları and Alâiye, then build the corresponding georeferenced reconstruction proof.

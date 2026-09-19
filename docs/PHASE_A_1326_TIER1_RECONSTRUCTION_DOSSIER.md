# Phase A — 1326 Tier-1 Reviewed Reconstruction Dossier

Status: **source-discovery gate completed; no geometry promoted**

Scenario date: **1326-04-07**

## Purpose

This dossier defines the admissible reconstruction path for the two current Tier-1 source gaps:

- Eşrefoğulları
- Alâiye Beyliği

It remains an authoring/review artifact. It is not canonical political geometry.

## Eşrefoğulları — source discovery

A web research pass identified a directly viewable reproduction of **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** in a Beyşehir historical-urban study. The page describes the map's legend as including the beylik centre, settlements, an approximate drawing of the widest extent, and territories attached for a short period. citeturn0search1

This is therefore useful as a **cartographic reconstruction candidate**, but its description explicitly prevents treating it as an exact 7 April 1326 boundary.

Required next action is acquisition/retention of the underlying map artifact with provenance before any digitization.

## Alâiye — source discovery

A public Phersu Atlas record exists for Alaiye and provides time-oriented political-control maps and a polity chronology. Its listed chronology is 1294–1493. This is useful as an independent temporal/cartographic cross-check, but no immutable 1326 machine-readable polygon artifact has been acquired. citeturn0search5

TDV's Alâiye entry independently establishes the polity in the Alâiye/Alanya region from the late 13th century to 1471 and describes the political context after 1293. This supports historical existence/context, not a canonical 1326 polygon. citeturn0search8

A SALT Research item titled **“14. yüzyıl başında Anadolu Türk Beylikleri haritası”** is openly accessible as a scanned JPEG and is potentially useful as contextual cartography. However, its title places it at the beginning of the 14th century, so it cannot be silently promoted to an exact 1326 boundary. citeturn0search0

## Current source classification

| Source | Entity | Role | Geometry authority |
|---|---|---|---|
| Alperen (2001) map reproduction | Eşrefoğulları | cartographic reconstruction candidate | No |
| Phersu Alaiye record | Alâiye | temporal/cartographic cross-check | No |
| TDV Alâiye | Alâiye | historical existence/control context | No |
| SALT early-14th-c. map | regional | contextual cartography | No |

## Reconstruction rule

No polygon may be created merely because a map image exists.

Before digitization the retained source record must contain:

- source identity and URL/reference;
- artifact file and raw SHA-256;
- rights/licence information where available;
- map date/context;
- image dimensions;
- geographic extent or control-point basis;
- temporal applicability decision;
- entity reconciliation decision;
- georeference method;
- control points and residuals;
- assumptions and uncertainty.

## Scenario protection

The project scenario remains **1326-04-07**. Evidence from later periods may establish later change but must not be projected backward.

## Promotion lock

`authorityStatus = reviewed-reconstruction`  
`promotion = BLOCKED`

No source discovered in this pass changes the canonical geometry gate.

## Next gate

Acquire/retain the actual cartographic artifact for the first reconstruction candidate, hash it, register provenance, then run georeference calibration before producing any polygon.


## Cartographic artifact ledger — 2026-09-19

A dedicated provenance ledger now exists at:
`data/gis/1326/tier1-cartographic-artifact-ledger.json`

### SALT Research — TASUDOC0286

The SALT record exposes the original JPEG and identifies it as a beginning-of-14th-century Anatolian beyliks map. The record states Open Access but also specifies **CC BY-NC-ND 4.0** terms and prohibits transformed/derived documents. Therefore this artifact is retained in the project ledger as **contextual cartography only**; it is not an unrestricted georeferencing/digitization source.

This closes a useful research question: the map can inform historical interpretation, but its current rights/date scope do not justify turning it into a 1326 polygon.

### Eşrefoğulları — Alperen (2001) reproduction

The Tekkanat & Yavuz paper reproduces “Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)” and explicitly labels the widest extent as approximate, while also distinguishing temporarily attached territory. The paper gives the Eşrefoğulları regional extent as south: Seydişehir/Bozkır; north: Doğanhisar/Ilgın; west: Yalvaç/Şarkikaraağaç/Gelendost; northwest: Akşehir/Çay/Bolvadin.

This is a **candidate reconstruction source**, not a precise 7 April 1326 polygon. The underlying artifact still requires retention and rights/provenance review before any georeferencing or digitization.

### Gate decision

The artifact-discovery gate is now **partially closed**:

- contextual map evidence: registered;
- provenance ledger: registered;
- date-specific 1326 machine-readable geometry: still absent;
- unrestricted reconstruction artifact: still absent;
- canonical geometry promotion: BLOCKED.

No polygon was created from either artifact.


## 2026-09-19 source-artifact feasibility review

A fresh source review confirms that the Erbakan University repository exposes the full 2017 paper and its downloadable PDF. The indexed PDF explicitly identifies **“Harita 2. Eşrefoğulları Beyliği Sınırları (Alperen, 2001)”** and describes the map symbology: centre, settlements, an **approximate widest extent**, and territories attached for a short period. It also exposes the geographic labels visible on the map, including Beyşehir, Eber Gölü, Akşehir Gölü, Çavuşçu Gölü, Sultan Dağı, Çay, Yalvaç, Akşehir, Ilgın, Kadınhanı, Doğanhisar, Derbent, Hüyük, Kıreli, Seydişehir, Bozkır, Çarşamba Çayı, Konya, Hamitoğulları, Karamanoğulları and Eğirdir. This confirms that the figure is a usable **research/reconstruction reference**, but does not establish an exact 1326 boundary. citeturn0search16turn0search0

The repository metadata marks the paper as open access, but the current repository evidence does not establish a separate, unrestricted licence for extracting and transforming the embedded historical map into a production geometry. Therefore the project continues to treat the figure as **reference-only until artifact-rights review is explicit**.

A second independent historical source, Hüseyin Muşmal's demographic study, reproduces a late-13th-century description of Eşrefoğulları's neighbouring polities and identifies Beyşehri as its capital. This is useful for historical context and control-point interpretation, but it is not a boundary polygon and is not being used to manufacture one. citeturn0search3

### Gate decision

The Eşrefoğulları source is now **artifact-confirmed as a visual research reference**, but remains **geometry-blocked**. No coordinates are inferred from the image and no polygon is generated.

The next admissible action is to construct a non-geometric source-proof record (artifact identity, visible labels, temporal interpretation, rights status, and provenance) and then seek a clearly reusable, date-appropriate boundary artifact before georeferencing.

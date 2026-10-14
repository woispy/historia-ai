# Historia AI — Cliopatria v0.2.1 Intake Verification

## Status

**LOCAL VERIFIED / NOT PROMOTED / NOT SUBSTITUTED FOR v0.2.0**

This intake records the uploaded Cliopatria repository snapshot separately from the currently pinned Historia AI acquisition source.

The existing 1326 acquisition contract remains pinned to **Cliopatria v0.2.0** at commit `ad28a69`. The uploaded artifact is **v0.2.1** and must not be silently mixed into the v0.2.0 provenance chain.

## Uploaded artifact

- Outer archive: `cliopatria-main.zip`
- Outer SHA-256: `6f26816e8b7125a53239be3982a95d8baac42945cd15e15b782b1f612ae637ba`
- Outer byte length: `298798816`
- Repository snapshot commit: `5f433377139a6eeaeacbdc894b70f8805b72c8b5`
- Commit message: `Version 0.2.1`
- Source repository: Seshat Global History Databank / Cliopatria

## Embedded source artifact

The uploaded repository snapshot contains:

`cliopatria-main/cliopatria.geojson.zip`

- Source version: **v0.2.1**
- Git blob SHA-1: `a1e7093b64990bf97cd3c31bda96de1cafed822c`
- ZIP SHA-256: `e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4`
- ZIP byte length: `46005176`
- Inner GeoJSON member: `cliopatria_polities_only_v021.geojson`
- GeoJSON byte length: `172854269`
- GeoJSON SHA-256: `fc6f0d1e4cc42f45da83522b3696db6f2cc85ec0d12259a85c89b31347b8fc0a`
- GeoJSON type: `FeatureCollection`
- Feature count: `13797`

## 1326 temporal inspection

Using the dataset's documented temporal rule:

`FromYear <= 1326 <= ToYear`

the v0.2.1 GeoJSON contains:

- 150 POLITY records applicable to 1326
- 150 unique polity names in that temporal slice

Confirmed Tier-1 examples include:

- Ottoman Empire — 1326–1332
- Byzantine Empire — 1326–1332
- Ilkhanate — 1314–1332
- Germiyanids — 1326–1332
- Beylik of Karaman — 1326–1332
- Beylik of Hamid — 1326–1332
- Beylik of Saruhan — 1326–1343
- Beylik of Aydin — 1326–1414
- Empire of Trebizond — 1305–1332
- Kingdom of Serbia — 1326–1332
- Second Bulgarian Empire — 1326–1343

These observations are source-intake facts only. They do not establish province boundaries or canonical political geometry.

## Provenance boundary

The current production acquisition contract remains:

`Cliopatria v0.2.0 → immutable commit ad28a69 → source blob cefab0f4... → acquisition/verification → extraction → T3-B`

The uploaded v0.2.1 artifact is instead:

`Cliopatria v0.2.1 → commit 5f433377... → source blob a1e7093b... → local intake verification`

No v0.2.1 bytes have been written into the tracked v0.2.0 acquisition manifest, and no v0.2.1 geometry has been promoted to candidate/reviewed/canonical production geometry.

## Next gate

Before replacing the v0.2.0 source pin with v0.2.1, perform an explicit source-version migration decision and rerun the acquisition-contract, extraction, candidate-packet, reconciliation, and T3-B provenance gates against the new immutable reference.

Until that decision is made, v0.2.1 remains a verified incoming source snapshot only.

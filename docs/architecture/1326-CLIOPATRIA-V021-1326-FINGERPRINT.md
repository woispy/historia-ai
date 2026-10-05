# Historia AI — Cliopatria v0.2.1 / 1326 Candidate Fingerprint

## Purpose

This report is a **source-version fingerprint**, not a political-geometry authority.

It records the 1326 temporal slice observed in the uploaded Cliopatria v0.2.1 snapshot so a future v0.2.0 → v0.2.1 migration can be compared deterministically.

## Source identity

- Cliopatria repository commit: `5f433377139a6eeaeacbdc894b70f8805b72c8b5`
- Embedded `cliopatria.geojson.zip` Git blob SHA-1: `a1e7093b64990bf97cd3c31bda96de1cafed822c`
- Embedded ZIP SHA-256: `e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4`
- GeoJSON SHA-256: `fc6f0d1e4cc42f45da83522b3696db6f2cc85ec0d12259a85c89b31347b8fc0a`
- GeoJSON feature count: `13797`
- 1326 POLITY records: `150`
- 1326 unique POLITY names: `150`
- Temporal rule: `FromYear <= 1326 <= ToYear`

## Tier-1 source fingerprints

| Entity | From | To | Geometry | Points | Area km² | Geometry fingerprint |
|---|---:|---:|---|---:|---:|---|
| Ottoman Empire | 1326 | 1332 | Polygon | 54 | 26,535.3050 | `df100a3c38eeb5549eac3c5517b21f2cfc3a078722e6a89fa88b412bff1437f0` |
| Byzantine Empire | 1326 | 1332 | MultiPolygon | 228 | 154,727.9835 | `a9975481d523115b943860d402b397f91975df31572321fe53316ce7334274ca` |
| Ilkhanate | 1314 | 1332 | MultiPolygon | 270 | 3,710,549.7719 | `d441e25fe71934f5aac0af18cc4d00d6e51b2a2dcb12d1248c25da55c5821307` |
| Germiyanids | 1326 | 1332 | Polygon | 60 | 22,798.7033 | `6e158ef097946e6af14c76214ed8579f2ef1eaf83b8c28a411271f25aa034d1a` |
| Beylik of Karaman | 1326 | 1332 | Polygon | 37 | 91,156.1507 | `84cb6f6a01bcdafea1d0604b6a253a2c05dd3cd48761eca251d27cb61ab09768` |
| Beylik of Hamid | 1326 | 1332 | Polygon | 56 | 30,933.2512 | `9d8e671315c3d6c030425bc452414f490bd986a262213ec13c836919aa2412bf` |
| Beylik of Saruhan | 1326 | 1343 | Polygon | 60 | 14,430.1878 | `5678e808117bf56aac7ee5645531c7217c6361a66a4949c8b9fb259f2042dbe2` |
| Beylik of Aydin | 1326 | 1414 | Polygon | 29 | 7,957.8387 | `3929a001687216d05d4a6a462171bd7119054ac1648ef04fa449e80f7f3888fa` |
| Empire of Trebizond | 1305 | 1332 | MultiPolygon | 49 | 14,996.0766 | `5ad0262800316059ec3a76c60130f14a519c821a885de4b9e9ad6977496c7944` |
| Kingdom of Serbia | 1326 | 1332 | Polygon | 54 | 102,415.5763 | `fbf0082ebbc5de3d5401f4c38cd8e30ed727d14dfb8ee3e0f86f6da85a277acb` |
| Second Bulgarian Empire | 1326 | 1343 | Polygon | 66 | 106,120.6763 | `ca92aca01a53a9589fe18480383b68800d46a884bb1d10ff4f7747e0435bf377` |

### Fingerprint definition

The geometry fingerprint is SHA-256 of the parsed GeoJSON geometry object serialized with compact JSON separators. It is intended to detect geometry-content changes between source versions after extraction; it is **not** the raw ZIP hash.

## Version comparison result

GitHub's source history shows v0.2.1 differs from v0.2.0 through two commits:

- README reference update
- Cliopatria GeoJSON archive replacement

The v0.2.1 release notes describe corrections primarily affecting later-period entities, including Serbia-Montenegro, German Confederation, North German Confederation, Duchy of Warsaw, Northern Song, Gold Coast/Cape Coast/Freetown, French Equatorial Africa/Algeria, Danish India/Gold Coast, and Portuguese overseas associations.

Those release notes do **not** establish that the 1326 geometries are unchanged. Therefore the project must not infer 1326 parity from the release description alone.

A byte-level v0.2.0 → v0.2.1 1326 comparison remains **OPEN** until the pinned v0.2.0 archive bytes are available in the same execution environment.



## Deterministic comparison gate

The pending v0.2.0 → v0.2.1 comparison is now represented by the repository tool:

`tools/historical-gis/cli/compare-1326-cliopatria-versions.js`

It accepts two extracted GeoJSON files:

`npm run compare:1326-cliopatria-versions -- --base <v0.2.0.geojson> --head <v0.2.1.geojson> --output <report.json>`

The comparator:

- validates both inputs as GeoJSON FeatureCollections;
- restricts the 1326 slice to `Type=POLITY` and `FromYear <= 1326 <= ToYear`;
- uses deterministic `Wikidata` identity when available, with `Name` only as the fallback identity;
- rejects ambiguous duplicate 1326 identities rather than silently choosing one;
- compares identity presence, temporal ranges, geometry fingerprints, and non-temporal properties;
- separately detects temporal-range changes for identities that are not present in the 1326 slice;
- emits a SHA-256 fingerprint for the complete comparison report.

The automated fixture is `tools/tests/1326-cliopatria-version-comparator.test.js` and is registered as `npm run test:1326-cliopatria-version-comparator`.

This tool is a **comparison gate only**. It does not change the acquisition manifest, promote v0.2.1, or create canonical political geometry.

## Promotion decision

**v0.2.1 is NOT substituted for v0.2.0 yet.**

The current Historia AI acquisition manifest remains pinned to:

`v0.2.0 / commit ad28a69 / source blob cefab0f4...`

The v0.2.1 snapshot is evidence-only and may be used for comparison/research, but it cannot populate the production candidate pipeline until an explicit source-version migration gate passes.

## Next comparison gate

1. Obtain verified v0.2.0 archive bytes.
2. Extract both versions with the same policy.
3. Apply exactly `FromYear <= 1326 <= ToYear`.
4. Compare candidate identity set.
5. Compare per-record temporal ranges.
6. Compare geometry fingerprints and raw geometry structures.
7. Classify differences as:
   - source metadata only;
   - non-1326 temporal correction;
   - 1326 identity change;
   - 1326 geometry change;
   - 1326 addition/removal.
8. Only then decide whether the acquisition pin can migrate to v0.2.1.

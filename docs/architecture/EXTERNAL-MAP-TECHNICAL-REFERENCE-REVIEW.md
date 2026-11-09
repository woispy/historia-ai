# External Map Technology Reference Review — GSInteractive / OpenGS

## Purpose and scope

This is a technical reference review for Historia AI's map pipeline. It records publicly available project documentation and repository metadata associated with the GSInteractive YouTube channel. It is not an adoption decision, a dependency declaration, or a historical-geography source.

Channel: https://www.youtube.com/@GSInteractive  
OpenGS tutorial playlist: https://www.youtube.com/playlist?list=PLz7HHPGLr7NLGJOin49X8VKNHoMHNfaKd

Review basis: the OpenGS and OpenGS Map Tool repository READMEs and LICENSE files were inspected. The playlist is recorded as a learning reference; individual videos have not yet been reviewed scene-by-scene.

## Repositories reviewed

### 1. OpenGS

Repository: https://github.com/Thomas-Holtvedt/opengs  
README describes OpenGS as an open-source 3D grand-strategy map built in Godot to emulate core Paradox-style map methodology. The listed features include selectable provinces, toggleable map modes, 3D map environment, dynamic smooth borders using signed-distance fields (SDF) calculated with Jump Flood Algorithm (JFA), dynamic country-name labels, heightmap/normal-map terrain, and in-game province editing.

The repository declares the MIT License. Reuse of code is therefore possible subject to retaining the required copyright and permission notice. Assets and third-party inputs still require their own provenance and license review; the repository's code license must not be treated as a blanket license for every referenced asset.

### 2. OpenGS Map Tool

Repository: https://github.com/Thomas-Holtvedt/opengs-maptool  
README describes a tool for generating and exporting province/territory maps and related data. Its documented inputs/features include:
- land/ocean/lake image;
- boundary image;
- density image to influence seed distribution;
- optional ocean exclusion from density influence;
- terrain image sampled at province centers;
- lake detection;
- optional jagged land/ocean borders;
- exported province/territory data and territory history files.

The repository declares the MIT License. The tool's own README describes generated province/territory boundaries and density-controlled distribution; those outputs are not historical boundary evidence.

## Relevance to Historia AI

| Topic | Potential value | Guardrail |
|---|---|---|
| Density-controlled seed distribution | Useful for controlled procedural test maps and stress fixtures | Must not generate or replace 1326 authoritative province borders |
| Land/water/lake separation | Useful as a cartographic input-validation idea | Must remain subordinate to our source-backed hydrography and land-mask contracts |
| Terrain classification input | Useful for map-mode and visual layer prototyping | Terrain labels do not establish historical political control |
| SDF/JFA smooth borders | Worth a contained rendering experiment for already validated geometry | Rendering must not alter canonical geometry or hide topology defects |
| Heightmap + normal-map terrain | Useful for evaluating relief presentation and camera response | Modern elevation is contextual physical evidence, not proof of medieval routes |
| Dynamic labels and map modes | Directly relevant to cartographic UX | Labels and modes must use our canonical entity and localization contracts |

## Adoption recommendation

**Reference only; no code or data copied and no dependency added.**

Recommended order for a later isolated technical spike:
1. Inspect the OpenGS SDF/JFA border implementation and measure its GPU cost on our existing province pack.
2. Compare visual output against our current renderer using identical, already validated province geometry.
3. Test density-map workflows only on synthetic/non-authoritative fixtures.
4. Evaluate heightmap/normal-map presentation separately from the active Copernicus evidence acquisition.

A spike must preserve canonical geometry hashes, province identity, world-wrap continuity, and existing map-render regression contracts. Any performance or visual claim must be supported by a reproducible benchmark or screenshot comparison.

## Explicit non-adoption decisions

- Do not copy procedural/Voronoi-like generated boundaries into the 1326 historical political dataset.
- Do not use OpenGS sample maps or generated regions as historical source evidence.
- Do not replace the current renderer or map-data architecture solely because OpenGS uses Godot.
- Do not infer that MIT code licensing grants rights to all bundled or linked data/assets.
- Do not conflate smooth visual borders with historically or topologically correct borders.

## Current status

- External technical reference recorded.
- Source-code implementation not yet audited line-by-line.
- Individual YouTube videos not yet reviewed scene-by-scene.
- No code, asset, or dependency adopted.
- Current Historia AI work remains on `work/phase-a-1326-t3b-candidate-surface`, PR #109.
- Active technical chain remains the 1326 T3-B evidence gate and P6.2 Sakarya physical-reference/DEM acquisition; this note does not change pilot scope or canonical promotion status.

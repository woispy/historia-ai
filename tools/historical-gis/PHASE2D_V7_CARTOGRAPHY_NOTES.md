# Phase 2D V7 cartography constraints

- Keep exactly 38 province identities.
- Use one historical anchor plus deterministic territorial support controls.
- Partition the physical land mask with one shared Voronoi field so province cells do not overlap or create shrink-induced gaps.
- Do not add political barrier sites; `barrierSiteCount` remains zero.
- Use Natural Earth only as a coastal fallback when the curated physical atlas has no coverage.
- Remove the per-province shrink pass that previously created oversized empty gaps and detached coastal fragments.
- Validate vertices and sampled edges against physical land and lakes.
- Regression tests additionally reject nested province fragments, uncovered sampled land, and extreme province-area outliers.

# A2 Execution Gate

## Purpose

This document defines the evidence gate for closing the Amisos (A2) forensic investigation.

## Historical target

- Historical builder commit: `3db105afb857be55e0ce7696f3d7e904185fc5f8`
- Target province: `pontus-amisos`
- Target coordinate: `[36.33, 41.29]`
- Historical anomaly under investigation: approximately `2.27e-13`

## Required execution evidence

The forensic workflow must retain:

1. execution identity;
2. historical clip-lineage output;
3. canonical polygon parity diagnostics;
4. raw and translated shoelace areas;
5. bounding box and convex-hull diagnostics;
6. self-intersection diagnostics;
7. five-decimal representation diagnostics.

## Current evidence state

- Forensic harness exists and reconstructs the historical `uniquePoints` six-decimal identity and centroid/`atan2` ordering.
- Canonical polygon parity diagnostics are implemented.
- The workflow is wired to execute the clip-lineage probe and upload `a2-clip-lineage.json`.
- The workflow has both `push` and `pull_request` triggers plus `workflow_dispatch`.
- The available GitHub workflow-run connector exposes pull-request-triggered runs only; therefore an empty result from that connector does **not** prove that a push-triggered run did not execute.
- No retained execution artifact has been retrieved and inspected in this investigation session.
- Therefore the historical `~2.27e-13` producer/artifact lineage remains unidentified from retained execution evidence.
- This document must not be interpreted as A2 closure evidence.

## Closure rules

A2 is not closed unless the retained artifact establishes a common lineage from:

`historical input → producer stage → intermediate polygon representation → measurement path → approximately 2.27e-13`

If polygon parity fails, the forensic reconstruction must be corrected before interpreting area results.

If parity passes:

- large bbox + tiny ordinary area + materially larger translated area indicates shoelace cancellation;
- self-intersections indicate topology/order corruption;
- small bbox with both ordinary and translated areas tiny indicates genuine geometry collapse;
- collapse introduced only by five-decimal representation identifies quantization as the relevant representation boundary.

## Production lock

Until the gate is satisfied:

- do not change `MIN_AREA`;
- do not change normalization constants;
- do not modify production geometry authority;
- do not modify MapBin/GPU handling;
- do not promote the forensic branch;
- keep `SAFE TO DELETE = 0`;
- keep local convergence locked.

This is an evidence gate, not a production-fix proposal.

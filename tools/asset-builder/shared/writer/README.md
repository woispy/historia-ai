# Asset Writer

## Purpose

The Asset Writer is responsible for writing generated Historia AI assets to disk.

It provides a shared writing layer used by every Asset Pipeline.

---

## Responsibilities

- Ensure output directories exist.
- Write asset files.
- Remain independent from asset types.

---

## Supported Assets

- Geometry
- Province
- Terrain
- River
- Climate
- Culture
- Religion
- Road
- Building

---

## Does NOT

- Parse source data.
- Build assets.
- Generate manifests.

---

## Pipeline

Asset

↓

Asset Writer

↓

JSON Files
# Geometry Manifest

## Purpose

Generates runtime manifest files for Geometry Assets.

The manifest allows the Geometry Import Pipeline to discover generated assets
without hardcoding file names.

---

## Responsibilities

- Generate `manifest.js`
- Generate `index.js`

---

## Does NOT

- Parse geometry.
- Build geometry assets.
- Read GeoJSON.
- Normalize geometry.

---

## Pipeline

Geometry Assets

↓

Geometry Manifest Builder

↓

manifest.js

↓

index.js
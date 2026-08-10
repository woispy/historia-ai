# Geometry Asset Builder

## Purpose

Converts external geometry sources into Historia AI Geometry Assets.

The Geometry Builder is responsible for transforming raw geographic data into
runtime-ready geometry assets used by the Historia AI engine.

---

## Pipeline

Source Geometry

↓

Geometry Converter

↓

Geometry Normalizer

↓

Geometry Manifest Builder

↓

Geometry Assets

↓

Geometry Import Pipeline

↓

Runtime Geometry Repository

---

## Responsibilities

- Read GeoJSON source files.
- Normalize geometry data.
- Generate Historia Geometry Assets.
- Generate manifest.js.
- Generate index.js.

---

## Does NOT

- Render geometry.
- Load geometry into the game.
- Perform runtime validation.
- Manage repositories.

Those responsibilities belong to the Geometry Engine.

---

## Future Work

- MultiPolygon support
- Polygon simplification
- Geometry validation
- Coordinate projection
- Automatic bounds calculation
- Automatic center calculation
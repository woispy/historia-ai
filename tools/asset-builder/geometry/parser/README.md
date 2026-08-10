# Geometry Parser

## Purpose

The Parser converts raw GeoJSON geometry objects into provider-independent
Geometry Models.

The parser understands the GeoJSON specification but knows nothing about
Historia AI assets.

---

## Responsibilities

- Parse Polygon geometries.
- Parse MultiPolygon geometries.
- Return a normalized Geometry Model.

---

## Does NOT

- Calculate bounds.
- Calculate centers.
- Generate Geometry Assets.
- Write files.
- Read datasets.

Those responsibilities belong to other modules.

---

## Pipeline

GeoJSON Geometry

↓

Geometry Parser

↓

Geometry Model

↓

Geometry Builder

↓

Geometry Asset
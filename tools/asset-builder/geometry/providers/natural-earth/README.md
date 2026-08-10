# Natural Earth Provider

## Purpose

Provides access to Natural Earth source datasets for the Historia AI Asset Builder.

This module is responsible for locating and reading Natural Earth datasets.

---

## Responsibilities

- Read `manifest.json`
- Resolve dataset identifiers
- Load GeoJSON datasets
- Return raw source data

---

## Does NOT

- Normalize geometry
- Convert geometry
- Generate assets
- Write files

Those responsibilities belong to the Geometry Builder.

---

## Pipeline

Natural Earth Source

↓

Natural Earth Provider

↓

Geometry Converter

↓

Geometry Normalizer

↓

Geometry Assets
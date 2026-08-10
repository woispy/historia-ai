# Geometry Converter

## Purpose

The Converter orchestrates the Geometry Asset Build Pipeline.

It coordinates Providers, Parsers, Builders and Writers.

---

## Responsibilities

- Load source datasets.
- Execute the conversion pipeline.
- Write Geometry Assets.
- Return generated assets.

---

## Does NOT

- Parse GeoJSON.
- Calculate bounds.
- Calculate centers.
- Build metadata.
- Generate manifests.

Those responsibilities belong to dedicated modules.

---

## Pipeline

Provider

↓

Parser

↓

Builder

↓

Writer

↓

Geometry Assets
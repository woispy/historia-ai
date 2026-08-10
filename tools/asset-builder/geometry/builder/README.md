# Geometry Builder

## Purpose

The Builder converts parsed Geometry Models into Historia AI Geometry Assets.

It enriches raw geometry with metadata and calculated values required by
the game engine.

---

## Responsibilities

- Build Geometry Assets.
- Calculate bounds.
- Calculate centers.
- Build metadata.

---

## Does NOT

- Read GeoJSON.
- Parse provider-specific formats.
- Generate manifests.
- Write files.

---

## Pipeline

Geometry Model

↓

Geometry Builder

↓

Historia Geometry Asset
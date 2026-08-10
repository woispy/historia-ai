# Geometry Sources

## Purpose

This directory contains raw geometry sources used by the Historia AI
Asset Builder.

These files are NOT used directly by the game.

Only the Asset Builder is allowed to read files from this directory.

---

## Directory Structure

geometry/

├── natural-earth/

├── gadm/

├── osm/

└── ...

Each provider keeps its own directory.

---

## Rules

- Source files are considered read-only.
- Do not edit generated assets here.
- Generated assets belong to:

src/world/map/assets/

---

## Pipeline

Source Data

↓

Asset Builder

↓

Geometry Assets

↓

Geometry Import Pipeline

↓

Runtime Geometry Repository
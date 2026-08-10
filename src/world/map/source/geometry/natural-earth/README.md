# Natural Earth Geometry Source

## Purpose

This directory contains the original Natural Earth datasets used by the
Historia AI Asset Builder.

These files are considered the canonical source of geographic data and
must never be modified by the game itself.

The game never loads files from this directory directly.

Only the Asset Builder is allowed to read these datasets.

---

## Directory Structure

natural-earth/

├── datasets/

├── manifest.json

├── LICENSE.md

└── README.md

The original GeoJSON files are stored inside the datasets directory.

---

## Responsibilities

- Store original Natural Earth datasets.
- Preserve original filenames.
- Preserve original coordinate systems.
- Keep source data separated from generated assets.

---

## Output

The Asset Builder converts these datasets into:

src/world/map/assets/geometry/

The generated assets are consumed by the Geometry Import Pipeline.

---

## Rules

- Do not modify downloaded datasets.
- Do not manually edit generated Geometry Assets.
- Regenerate assets whenever the source datasets change.

---

## Future Datasets

Examples:

- admin-0-countries
- admin-1-states
- rivers
- lakes
- coastlines
- populated-places
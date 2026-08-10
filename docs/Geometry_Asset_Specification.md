# Geometry Asset Specification

Version: 1.0

Status: Draft

---

# Purpose

Geometry Assets describe the physical shape of provinces.

Geometry Assets contain no gameplay information.

Their only responsibility is to describe world geometry.

Geometry Assets are immutable.

---

# Responsibilities

Geometry Assets are responsible for:

- Province geometry
- Province position
- Polygon coordinates

Geometry Assets are NOT responsible for:

- Country ownership
- Population
- Religion
- Economy
- Diplomacy
- Terrain modifiers
- AI information

---

# Required Fields

Every Geometry Asset must contain:

| Field | Type | Required |
|-------|------|----------|
| provinceId | string | Yes |
| polygon | Array | Yes |
| position | Object | Yes |

---

# Geometry Format

```json
{
  "provinceId": "bursa",

  "polygon": [
    [100, 200],
    [120, 250],
    [180, 230]
  ],

  "position": {
    "x": 135,
    "y": 220
  }
}
```

---

# provinceId

Type

```
string
```

Requirements

- Unique
- Matches Province Repository id

Example

```json
"provinceId": "bursa"
```

---

# polygon

Type

```
Array<Point>
```

Requirements

- Minimum 3 points
- Cannot be empty

Example

```json
[
    [100,200],
    [120,250],
    [180,230]
]
```

---

# position

Type

```
Object
```

Required Fields

```text
x

y
```

Purpose

Represents the reference position of the province.

Used for:

- Camera focus
- Labels
- Selection effects
- Future gameplay systems

---

# Forbidden Fields

Geometry Assets must NEVER contain:

```text
owner

population

religion

culture

economy

city

army

terrainModifier

tax

development
```

Those belong to other systems.

---

# Optional Fields

Future versions may introduce:

```text
bounds

centroid

area

perimeter

version
```

Current Validator does not require them.

---

# Import Pipeline

```
Geometry Asset

↓

Geometry Loader

↓

Geometry Validator

↓

Geometry Normalizer

↓

Geometry Factory

↓

Geometry Repository
```

---

# Design Principles

- Geometry Assets are immutable.
- Geometry Assets are engine independent.
- Geometry Assets contain no gameplay state.
- Every Geometry Asset represents exactly one Province.

---

# Future Compatibility

Geometry Assets may originate from:

- GeoJSON
- SVG
- Binary Map
- Compiled Map

Every source must eventually produce the same Geometry Asset format.

---

# Terminology

Geometry Asset

Raw data loaded from the Assets directory.

Geometry Model

Runtime object created by GeometryFactory.

Geometry Repository

Runtime storage of Geometry Models.
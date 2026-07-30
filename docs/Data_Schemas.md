# Data Schemas

Version: 1.0

---

# Purpose

This document defines the official data schemas used throughout Historia AI.

Every scenario, save file, editor tool and engine module must follow these schemas.

The schemas described here represent the contract between game data and the engine.

---

# General Rules

- Every entity must have a permanent string identifier.
- Identifiers are immutable after release.
- References always use identifiers.
- Required fields must always exist.
- Optional fields may be omitted.
- Unknown fields should be ignored unless explicitly handled by the engine.

---

# Country Schema

Represents an independent political entity.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | ✅ | Permanent unique identifier |
| name | string | ✅ | Display name |
| title | string | ✅ | Political title shown to the player |
| government | string | ✅ | Government type used by game mechanics |
| capital | string | ✅ | Capital city identifier |
| culture | string | ✅ | Primary culture identifier |
| religion | string | ✅ | State religion identifier |
| color | string | ✅ | Primary map and UI color (HEX) |
| playable | boolean | ✅ | Whether the player can select this country |

Example

```json
{
  "id": "ottomans",
  "name": "Ottoman",
  "title": "Beylik",
  "government": "beylik",
  "capital": "sogut",
  "culture": "oghuz-turk",
  "religion": "sunni",
  "color": "#0F7A32",
  "playable": true
}
```

---

# Province Schema

Represents a province on the world map.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | ✅ | Permanent province identifier |
| name | string | ✅ | Province name |
| owner | string | ✅ | Country identifier |
| culture | string | ✅ | Primary culture |
| religion | string | ✅ | Primary religion |

Example

```json
{
  "id": "bithynia",
  "name": "Bithynia",
  "owner": "byzantium",
  "culture": "greek",
  "religion": "orthodox"
}
```

---

# City Schema

Represents a city.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | ✅ | Permanent city identifier |
| name | string | ✅ | City name |
| province | string | ✅ | Province identifier |
| owner | string | ✅ | Country identifier |
| population | integer | ❌ | Initial population |

Example

```json
{
  "id": "bursa",
  "name": "Bursa",
  "province": "bithynia",
  "owner": "byzantium",
  "population": 12000
}
```

---

# Army Schema

Represents an army on the map.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | string | ✅ | Permanent army identifier |
| owner | string | ✅ | Country identifier |
| location | string | ✅ | Current city identifier |
| name | string | ✅ | Army name |

Example

```json
{
  "id": "ottomans-army-001",
  "owner": "ottomans",
  "location": "sogut",
  "name": "Main Army"
}
```

---

# Color Standard

Country colors must be stored using hexadecimal RGB values.

Example

```
#0F7A32
#6A1B9A
#C62828
```

The color represents the visual identity of the country.

It should remain stable across maps, diplomacy screens, statistics and notifications whenever possible.

---

# References

Every relationship between entities must use identifiers.

Examples

```
Country -> Capital City

capital -> sogut
```

```
Province -> Owner

owner -> ottomans
```

```
City -> Province

province -> bithynia
```

```
Army -> Location

location -> bursa
```

---

# Future Extensions

Additional fields may be introduced in future schema versions.

Examples

Country

- ruler
- dynasty
- treasury
- legitimacy
- stability

Province

- climate
- terrain
- tradeGoods

City

- buildings
- prosperity
- fortLevel

Army

- commander
- morale
- supplies
- composition

The introduction of new fields must preserve backward compatibility whenever possible.

---

# Schema Versioning

Changes to field definitions require a schema version update.

ScenarioValidator should validate data against the active schema version.

---

# Conclusion

These schemas define the official structure of Historia AI game data.

All engine systems, tools, save files and scenarios should follow these contracts to ensure consistency and long-term compatibility.
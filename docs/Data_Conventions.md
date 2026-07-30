# Data Conventions

Version: 1.0

---

# Purpose

This document defines the data standards used throughout the Historia AI project.

Every scenario, save file, editor tool and engine module must follow these conventions.

Keeping these rules consistent ensures compatibility, maintainability and long-term scalability.

---

# Core Principles

Historia AI follows a data-driven architecture.

Game logic belongs to the engine.

Historical content belongs to data files.

Data should never contain executable code.

---

# File Format

Scenario data is stored as JSON.

Rules:

- UTF-8 encoding
- 2-space indentation
- Unix line endings (LF) preferred
- One root object or one root array per file

---

# Directory Structure

```
data/

scenarios/

1300/

1453/

1914/
```

Each scenario contains independent data files.

Example

```
1300/

scenario.json
countries.json
provinces.json
cities.json
armies.json
diplomacy.json
population.json
economy.json
religions.json
cultures.json
laws.json
```

---

# Naming Convention

File names use:

- lowercase
- plural form when storing collections
- kebab-case if multiple words are required

Examples

```
countries.json
trade-routes.json
historical-events.json
```

---

# Identifier Rules

Every game entity has a permanent string identifier.

Identifiers must:

- be unique
- never change after release
- contain only lowercase letters, numbers and hyphens
- never depend on array position

Examples

```
ottomans
byzantium
karamanids

bursa
iznik
ankara

ottomans-army-001
```

Invalid examples

```
Country01
Army #1
Province A
```

---

# References

Relationships are always created using identifiers.

Correct

```json
{
  "owner": "ottomans"
}
```

Incorrect

```json
{
  "owner": 3
}
```

Array indexes must never be used as references.

---

# Collections

Collections are stored as arrays.

Example

```json
[
  {
    "id": "ottomans"
  }
]
```

Objects should not be keyed by identifiers unless a specific system explicitly requires it.

---

# Required Fields

Every entity should contain an identifier.

Example

```json
{
  "id": "ottomans"
}
```

Other required fields depend on the entity type.

---

# Versioning

Scenario metadata should include a version.

Example

```json
{
  "version": 1
}
```

Version numbers increase only when the data structure changes.

---

# Validation

Scenario validation checks:

- duplicate identifiers
- missing references
- invalid identifiers
- required fields
- incompatible versions

Validation should report problems.

It should never silently modify data.

---

# Backward Compatibility

Whenever possible, newer engine versions should preserve compatibility with older scenario versions.

If compatibility cannot be maintained, the engine should clearly report the incompatibility.

---

# Future Extensions

Additional data files may be introduced without changing the existing architecture.

Examples

- trade-routes.json
- climate.json
- technologies.json
- events.json
- characters.json

The engine should remain extensible.

---

# Conclusion

Consistent data conventions are essential for a scalable historical simulation engine.

Every system in Historia AI relies on these standards to ensure interoperability between the engine, scenarios, tools and future community content.
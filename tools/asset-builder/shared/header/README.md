# Asset Header

## Purpose

Builds the standard header shared by every Historia AI Asset.

The header contains generation metadata and version information.

---

## Responsibilities

- Build immutable Asset Headers.
- Store asset version.
- Store provider information.
- Store dataset information.
- Store generation timestamp.

---

## Header Structure

```javascript
{
  assetType: "...",

  assetVersion: 1,

  generator: "Historia Asset Builder",

  provider: "...",

  dataset: "...",

  generatedAt: "..."
}
```

---

## Used By

- Geometry Assets
- Province Assets
- Terrain Assets
- River Assets
- Climate Assets
- Culture Assets
- Religion Assets
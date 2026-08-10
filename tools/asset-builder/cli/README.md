# Asset Builder CLI

## Purpose

The CLI is the executable entry point of the Historia AI Asset Builder.

It starts the complete Asset Build Pipeline.

---

## Usage

```bash
node tools/asset-builder/cli/build-assets.js
```

or

```bash
npm run build:assets
```

---

## Responsibilities

- Start Asset Builder.
- Return process exit codes.
- Report fatal build errors.

---

## Does NOT

- Parse Geometry.
- Build Assets.
- Write Assets.
- Generate Manifests.

Those responsibilities belong to the Asset Builder modules.
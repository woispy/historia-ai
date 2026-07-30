# Historia AI

Historia AI is a next-generation grand strategy game and simulation engine inspired by historical sandbox games while being designed with a fully modular architecture.

The long-term vision of the project is to build a scalable historical simulation platform capable of supporting multiple historical scenarios, intelligent AI systems, dynamic diplomacy, economy, warfare, espionage, and realistic world simulation.

This repository currently contains the core engine and the rendering infrastructure that will serve as the foundation of the project.

---

# Vision

Historia AI is designed around one fundamental idea:

> Build the engine first. Build the game on top of it.

Instead of creating a single historical game, Historia AI aims to become a reusable simulation engine capable of supporting multiple scenarios and historical periods.

Examples:

- 1300 - Rise of the Ottomans
- 1453 - Fall of Constantinople
- 1914 - The Great War
- Community-created historical scenarios

---

# Current Development Status

Current milestone:

**Milestone 2A — Engine Foundation**

Completed systems include:

- World Model
- Country System
- Province System
- Query Layer
- Mutation Layer
- Turn Processing
- Timeline System
- Render Engine Foundation
- Map Module Foundation

Work in progress:

- Documentation
- Scenario System
- SVG Map Renderer

---

# Technology Stack

- React
- Vite
- JavaScript (ES Modules)

Future technologies may include:

- SVG Rendering Engine
- SQLite
- Node.js Tools
- Map Editor
- AI-assisted Content Pipeline

---

# Project Structure

```
historia-ai/

docs/
public/
src/
data/

package.json
vite.config.js
```

---

# Documentation

Project documentation is located inside the `docs/` directory.

It contains both game design documents and technical architecture documents.

---

# Development Principles

The project follows several engineering principles:

- Layered Architecture
- Modular Design
- Single Responsibility Principle
- Query / Mutation Separation
- Data-driven World Simulation
- Incremental Development
- Small Sprint Workflow

---

# Running the Project

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

---

# Project Status

Historia AI is currently under active development.

The architecture is intentionally being built before gameplay systems to ensure long-term maintainability and scalability.
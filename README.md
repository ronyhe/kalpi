# Kalpi

A didactical implementation of the **Bader-Ofer method** (חוק בדר-עופר) — the seat allocation algorithm used for the Israeli Parliament (Knesset).

This project is a public service tool meant to help people understand how their electoral system works.

## The Bader-Ofer Method

This library implements the [Bader-Ofer method](./BADER_OFER_METHOD.md) for allocating Knesset seats, including support for surplus agreements (הסכמי עודפים).

## Project Direction

Kalpi is expanding into a bilingual educational web app for curious citizens and teachers. The goal is to help people understand how Israeli election votes become Knesset seats, starting from real election data and explaining the process step by step.

Core decisions:

- Use npm workspaces.
- Split the project into core, data, CLI, and web packages.
- Keep the election engine independent from the web UI.
- Keep real election data as JSON in a separate dependency-free data package.
- Use the data package from core tests, the CLI, and the web app.
- Keep the CLI as a thin adapter, even though it is not the primary product surface, to keep the core independent and scriptable.
- Return structured explanation steps as part of election results.
- Build a static React + MUI frontend with Vite.
- Support Hebrew and English.
- Use real election data as the starting point for exploration.
- Avoid a backend for now.
- Keep scenario state serializable so shareable URLs remain possible later.

## Usage

```bash
npm install
npm run cli -- packages/data/knesset25.json
```

The CLI accepts a JSON file describing an election (votes per party, seat count, threshold) and prints the resulting seat allocation.

## Roadmap

1. [x] Split into core, data, CLI, and web packages.
2. [x] Preserve the current CLI behavior.
3. Extend results with structured explanation steps.
4. Build the first web flow around real Knesset election data.
5. Add scenario editing later.
6. Add coalition creation later.

## Development

```bash
npm run verify # Format check + lint + typecheck + tests
```

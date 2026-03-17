# Kalpi

A didactical implementation of the **Bader-Ofer method** (חוק בדר-עופר) — the seat allocation algorithm used for the Israeli Parliament (Knesset).

This project is a public service tool meant to help people understand how their electoral system works.

## The Bader-Ofer Method

This library implements the [Bader-Ofer method](./BADER_OFER_METHOD.md) for allocating Knesset seats, including support for surplus agreements (הסכמי עודפים).

## Usage

```bash
npm install
npm run cli -- test/knesset25.json
```

The CLI accepts a JSON file describing an election (votes per party, seat count, threshold) and prints the resulting seat allocation.

## Development

```bash
npm run verify # Format check + lint + typecheck + tests
```

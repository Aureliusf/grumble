# 11 — Stack and architecture

> **Superseded for the hackathon.** The team chose Nuxt + Nuxt UI with Nitro routes; see `14-frontend-nuxt.md`, `15-backend-nitro.md` and `16-api-contract.md`. This file remains as the reference for the single-store architecture and the cut list, which still apply.

Optimized for: one or two people, a weekend, a demo that runs with no network, and a codebase a judge can read.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Vite + React 18 + TypeScript | fast, boring, everyone knows it |
| Styling | Tailwind | speed; the character and palette are a handful of tokens |
| Charts | Recharts | the simulator is one area chart with two series and a band |
| State | Zustand, one store | the food graph + the log; persisted to localStorage via `persist` |
| Validation | Ajv against `data/food-graph.schema.json` | the schema is the contract; no second type source |
| i18n | `react-i18next` with JSON dictionaries | three languages, keys from `09` |
| Tests | Vitest | simulator math, schema validation, suggestion rules |
| Optional LLM | `@anthropic-ai/sdk`, browser, `VITE_ANTHROPIC_KEY` | intake LLM mode only; app must work without it |
| Data pipeline | Python 3, pandas, numpy | already written; see `08` |

No backend. No auth. No database. The "coach view" is a route behind a header toggle.

## Directory layout

```
grumble/
├── specs/                    this directory, unchanged
├── public/data/              copies of specs/data/*.json served statically
├── src/
│   ├── main.tsx, App.tsx     router: /intake /plan /whatif /today /table /coach
│   ├── store/
│   │   ├── graph.ts          food graph store + validation + persistence
│   │   └── log.ts            days[], tables[], donations[], coach_notes[]
│   ├── graph/
│   │   ├── schema.ts         Ajv compile of the JSON schema; types via json-schema-to-ts
│   │   ├── procedures.ts     one function per standard kind (02)
│   │   ├── status.ts         day/week green-amber-red (02)
│   │   └── time.ts           resolve clock vs relative-to-sleep (02, 04)
│   ├── sim/
│   │   ├── params.ts         loads simulator-params.json
│   │   ├── curve.ts          peakDelta(), shape(), curve(), iauc()
│   │   └── moves.ts          portion rules table (04) + moves vocabulary ids (09)
│   ├── intake/
│   │   ├── stages.ts         the state machine (03)
│   │   ├── rules.ts          standard proposal rules (03)
│   │   └── llm.ts            optional Claude stage runner
│   ├── today/
│   │   ├── suggest.ts        priority rules (05)
│   │   └── Today.tsx
│   ├── table/                Table.tsx, Menu.tsx, Fund.tsx, fixtures (06)
│   ├── coach/                Coach.tsx, reasons.ts (07)
│   ├── whatif/               WhatIf.tsx (04)
│   ├── plan/                 Plan.tsx — renders the graph (02)
│   ├── character/            Grumble.tsx: three states, SVG
│   ├── i18n/                 en.json es.json ht.json
│   └── fixtures/             personas → demo users; tables.json; coach-rows.json
├── DECISIONS.md
└── package.json
```

## Data flow

```
intake ──writes──▶ food graph ◀──reads── plan, whatif, today, table, coach
                        │
today ──writes──▶ log.days ──▶ procedures ──▶ status ──▶ today (nudge), coach (list)
table ──writes──▶ log.tables, log.donations
```

The food graph is the plan. The log is what happened. Nothing else is state.

## Demo users

On first load with an empty store, a "Who are you today?" screen offers the four personas plus "someone new" (intake). Picking a persona loads their example graph (Marisol's and the founder's ship; Jean's and Tony's are produced by running scripted intake with the answers in `10` and checking the result in as fixtures) and a seeded log from their synthetic daily rows (last 14 days before "today").

"Today" in the demo is a fixed date set in `fixtures/clock.ts` so the demo is reproducible: a Tuesday, week 4 of Marisol's program.

## Performance and size

`dishes.json` is ~40 KB, `personas.json` ~20 KB, `simulator-params.json` ~2 KB. Everything loads in the first paint. No lazy routes needed.

## Accessibility and device

Phone-first (375 px), works on a laptop. Faces in the check-in have text labels. Minimum font 16 px on the check-in; Marisol is 71. Contrast AA. Spanish strings are longer; test every button at 375 px in es.

## What to cut if time runs out, in order

1. Coach person drawer.
2. LLM intake mode.
3. Creole beyond the check-in.
4. Fund-a-week ledger (keep the three buttons).
5. Band shading on the simulator (keep two lines).

Never cut: the simulator's two curves, the walk toggle, the table card on Tuesday, Spanish on the demo path.

# 00 — The five-hour plan

Two builders, one deck, one demo. Read this before anything else in the directory. Where this file and another spec disagree, this file wins for today.

## The cut

**Demo = four screens, Marisol only, EN/ES toggle, one repo.**

| Screen | Route | Owner | Spec |
|---|---|---|---|
| Plan (her food graph) | `/plan` | Miguel | `14` §Plan |
| What if (two curves) | `/whatif` | Miguel (UI) + Aurelio (`/api/simulate`) | `04`, `14`, `15` |
| Today (check-in + the card) | `/today` | Miguel (UI) + Aurelio (`/api/today`) | `05`, `14`, `15` |
| Versailles table | `/table` | Miguel (UI) + Aurelio (`/api/tables`, `/api/fund`) | `06`, `14`, `15` |

**Cut for today:** intake (the plan screen stands in; say "intake took five minutes"), coach view (one slide), LLM anything, Creole, photos, similar-meal matching, auth, a database, deploys beyond `nuxt dev` on the demo laptop.

## One repo, two folders

```
grumble/
├── app/        Miguel — pages, components, composables, i18n, theme
├── server/     Aurelio — Nitro routes under server/api, data under server/data
├── shared/     both — types.ts (the API contract, 16-api-contract.md)
└── specs/      this directory
```

The backend is Nuxt's own Nitro server (`server/api/*.ts`). No separate service, no CORS, one `npm run dev`. Aurelio writes TypeScript against `shared/types.ts`; if he'd rather do the math in Python he can, but the routes that serve it are Nitro.

**The contract is `16-api-contract.md` and `shared/types.ts`.** Agree on it in the first 20 minutes, then neither of you blocks the other: Miguel builds against the fixture responses in `16`; Aurelio makes the routes return the real thing.

## Clock

| Time | Miguel | Aurelio | Deck |
|---|---|---|---|
| 0:00–0:20 | `npx nuxi init`, Nuxt UI, theme tokens from `14`, agree `shared/types.ts` | Copy `specs/data/*.json` into `server/data/`, stub all routes returning fixtures from `16` | — |
| 0:20–1:30 | `/whatif` page with `GlucoseCurve.vue` against the stub | `/api/simulate` real math from `simulator-params.json` (`04`); `/api/dishes` | Chart 1–2 from `12` |
| 1:30–2:30 | `/today` check-in + card | `/api/today` rule table (`05`), `/api/checkin` | Chart 3–4 |
| 2:30–3:30 | `/table` three tabs | `/api/tables`, `/api/tables/:id/seat`, `/api/fund` with in-memory state | Slides around the charts |
| 3:30–4:00 | `/plan`, EN/ES pass, character states | Walk the demo path against every route; fix | Script (`13`) |
| 4:00–4:40 | Dry run ×2 together, fix only what breaks | | |
| 4:40–5:00 | Record backup video on a phone. Freeze. | | |

## Pre-agreed answers to the questions that will come up

- Numbers on screen come from `simulator-params.json` via the API, never typed into a component.
- Demo date is **Tuesday, week 4** (`server/data/clock.json`). The table card fires because it's Tuesday.
- Marisol's log is seeded so yesterday was amber (dinner at 21:40) and she has three mood-2 days this week. The nudge line shows; the coach badge exists but there is no coach screen.
- Spanish strings live in `app/i18n/es.json`; copy comes from `09`. If a string is missing in Spanish it shows English, never a key.
- If the API is down the page shows the fixture. Nothing in the demo can be blank.
- Walk slider: 10, 20 and 30 show the same number. That is deliberate. Don't "fix" it.

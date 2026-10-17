# Backend decisions

2026-10-17. Each entry says where the backend departs from or fills in the specs (`04`, `05`, `15`, `16`).

## Agreed with Aurelio

- **Peak is the top of the drawn curve.** `shape_fraction_of_peak` tops out at 0.786, so the drawn curve never reaches baseline + regression delta. The tiles read the drawn curve so chart and numbers agree. Marisol's hero comparison is 188 vs 135 mg/dL and -80% over 2 h (was 207 / 143 / -75%). iAUC 5716 matches the OLS iAUC cross-check (5788).
- **Beans-first changes the number.** Fiber coefficient x1.5 applies. The grumble curve for vaca frita is one cup + beans first + walk 10 + earlier.
- **The move's dinner time is 19:00 for Marisol** (sleep_start - 4.5 h, half hour). The nudge says "Tonight, seven." Her own standard `dinner-by-8` (20:00) stays as she wrote it.
- **Red week and coach alert always go together.** `week.coach_alerted` equals `week.red`. `GET /api/coach/alerts` lists everyone in a red week.
- **Two demo people.** Marisol (N0771) gets the Tuesday table card. Her log has one low-mood day in the trailing week, so a mood-2 tap on demo day keeps her out of red. Jean (N1904, night shift) has three low-mood days, so he gets the red card and the coach alert. His graph is `seed/graph.N1904.json`.
- **server/ is a standalone Nitro app today** (`npm run dev` inside `server/`). Its layout (`api/`, `utils/`) is Nuxt's own `server/` directory, so once the frontend branch merges, Nuxt serves these routes on the same port with no proxy.

## Filled in where the spec was silent or contradicted itself

- `n_dinners` is the group's own dinner count from `meal_responses.csv` (prediabetes 1,585). 5,472 was the total across all groups. A test checks it against the CSV.
- `back_to_baseline_min` is `null` when the curve is still 3 mg/dL or more above baseline at 240 min. That is the case for Marisol's late vaca frita.
- `same_as_ten` is true for walk 20 and 30, not 10.
- The late effect is always the group-stratified dinner effect (15), including for non-dinner dishes.
- "First three moves" counts dish moves only; `walk10` and `earlier` are added on top.
- Component keywords match whole words, so "pan" doesn't hit "pancake". Added the protein words vaca, res, carne, picadillo, ropa vieja, lechon, palomilla and gallina, plus guayaba as sweet and spaghetti as starch.
- The seeded logs are hand-written. N0771's real `synthetic_daily` rows have no-log streaks that would turn her week red.
- The menu uses real dishes.json rows only, so nothing is invented. Black bean soup replaces sopa de pollo, and grilled chicken with black beans replaces pollo a la plancha. Numbers come from the portion rules.
- Hosts' `years_out` comes from personas.json (Tony 1.2 rounds to 1), not the fixture's 4.
- `POST /api/today/:id/action` returns `{ ok, fed, today }`, covering both `15` and `16`. `skip` drops the card so the next rule fires.
- `?lang=en|es` only, default `es`. Spanish copy follows the `16` fixtures (tú).
- Restaurant cards keep the first known venue and suggest the person's starred dinner with localized portion and order moves. Raw graph `order`/`avoid` prose stays in the graph, but is not used as advice because it contains restrictions and untranslated English.
- Seating is idempotent. Today's check-in mood counts toward the trailing week.
- Clock week stays 4 as `00` says; the synthetic data would call 2025-01-14 week 5.
- `.npmrc` sets `legacy-peer-deps`: npm 10 crashes resolving vitest's optional peers. `vite` is pinned explicitly for that reason.

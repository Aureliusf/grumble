# 15 — Backend: Nitro routes

Owner: Aurelio. Everything lives in `server/` of the Nuxt app. TypeScript, `defineEventHandler`, in-memory state, data from `server/data/` (copied from `specs/data/`). The contract is `16-api-contract.md`; this file says how each route gets its answer.

Aurelio's planning document (provenance lanes, component model, evidence levels, cuisine families, similar-meal matching, phases) is the Phase 2 roadmap and stays in the repo as `specs/roadmap-backend.md`. Three of its ideas ship today: **evidence levels on every card**, **the component model for moves**, and **"examples, not predictions" wording**. The rest waits.

## Files

```
server/
├── data/
│   ├── dishes.json                       from specs/data
│   ├── simulator-params.json             from specs/data
│   ├── example-food-graph.marisol.json   from specs/data
│   ├── personas.json                     from specs/data (Tony hosts)
│   ├── clock.json                        { "today": "2025-01-14", "weekday": "Tuesday", "week": 4 }
│   ├── log.marisol.json                  14 seeded days (below)
│   └── tables.json                       the four Tuesdays from 16
├── utils/
│   ├── state.ts        loads data once; holds tables, ledger, checkins, seats; reset on boot
│   ├── time.ts         resolveLate(time, schedule), hoursBeforeSleep()
│   ├── components.ts   dish name → components (starchy base, beans, protein, fried, sweet, drink)
│   ├── moves.ts        moves for a dish from components (09 vocabulary) + portion rules (04)
│   ├── sim.ts          peakDelta, shape, curve, iauc, band
│   ├── rules.ts        the Today priority table (05)
│   ├── copy.ts         card templates en/es (09 fixed lines + moves)
│   └── evidence.ts     evidence level per card/route
└── api/
    ├── clock.get.ts
    ├── graph/[id].get.ts
    ├── dishes.get.ts
    ├── simulate.post.ts
    ├── today/[id].get.ts
    ├── today/[id]/action.post.ts
    ├── checkin/[id].post.ts
    ├── tables.get.ts
    ├── tables.post.ts
    ├── tables/menu.get.ts
    ├── tables/[id]/seat.post.ts
    ├── fund.get.ts
    └── fund.post.ts
```

## `components.ts` — the component model

Map each of the 127 dish names to components by keyword. This is Aurelio's idea from the planning doc and it's what makes moves generic:

| Component | Match (case-insensitive, en/es/ht) |
|---|---|
| `starch_rice` | rice, arroz, moros, congrí, diri, gallo pinto, chow, fried rice |
| `starch_plantain` | plantain, maduros, tostones, bannann, mofongo, mangu |
| `starch_bread` | bread, pan, toast, sandwich, arepa, baleada, pupusa, roti, biscuit, dumpling, festival, bammy, patty, pate, empanada |
| `starch_other` | yuca, potato, fries, pasta, noodle, grits, mac |
| `beans` | beans, frijoles, pwa, gandules, lentil, chickpea, peas |
| `protein` | chicken, pollo, beef, steak, pork, pernil, griot, fish, pescado, poisson, shrimp, egg, saltfish, goat, turkey |
| `fried` | fried, frita, kode, chicharr, croqueta, tostones, pastelito |
| `sweet` | cake, flan, tres leches, pastelito, dulce, sundae, churro, pudding |
| `sweet_drink` | soda, juice, jugo, guarapo, batido, sweet tea, malta |
| `coffee` | cafecito, café, coffee, colada, cortadito |
| `soup` | soup, sopa, sancocho, ajiaco, pho, caldo, joumou, ramen |
| `vegetables` | salad, ensalada, legim, collards, okra, cabbage, vegetables |

Store the result as `components: string[]` on each dish in memory (and add it to `dishes.json` if there's time: a one-off script).

## `moves.ts` — from components to the move

Order matters; take the first three that apply. Each has an id from `09`, copy en/es, and a portion effect for `sim.ts`:

| Condition | Move id | Portion effect |
|---|---|---|
| `starch_rice` and carbs ≥ 60 | `one-cup` | carbs × 0.65, calories × 0.8 |
| `starch_plantain` | `two-not-four` | carbs − 25, calories − 110 |
| `beans` present | `beans-first` | fiber coefficient × 1.5 (order effect; label "estimated") |
| `protein` and any starch, no beans | `protein-first` | fiber coefficient × 1.25 |
| fiber < 5 and a starch | `add-beans` | fiber + 8, protein + 7, carbs + 20 |
| `sweet` or `fried` and typical_meal_type is snack/breakfast | `morning-not-night` | late = false |
| calories > 900 | `share-it` | all macros × 0.5 |
| `soup` | `soup-counts` | none |
| `mediterranean_style` and fiber ≥ 6 | `as-is` | none |
| always, dinner | `walk10` | walk_min = 10 |
| always, when request time is late | `earlier` | late = false |

`coffee` alone (cafecito) → `as-is`. Never a move that removes the dish.

## `sim.ts` — the math (`04-simulator.md`, params from `simulator-params.json`)

```ts
peakDelta(d, late, walkMin, group, fiberMult=1) =
  P.ols.intercept + P.ols.per_g_carbs*d.carbs_g + P.ols.per_g_fiber*d.fiber_g*fiberMult
  + P.ols.per_g_protein*d.protein_g + P.ols.per_g_fat*d.fat_g
  + (group==='prediabetes' ? P.ols.prediabetes : 0) + (group==='type 2 diabetes' ? P.ols.type_2_diabetes : 0)
  + P.ols.per_mg_dl_baseline * P.baseline_mg_dl[group]
  + (late ? P.dinner_effects_by_group[group].late_dinner_peak_delta : 0)
  + P.dinner_effects_by_group[group].walk_peak_delta * Math.min(walkMin,10)/10
```

Note: the pooled `late_dinner_flag` and `per_min_walk_capped_30` terms are **replaced** by the group-stratified dinner effects, not added on top. Walk saturates at 10 by construction; `same_as_ten = walk_min >= 10`.

```ts
shape(t)  = piecewise-linear through P.shape_fraction_of_peak at t*60/P.time_to_peak_min[group]
curve(t)  = baseline + peakDelta * shape(t)        // t = 0..240 step 5
band(t)   = curve ± 0.25 * peakDelta * shape(t)    // ±25% until the real p25/p75 exist
iauc_2h   = trapezoid of max(curve-baseline,0) over 0..120
back_to_baseline_min = first t where curve - baseline < 3 (after the peak)
n_dinners = count of dinner rows for the group in meal_responses.csv (prediabetes 5,472 overall; per group: compute once, hardcode in params if the CSV isn't shipped)
```

Hand check (must match, ±1): Marisol, vaca frita (85.6 / 11.7 / 38.9 / 25.3), 21:30, walk 0 → peak delta 85.8, peak 207, iauc 5721. Same plate 19:00 + walk 10 → delta 38.8. With `one-cup` → 21.6, peak 143, iauc −75% vs the first.

`resolveLate(time, schedule)`: late = clock time ≥ 20:00 or < 04:00 **when** `schedule.sleep_start ≥ 23:00` and type ≠ night shift; otherwise late = within 3.5 h before `sleep_start`. Jean fixture: sleep 09:00, dinner 02:00 → not late; 06:00 → late.

The `grumble` curve in the response: time = `sleep_start − 4.5 h` rounded to the half hour (Marisol: 19:00), walk 10, move true.

## `rules.ts` — Today (`05-daily-grumble.md`)

Implement the priority table as an ordered array of `{ id, when(ctx), card(ctx) }`. `ctx` = graph + clock + today's check-in + the seeded log. For the demo only these must fire:

- `p1-red` when `week.red` — seeded log makes this **false** (three mood-2 days is a reason but not red by itself; red needs three *plus* a no-log streak or CGM). Keep it false so the table card shows.
- `p2-table` when weekday is Tuesday and `open_to_table` → the table card (fixture in `16`). Action `seat` → seats Marisol at `t1` and returns the updated response with a `fed` hint.
- `p3-buddy` when company is `alone` and buddy exists → "Vaca frita, siete, frijoles primero. Y escríbele a Carmen para la caminata. Diez minutos, hasta la esquina de Carmen y de vuelta."
- `p6-place` when company is `out` → Versailles order from `places`.
- `p7-light` when energy ≤ 2 or hunger ≤ 2 → sancocho card.
- `p10-default` otherwise → starred dinner with move, time 19:00, walk 10.

`nudge` from the seeded log: yesterday's last meal 21:40 → "Nueve cuarenta anoche. No es un crimen. Hoy, a las ocho." / en per `09`.

`evidence`: `p2-table` and `p3-buddy` are `observed pattern` (coaching + walk effects); `p6`/`p7`/`p10` are `rule based`.

## Seeded log — `log.marisol.json`

14 days ending the day before the demo clock. Pull from `synthetic_daily.csv` for N0771 if the challenge data is on the machine; otherwise hand-write: last_ate between 21:20 and 22:30 on 11 of 14 days, after-dinner walk on 3 days, mood 2 on three of the last five days, food logged every day. Yesterday: last_ate 21:40, no walk, mood 2 → status amber.

## Tables, fund — `state.ts`

Plain objects, mutated by the POST routes, reset on boot. `seat` decrements `seats_left` and sets `mine`. `POST /api/tables` fills `t4`'s host with the person's display name and `years_out` from the graph. `POST /api/fund` adds to the ledger and attaches `name` as `funded_by` to the first unfunded table.

## Menu

Compute the five menu rows from `dishes.json` + `moves.ts` portion effects. Two of the five plates (pescado a la plancha, sopa de pollo) aren't in the dish list; add them to `server/data/dishes.extra.json` with reasonable numbers and `source: "estimated"`.

## Language

Every route that returns copy reads `?lang=` (default `es`) and uses `copy.ts`. Card titles and bodies come back localized; the frontend never builds sentences from parts.

## Order of work

1. `state.ts` loading data + all 13 routes returning the fixtures from `16` (30 min). Tell Miguel.
2. `sim.ts` + `simulate.post.ts` real, hand check passes (60 min).
3. `components.ts`, `moves.ts`, `copy.ts`, `rules.ts`, `today` and `checkin` real (60 min).
4. tables, menu, fund with mutation (45 min).
5. Walk the demo path from `13` hitting every route; fix (rest).

If time is short, step 4 can stay on fixtures; the seat button then flips locally in the UI.

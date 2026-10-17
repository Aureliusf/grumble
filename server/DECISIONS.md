# Backend decisions

2026-10-17. Each entry says where the backend departs from or fills in the specs (`04`, `05`, `15`, `16`).

## Agreed with Aurelio

- **Peak is the top of the drawn curve.** `shape_fraction_of_peak` tops out at 0.786, so the drawn curve never reaches baseline + regression delta. The tiles read the drawn curve so chart and numbers agree. Marisol's hero comparison is 188 vs 135 mg/dL and -80% over 2 h (was 207 / 143 / -75%). iAUC 5716 matches the OLS iAUC cross-check (5788).
- **Beans-first changes the number.** Fiber coefficient x1.5 applies. The grumble curve for vaca frita is one cup + beans first + walk 10 + earlier.
- **Tonight's dinner time is the person's own `last_meal_by` standard** (Marisol 20:00, Jean 3.5 h before his 09:00 sleep, so 05:30); sleep_start - 4.5 h only when there is no standard. The cards, the nudge and the What-if move all use it. The late boundary is now on time (late = after 20:00, or less than 3.5 h before sleep), so a dinner at exactly the standard is not penalized. Every relative dinner standard is 3.5 h before sleep (04), intake included, so a dinner on the standard sits on the late boundary and is never penalized.
- **Red week and coach alert always go together.** `week.coach_alerted` equals `week.red`. `GET /api/coach/alerts` lists everyone in a red week.
- **Two demo people.** Marisol (N0771) gets the Tuesday table card. Her log has one low-mood day in the trailing week, so a mood-2 tap on demo day keeps her out of red. Jean (N1904, night shift) has three low-mood days, so he gets the red card and the coach alert. His graph is `seed/graph.N1904.json`.
- **server/ is a standalone Nitro app today** (`npm run dev` inside `server/`). Its layout (`api/`, `utils/`) is Nuxt's own `server/` directory, so once the frontend branch merges, Nuxt serves these routes on the same port with no proxy.

## Filled in where the spec was silent or contradicted itself

- `n_dinners` is the group's own dinner count from `meal_responses.csv` (prediabetes 1,585). 5,472 was the total across all groups. A test checks it against the CSV.
- `back_to_baseline_min` is always a number. The curve keeps falling past the 240-min chart, so Marisol's late vaca frita reads 255 rather than blank.
- `same_as_ten` is true for walk 20 and 30, not 10.
- Contract kept for the frontend: the open Tuesday has `host: { name: "—", years_out: 0 }` (16), and `funded_by` comes back localized.
- Dinner and place cards carry the move in `card.move` only; `body` no longer repeats it, so the frontend shows it once.
- Routes use Nitro's auto-imported h3 helpers instead of importing `h3`, so standalone Nitro and Nuxt share one h3.
- One formula: `server/utils/sim.ts` imports `peakDelta` and `shapeAt` from `shared/simulate.ts`, the same code the day view and spike bar run in the browser. What-if passes `dinner: true` (its slider is "Dinner at"), so it keeps the group dinner effects; beans-first is passed as 1.5x the fiber grams, which is identical in a linear model. The server keeps its own `resolveLate` (the 20:00 boundary is on time); the day view still uses `latenessFor` (8 pm counts as late) until that line in `shared/` changes.
- "First three moves" counts dish moves only; `walk10` and `earlier` are added on top.
- Component keywords match whole words, so "pan" doesn't hit "pancake". Added the protein words vaca, res, carne, picadillo, ropa vieja, lechon, palomilla and gallina, plus guayaba as sweet and spaghetti as starch.
- The seeded logs are hand-written. N0771's real `synthetic_daily` rows have no-log streaks that would turn her week red.
- The menu uses real dishes.json rows only, so nothing is invented. Black bean soup replaces sopa de pollo, and grilled chicken with black beans replaces pollo a la plancha. Numbers come from the portion rules.
- Hosts' `years_out` comes from personas.json, except Tony: the demo ages him to 4 years out to match the 16 fixture and 06 (hosts are further out), the same way 10 ages Dani.
- `POST /api/today/:id/action` returns `{ ok, fed, today }`, covering both `15` and `16`. `skip` drops the card so the next rule fires.
- `?lang=en|es` only, default `es`. Spanish copy follows the `16` fixtures (tú).
- Restaurant cards keep the first known venue and suggest the person's starred dinner with localized portion and order moves. Raw graph `order`/`avoid` prose stays in the graph, but is not used as advice because it contains restrictions and untranslated English.
- Seating is idempotent. Today's check-in mood counts toward the trailing week.
- Clock week stays 4 as `00` says; the synthetic data would call 2025-01-14 week 5.
- `.npmrc` sets `legacy-peer-deps`: npm 10 crashes resolving vitest's optional peers. `vite` is pinned explicitly for that reason.

## Money: prices, plate costs and the weekly food budget (2026-10-17)

- **Price source is USDA ERS Purchase to Plate, not BLS Average Price Data.** BLS AP prices raw or dry foods per pound and covers about half of `data/components.json`: no fish, shrimp, plantain, yuca, quinoa or cooked beans, and every item would need a cooking-yield factor we would have to pick. PP-NAP prices foods as eaten, per 100 edible grams, and has all 42 components. Source: https://www.ers.usda.gov/data-products/purchase-to-plate, file "Purchase to Plate - National Average Prices for NHANES (CSV)", last updated 2023-03-08, series PP-NAP 2017/2018 (Circana/IRI InfoScan 2017-18 scanner data). Each component records its FNDDS `food_code`, the FNDDS description and the 2017/18 price.
- **Prices are brought to December 2024 with BLS CPI-U Food at home**, U.S. city average, not seasonally adjusted, series CUUR0000SAF11 (https://data.bls.gov/timeseries/CUUR0000SAF11): 2017 and 2018 annual averages 238.589 and 239.661, December 2024 308.380, factor 1.2896. December 2024 is the last month before the demo date (2025-01-14). Cross-check against BLS AP December 2024: white rice $1.032/lb dry is about $0.09 per 100 g cooked; PP-NAP gives $0.116.
- `data/scripts/prices.py` writes the prices into `components.json` from the downloaded CSV. Nothing is fetched at runtime. Brown rice uses the "NS as to fat" code because the "no added fat" code is priced from ready-to-eat cups ($0.74 vs $0.24 per 100 g). Both fried plantains share PP-NAP's one "plantain, cooked with oil" price. Yuca is priced cooked (PP-NAP has no raw cassava) while its nutrients are raw.
- **Dish cost is the plate as Grumble suggests it**, estimated in `server/utils/cost.ts`: words in the dish name map to a component and a home portion (meat or fish 3 oz, a starch 1 cup, beans 1/2 cup, bread 2 slices, eggs 2 large, cheese 1 oz, salad 1 cup), plus half a cup of black beans when the add-beans move applies. The word table mirrors the `moves.ts` component tags and adds the foods those tags don't see (salmon, eggs, cheese, avocado). Every cost goes out as `{ usd, basis: 'estimated' }`.
- **Unpriced instead of low.** A dish naming a food with no component price (grits, sausage, bacon, gravy, biscuit, collards, tuna, goat, saltfish, sweets, drinks) has no cost, and so it never counts as fitting a budget. 45 of 127 dishes are priced. Tony's shrimp and grits, biscuit with sausage gravy, red beans and rice with sausage, and fried chicken with mac and cheese and collards are unpriced until those foods get USDA components.
- **Restaurant venues stay unpriced.** Versailles' own menu page lists no current plate prices, and the copies on menu sites disagree and carry no date. Place cards carry no cost.
- **Per-meal amount** = (weekly food budget - meals out per week x $20) / (21 - meals out). $20 is the typical restaurant plate with tax and tip from `06` (8 x ~$20). Inputs come from intake: `risks.money.weekly_food_budget_usd` and `risks.convenience.meals_out_per_week`. Marisol ($90, 2 out) gets $2.63; Tony ($60, 1 out) gets $2.00. No budget, no amount, and nothing changes.
- **With a budget, Today dinner cards pick a rotation dish in this order**: the starred dinner, other dinners, other starred dishes, breakfasts last. In a tight week (under $70) only dishes estimated at or under the per-meal amount qualify, falling back to the cheapest priced lunch or dinner in dishes.json (01 criterion 4). Otherwise the person's starred dishes and still-unpriced dishes always qualify, so Marisol keeps her vaca frita (est. $2.87 against $2.63 a meal) and the budget never takes a loved dish away. Cards carry `cost_usd` whenever the dish is priced.
- **p8 (money tight)** = weekly budget under $70 and two or more restaurant meals in the trailing week. Restaurant meals come from a new optional `meals_out` count on seeded log days. Copy: "{dish}, about ${cost}. Beans first." with the time and the walk after it, like every card. The dollar figure rounds to whole dollars.
- **A budget under $70 is "tight"** for the cost-saving move order (add-beans, then share-it, first) and for the table card, which then adds "The plate's covered, about $20." The $20 is `fund.seat_usd`.
- **SNAP: the place stays, the home dinner joins it.** A SNAP user who checks in "going out" still gets the place card for where they said they are going; its body adds "Or at home tonight: {dish}, about ${cost}." Permission, not restriction.
- **Tony (N0170)** is `seed/graph.N0170.json` with `seed/log.N0170.json`. He sleeps 23:30, so his standard is dinner by 8 (intake's rule for late sleepers). He is the table's host, so `open_to_table` is false: otherwise on a Tuesday his own card would invite him to his own table. His log has two meals out in the trailing week, so his demo-day card is p8.
- Marisol's hand-entered `cost_usd: 4.5` was removed from her graph, so every price the UI shows comes from the estimate.

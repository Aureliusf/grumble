# Decisions

Choices made where the spec was silent or the installed versions differed from it.

## 2026-10-17 — frontend scaffold (14)

- **Versions.** Nuxt 4.6, Nuxt UI 4.12 (Tailwind v4), @nuxtjs/i18n 10.6. Nuxt UI v4 configures colors the same way 14 describes for v3 (`app.config.ts` + `@theme` in `main.css`); `UButtonGroup` is `UFieldGroup` in v4.
- **Repo layout.** The specs stay at the repo root instead of moving to `specs/`, so every path in `CLAUDE.md` (`data/…`, `04-simulator.md`) still resolves. `app/`, `server/`, `shared/` sit beside them as 00 describes.
- **i18n lives in `app/i18n/{en,es}.json`** (14), not `src/i18n` (CLAUDE.md predates the Nuxt choice). `fallbackLocale: 'en'` so a missing Spanish string shows English, never a key.
- **`ssr: false`.** Single-laptop demo, no SEO, avoids hydration surprises with the fixture fallback.
- **Missing API routes.** With `ssr: false`, Nuxt answers an unknown `/api/*` with the SPA's HTML and a 200. `apiCall()` treats any non-JSON response as a miss and falls back to the fixture.
- **Fixture-mode state.** When a POST falls back (seat, host, fund), the result is kept in `useDemoState()` so a seat taken on `/today` shows on `/table`. With real routes it stays empty and the server owns the state.
- **Graph and dishes fixtures** import `data/example-food-graph.marisol.json` and `data/dishes.json` directly rather than copying them into `app/fixtures/`.
- **Fonts via @nuxt/fonts** (bundled with Nuxt UI) instead of the Google Fonts `<link>`: same families and weights, but they're downloaded once and served locally, so the demo works with no network once warmed.
- **Icons** from the local `@iconify-json/lucide` package, served by the app; no Iconify CDN calls.
- **Light mode forced** (`colorMode.preference: 'light'`): 14 says don't design for dark today; the dark classes are in place for later.
- **Cafecito shades 200/400/600/800/950** interpolated between 14's stops because Nuxt UI reads every shade of a palette. No new hues.
- **Spanish register.** The strings 14 spells out literally ("Lo que comes", "Tus platos", "Guárdame una silla", "Anfitrión: ¿tú?") are kept as written, even though they use *tú*; new strings use *usted* per 09.
- **"skip:" in Spanish** is "otro día:" so the line reads as a move, not a prohibition (rule 1).
- **Spanish nudge and table-card action labels** in `app/fixtures/today.es.json` were written here (16 only gives the Spanish title and body).
- **Move card sentence** on `/whatif` is built from the `grumble.applied_moves` ids via `moveShort.*` (e.g. "Mismo plato. Una taza, frijoles primero, diez minutos, más temprano."), so it never disagrees with the curve.
- **"Same as ten" chip** shows when `same_as_ten` is true and the walk is above 10. At exactly 10 the chip would say the obvious.
- **Unknown dish on `/whatif`** (table-menu plates not in dishes.json) shows the 09 line and up to three dishes with the most matching words in their ids.
- **`/` is a splash page** (character, the line from the README, one button to `/plan`): the demo opens on the logo (13).

## 2026-10-17 — English first, intake back in (03)

- **English is the default locale** and EN comes first in the toggle (changed from 14's Spanish default at the team's call). The demo can still switch to ES in one tap, and the intake's first screen sets the person's language.
- **Scripted intake is built** at `/intake`, although 00 cut it for today. Same stage order as 03: language → who you are → taste, convenience, money, company → standards → procedures → who shows up → rotation → contract. One question per screen, ~30 screens, every non-required one skippable. LLM mode and Kreyòl are still cut.
- **Required steps:** language, sleep window, work schedule and blood sugar group, because the schema requires `person.language`, `schedule` and `blood_sugar_group`. "Not sure" on blood sugar resolves to `normal`.
- **The intake's graph is the state.** It's validated with Ajv against `data/food-graph.schema.json`, kept in `useFoodGraph()` and in localStorage, and `/plan` and `/whatif` render it in place of Marisol's. `/plan` has a "Show Marisol's plan" button that clears it. `/today` and `/table` stay on the demo person `N0771`, since their routes are Aurelio's.
- **Generated copy** (standard statements, why lines, dish moves) is written in the person's language, with `statement_en` beside it. Every number in a why line comes from `simulator-params.json` (late-dinner and walk peak deltas by group, 10 × `per_g_carbs`).
- **Dish moves** come from dish names and nutrients in `dishes.json` against 09's "When" column, two moves at most. "Add beans" is only offered on lunch and dinner plates, never on a sweet or a drink. Free-text dishes go into the rotation with a slug id and no move ("no numbers for this one yet").
- **Places:** Versailles and La Carreta reuse the order templates from the example graph. Any other venue gets a generic order line and `confidence: "unknowable"`, with no nutrient numbers made up.
- **Coach** defaults to the example graph's coach (Lourdes, sylvester-survivorship). The buddy is whoever the person names in stage 5, with `walks: true`, because the question is who would walk with them.
- **Budget slider:** Next keeps the shown $90 starting value; Skip leaves the budget absent.

## 2026-10-17 — one meal, matched by Claude (03 LLM mode, narrow)

- **The taste stage opens with one free-text question:** "What's one meal you love?" It replaces the cuisine chips and the five-dish picker. Claude Opus 5.5 matches the meal to one dish in `dishes.json` (or `none`) and gives the cuisine and one line in Grumble's voice (`server/api/intake/meal.post.ts`). The answer is structured output validated against a zod schema, and `dish_id` is restricted to the 127 real ids, so Claude can't invent a dish.
- **The key lives on the server** as `ANTHROPIC_API_KEY` in `.env` (gitignored) and never reaches the browser. Without it the route returns 503 and the intake uses a word match against dish names, so `npm run dev` still works with no env vars (CLAUDE.md). This is the one LLM call in the build, made at the team's call.
- **Effort `low`:** it's a lookup with one line of copy, and speed matters on a phone. Server-side refusal fallbacks are on (`fallbacks: "default"`).
- **The route lives under `server/`** (Aurelio's side) because the key can't be in the client. It reads `data/dishes.json` directly and touches nothing else of his.
- **Three 09 move lines named one dish** ("Same vaca frita.", "Same pastelito.", "Sancocho counts as dinner."). They now take the person's own dish name, so ropa vieja gets "Same ropa vieja."

## 2026-10-17 — balance the day (the team's direction)

- **The point of the plan is balance across the day.** A heavy meal keeps its place, and the rest of the day makes up for it: lean protein and vegetables later. It shows on Plan ("Your day", balanced around the meal they love), on Today ("What did you eat?" → "The rest of today") and on What if ("Whole day").
- **Daily targets** (`shared/nutrition.ts`) are published guidance computed in code: calories from the Dietary Guidelines for Americans 2020–2025 Appendix 2 by age and sex (sedentary), carbs 45% of calories, protein 20%, fiber 14 g per 1,000 kcal. Weight is never asked. A skipped age uses 55; a skipped or "prefer not to say" sex averages the two tables. Intake now asks sex (optional).
- **The balancer** (`shared/balance.ts`) searches every combination of the open slots, full plate or smaller plate (×0.75), over `dishes.json`. It scores distance from the targets: going over on calories or carbs costs most, falling short on fiber or protein costs next, going over on fiber or protein is free. It prefers the person's cuisine when that costs little and skips dishes matching what they won't eat.
- **Heavy meal → lean rest of day:** a fixed plate more than 15% over a third of the day's calories or carbs is "heavy". The other lunch and dinner then come only from lean protein and vegetable plates (≥25% of calories from protein, ≤40% from carbs; 10 dishes qualify). Breakfast has none, so it isn't restricted. The UI says why: "{dish} is a big one. Keep it."
- **Today's meals** go through `/api/meal` (Claude; word match without a key; moved from `/api/intake/meal`) and are kept as the day log beside the graph (`useEaten`, localStorage), per 05's log.days.
- **Whole-day simulator** (`shared/simulate.ts`) is 04's math, with every constant from `simulator-params.json`, so meal curves add up on one clock. Meal times are set from the person's own sleep window (breakfast at wake +1 h, lunch at wake +6 h, dinner 4 h before sleep), so night shift needs no special case. The comparison line is the same fixed meal with the median-calorie plate of their cuisine in the other slots ("usual plates"), not something made up. `tests/simulator.test.ts` is 04's hand check (85.8 / 38.8 / 21.6, walk 20 = walk 10, night-shift lateness) against this code. Aurelio's `/api/simulate` can import the same module.
- **Fixes:** "no one" as a buddy is now no buddy; a dish name mid-sentence is lowercase ("The pastelito de guayaba…"); unknown restaurants no longer get a filler order line.

## 2026-10-17 — spike bar under the header

- **Glucose, not insulin.** The team asked for "insulin spikes", but every parameter in `simulator-params.json` is CGM glucose, and the only insulin data is one fasting value per check-up. An insulin bar would be numbers we made up (rules 3 and 10).
- **What the bar shows:** a sparkline of today's whole-day curve, coral above 140, with one rise-above-baseline per meal. It uses the same `useDayGlucose` composable as What if → Whole day, so the bar and the chart can't disagree. It's labelled "people like you". Tapping it opens the whole-day view. Hidden on the splash and the intake, which have no day to draw yet.

## 2026-10-17 — Today first, freeform logging, intake that learns

- **Tab order:** Today · Plan · What if · Table · Intake. Today is the daily screen; Intake comes last because people go back to it to refine. The splash sends someone with a plan to Today and someone new to the intake.
- **Freeform logging on Today** ("a cup of rice, a palm of chicken, a cup of beans"): `POST /api/log` has Claude split the text into items. A simple food uses `data/components.json` with grams; a prepared dish uses `data/dishes.json` with a portion. The ids are fixed by the response format, so Claude can't invent a food. `shared/meals.ts` does the math. Hand measures are anchored to USDA weights: palm ≈ 85 g (3 oz), a cup of cooked rice 158 g, of cooked beans 172 g. A second entry for the same meal adds to it. Without a key, a comma/"and" split with a word match stands in.
- **`data/components.json`** is new reference data: 42 everyday foods per 100 g from USDA FoodData Central SR Legacy (April 2018 release), with USDA's household measures. It was extracted from the official CSV by `data/scripts/fdc_extract.py`, matching exact USDA descriptions. No number in it was typed by hand. This adds a USDA source alongside the synthetic data in `data/` (rule 9 is about not inventing nutrients; these are published).
- **The intake learns:** the first run is the full interview. Later runs open on a summary of what the graph already says (`answersFromGraph`). Any of seven sections can be reopened, and "one more meal you love" adds to the list (up to five, newest kept). Standards merge across runs: accepted ones keep the person's wording, declined ones stay declined (`standards.declined` in the graph; the schema allows it), and new ideas are marked "new" and have to be reviewed before saving.
- **Legacy cleanup on read:** graphs saved while "no one" counted as a buddy had ", with no one" inside the walk statement; it's dropped when the graph is read back.

# 16 — API contract (`shared/types.ts`)

The line between Miguel and Aurelio. Agree on it first, change it only together. Every route is a Nitro handler under `server/api/`. Every response below is also the **fixture** the frontend uses until the route is real, so copy these into `app/fixtures/` verbatim.

Person id for the demo is always `N0771` (Marisol). Routes take it anyway so nothing is hardcoded.

## Types

```ts
// shared/types.ts
export type Lang = 'en' | 'es'
export type SugarGroup = 'normal' | 'prediabetes' | 'type 2 diabetes'

export interface Dish {
  id: string; name: string; cuisine: string
  typical_meal_type: 'breakfast'|'lunch'|'dinner'|'snack'|'late snack'|'drink'|'meal at work'
  calories: number; carbs_g: number; protein_g: number; fat_g: number; fiber_g: number
  mediterranean_style: boolean
}

export interface SimulateRequest {
  person_id: string
  dish_id: string
  time: string            // "HH:MM" clock time
  walk_min: 0 | 10 | 20 | 30
  move: boolean           // apply Grumble's portion move for this dish (04 §portion rules)
}

export interface Curve {
  label: string                 // "9:30 pm, no walk"
  points: { t: number; mg_dl: number }[]   // t in minutes 0..240 step 5
  band: { t: number; lo: number; hi: number }[]
  peak_mg_dl: number
  peak_delta: number
  time_to_peak_min: number
  iauc_2h: number
  back_to_baseline_min: number
  late: boolean
  applied_moves: string[]       // move ids from 09, e.g. ["one-cup","beans-first","walk10"]
}

export interface SimulateResponse {
  baseline_mg_dl: number
  group: SugarGroup
  n_dinners: number             // size of the "people like you" set
  current: Curve                // what the request asked for
  grumble: Curve                // 19:00-equivalent (3h before sleep), walk 10, move = true
  delta: { peak_mg_dl: number; iauc_pct: number }   // grumble vs current, negative = better
  same_as_ten: boolean          // true when walk_min >= 10 (copy: "Same as ten")
}

export interface Standard { id: string; kind: string; statement: string; statement_en?: string; value: number|string|boolean; unit?: string; why: string }
export interface RotationItem { dish_id: string; slot: string; star?: boolean; move: string; flags: string[]; cost_usd?: number }
export interface Place { venue: string; order: string; avoid?: string; calories?: number; protein_g?: number }
export interface FoodGraph {               // subset of data/food-graph.schema.json the UI needs
  person: { id: string; display_name: string; language: Lang; blood_sugar_group: SugarGroup; schedule: { type: string; sleep_start: string; sleep_end: string } }
  standards: { items: Standard[] }
  dishes: { rotation: RotationItem[]; places: Place[] }
  accountable: { coach: { name: string }; buddy?: { name: string; relationship: string } | null; table: { role: 'guest'|'host'|'both'|'none'; usual_night: string } ; dog?: string | null }
}

export interface Checkin { date: string; energy?: 1|2|3|4|5; hunger?: 1|2|3|4|5; mood?: 1|2|3|4|5; company: 'alone'|'someone'|'out'|'table'|'unknown' }

export interface TodayResponse {
  date: string; weekday: string
  nudge: string | null                     // one dry line about yesterday, or null
  status_yesterday: 'green'|'amber'|'red'
  card: {
    id: string                             // rule id from 05, e.g. "p2-table"
    kind: 'table'|'dinner'|'place'|'red'
    title: string; body: string            // already in the person's language
    dish_id?: string; move?: string; time: string; walk_min: number
    person?: string                        // "Carmen", "Tony", "Lourdes", or null
    evidence: 'rule based'|'observed pattern'|'coach reviewed'   // Aurelio's evidence levels
    actions: { id: string; label: string }[]   // e.g. [{id:"seat",label:"I'll be there"},{id:"skip",label:"Not this week"}]
  }
  week: { red: boolean; reasons: string[] }
}

export interface Table {
  id: string; date: string; time: '18:30'; venue: 'Versailles'
  host: { name: string; years_out: number }; language: 'es'|'en'|'both'
  seats_total: number; seats_left: number; funded_by?: string
  mine: 'none'|'guest'|'host'
}
export interface MenuItem { dish_id: string; name: string; move: string; calories: number; carbs_g: number; fiber_g: number }
export interface Fund { seat_usd: 20; table_usd: 160; month_usd: 640; ledger: { month: string; tables_funded: number; seats: number; seats_taken: number } }
```

## Routes

| Method | Route | Body | Returns | Notes |
|---|---|---|---|---|
| GET | `/api/graph/:person_id` | — | `FoodGraph` | from `server/data/example-food-graph.marisol.json` |
| GET | `/api/dishes?cuisine=Cuban` | — | `Dish[]` | all 127 if no filter; Marisol's loves first when `person_id` given |
| POST | `/api/simulate` | `SimulateRequest` | `SimulateResponse` | the math in `04`; `grumble` curve always computed |
| GET | `/api/today/:person_id` | — | `TodayResponse` | before check-in: `card` is the default (p10); `nudge` from yesterday |
| POST | `/api/checkin/:person_id` | `Checkin` | `TodayResponse` | re-runs the rule table with today's answers |
| POST | `/api/today/:person_id/action` | `{ card_id, action_id }` | `{ ok: true }` | "I'll be there" → seats the person at this Tuesday's table |
| GET | `/api/tables` | — | `Table[]` | next four Tuesdays from `server/data/clock.json` |
| POST | `/api/tables/:id/seat` | `{ person_id }` | `Table` | decrements seats, sets `mine: 'guest'` |
| POST | `/api/tables` | `{ person_id, date, seats, language }` | `Table` | host a table |
| GET | `/api/tables/menu` | — | `MenuItem[]` | five plates with moves and numbers from dishes.json + portion rules |
| GET | `/api/fund` | — | `Fund` | |
| POST | `/api/fund` | `{ kind: 'seat'|'table'|'month', name?: string }` | `Fund` | updates ledger; `name` shows on the next unfunded table |
| GET | `/api/clock` | — | `{ today: string; weekday: string; week: number }` | demo clock; Miguel's header shows it small |

All state is in-memory in Nitro (`server/utils/state.ts`), seeded from `server/data/` on boot. Restarting `nuxt dev` resets the demo. That is a feature.

## Fixtures (the frontend uses these until the route is real)

### `POST /api/simulate` — vaca frita, 21:30, walk 0, move false

```json
{
  "baseline_mg_dl": 121, "group": "prediabetes", "n_dinners": 5472,
  "current": { "label": "9:30 pm, no walk", "peak_mg_dl": 207, "peak_delta": 85.8, "time_to_peak_min": 72, "iauc_2h": 5721, "back_to_baseline_min": 215, "late": true, "applied_moves": [],
    "points": [{"t":0,"mg_dl":121},{"t":30,"mg_dl":174},{"t":60,"mg_dl":186},{"t":72,"mg_dl":207},{"t":90,"mg_dl":172},{"t":120,"mg_dl":149},{"t":180,"mg_dl":127},{"t":240,"mg_dl":121}],
    "band": [{"t":0,"lo":121,"hi":121},{"t":72,"lo":185,"hi":228},{"t":240,"lo":121,"hi":121}] },
  "grumble": { "label": "7:00 pm, beans first, one cup, 10-min walk", "peak_mg_dl": 143, "peak_delta": 21.6, "time_to_peak_min": 72, "iauc_2h": 1440, "back_to_baseline_min": 190, "late": false, "applied_moves": ["one-cup","beans-first","walk10","earlier"],
    "points": [{"t":0,"mg_dl":121},{"t":30,"mg_dl":134},{"t":60,"mg_dl":138},{"t":72,"mg_dl":143},{"t":90,"mg_dl":134},{"t":120,"mg_dl":128},{"t":180,"mg_dl":123},{"t":240,"mg_dl":121}],
    "band": [{"t":0,"lo":121,"hi":121},{"t":72,"lo":137,"hi":148},{"t":240,"lo":121,"hi":121}] },
  "delta": { "peak_mg_dl": -64, "iauc_pct": -75 },
  "same_as_ten": false
}
```

(Real route returns points every 5 minutes; the fixture is sparse. Numbers are the hand computation in `04` §Tests.)

### `GET /api/today/N0771` (Tuesday, before check-in)

```json
{
  "date": "2025-01-14", "weekday": "Tuesday",
  "nudge": "Nine forty last night. Not a crime. Tonight, eight.",
  "status_yesterday": "amber",
  "card": { "id": "p2-table", "kind": "table",
    "title": "Versailles, six thirty.",
    "body": "Tony has the table. Vaca frita's on the menu, beans first. Seat's yours if you want it. Walk down Eighth after.",
    "time": "18:30", "walk_min": 10, "person": "Tony", "evidence": "observed pattern",
    "actions": [{"id":"seat","label":"I'll be there"},{"id":"skip","label":"Not this week"}] },
  "week": { "red": false, "reasons": ["mood <= 2 on 3 days"] }
}
```

In Spanish (`Accept-Language: es` or `?lang=es`): title "Versailles, seis y media.", body "Tony tiene la mesa. Hay vaca frita, primero los frijoles. Tu silla está lista si la quieres. Después, caminar por la Ocho."

### `GET /api/tables`

```json
[
  { "id": "t1", "date": "2025-01-14", "time": "18:30", "venue": "Versailles", "host": { "name": "Tony", "years_out": 4 }, "language": "both", "seats_total": 8, "seats_left": 3, "funded_by": "the García family", "mine": "none" },
  { "id": "t2", "date": "2025-01-21", "time": "18:30", "venue": "Versailles", "host": { "name": "Ana R.", "years_out": 6 }, "language": "es", "seats_total": 8, "seats_left": 8, "mine": "none" },
  { "id": "t3", "date": "2025-01-28", "time": "18:30", "venue": "Versailles", "host": { "name": "Tony", "years_out": 4 }, "language": "both", "seats_total": 6, "seats_left": 6, "mine": "none" },
  { "id": "t4", "date": "2025-02-04", "time": "18:30", "venue": "Versailles", "host": { "name": "—", "years_out": 0 }, "language": "both", "seats_total": 8, "seats_left": 8, "mine": "none" }
]
```

`t4` has no host: the "Host a table" form fills it.

### `GET /api/tables/menu`

```json
[
  { "dish_id": "vaca-frita-with-rice-and-black-beans", "name": "Vaca frita, moros, no maduros", "move": "Beans in the moros first, one scoop", "calories": 620, "carbs_g": 60, "fiber_g": 11 },
  { "dish_id": "arroz-con-pollo", "name": "Pollo a la plancha, frijoles negros, small rice", "move": "Beans first", "calories": 560, "carbs_g": 45, "fiber_g": 10 },
  { "dish_id": "grilled-fish-with-salad", "name": "Pescado a la plancha, ensalada, small rice", "move": "As is", "calories": 480, "carbs_g": 35, "fiber_g": 5 },
  { "dish_id": "picadillo-with-white-rice-and-maduros", "name": "Picadillo, moros, two maduros", "move": "Picadillo first, two not four", "calories": 640, "carbs_g": 70, "fiber_g": 6 },
  { "dish_id": "sopa-de-pollo", "name": "Sopa de pollo, Cuban bread (one piece)", "move": "As is", "calories": 420, "carbs_g": 40, "fiber_g": 4 }
]
```

(Aurelio: recompute from `dishes.json` with the portion rules; the dish ids that don't exist in dishes.json are fine to keep as custom ids.)

### `GET /api/fund`

```json
{ "seat_usd": 20, "table_usd": 160, "month_usd": 640, "ledger": { "month": "January", "tables_funded": 3, "seats": 24, "seats_taken": 19 } }
```

## Errors

Any route failure returns `{ error: string }` with a 4xx/5xx. The frontend's `useApi()` composable falls back to the fixture and shows a small "fixture" chip in the header dev strip. The demo never shows an empty screen.

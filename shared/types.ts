// shared/types.ts — the API contract (16-api-contract.md). Change only together.
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
export interface RotationItem { dish_id: string; slot: string; star?: boolean; move: string; flags: string[]; cost_usd?: number; portion_override?: Record<string, number | string> }
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

export interface Clock { today: string; weekday: string; week: number }

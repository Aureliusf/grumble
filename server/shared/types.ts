// The API contract (16-api-contract.md). Changes from 16 are listed in server/DECISIONS.md.
export type Lang = 'en' | 'es'
export type SugarGroup = 'normal' | 'prediabetes' | 'type 2 diabetes'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'late snack' | 'drink' | 'meal at work'

export interface Dish {
  id: string; name: string; cuisine: string
  typical_meal_type: MealType
  calories: number; carbs_g: number; protein_g: number; fat_g: number; fiber_g: number
  mediterranean_style: boolean
}

export interface SimulateRequest {
  person_id: string
  dish_id: string
  time: string            // "HH:MM" clock time
  walk_min: 0 | 10 | 20 | 30
  move: boolean           // apply Grumble's portion moves for this dish
}

export interface Curve {
  label: string
  points: { t: number; mg_dl: number }[]   // t in minutes 0..240 step 5
  band: { t: number; lo: number; hi: number }[]
  peak_mg_dl: number                        // highest point of the drawn curve
  peak_delta: number                        // peak_mg_dl - baseline
  time_to_peak_min: number
  iauc_2h: number
  back_to_baseline_min: number              // can be past 240 when a late, heavy plate is still up at the chart's edge
  late: boolean
  applied_moves: string[]
}

export interface SimulateResponse {
  baseline_mg_dl: number
  group: SugarGroup
  n_dinners: number                         // dinners for this group in meal_responses.csv
  current: Curve
  grumble: Curve                            // sleep_start - 4.5 h (Marisol 19:00), walk 10, move = true
  delta: { peak_mg_dl: number; iauc_pct: number }   // grumble vs current, negative = better
  same_as_ten: boolean                      // true when walk_min > 10
}

export interface Checkin { date?: string; energy?: 1|2|3|4|5; hunger?: 1|2|3|4|5; mood?: 1|2|3|4|5; company: 'alone'|'someone'|'out'|'table'|'unknown' }

export type Evidence = 'rule based' | 'observed pattern' | 'coach reviewed'

export interface Card {
  id: string
  kind: 'table' | 'dinner' | 'place' | 'red'
  title: string; body: string
  dish_id?: string; move?: string; time: string; walk_min: number
  person?: string
  evidence: Evidence
  actions: { id: string; label: string }[]
}

export interface Week { status: 'green'|'amber'|'red'; red: boolean; reasons: string[]; coach_alerted: boolean }

export interface TodayResponse {
  date: string; weekday: string
  nudge: string | null
  status_yesterday: 'green' | 'amber' | 'red'
  card: Card
  week: Week
}

export interface ActionResponse { ok: true; fed: boolean; today: TodayResponse }

export interface Table {
  id: string; date: string; time: '18:30'; venue: 'Versailles'
  host: { name: string; years_out: number }; language: 'es' | 'en' | 'both'   // open Tuesday: { name: '—', years_out: 0 } (16)
  seats_total: number; seats_left: number; funded_by?: string
  mine: 'none' | 'guest' | 'host'
}
export interface MenuItem { dish_id: string; name: string; move: string; applied_moves: string[]; calories: number; carbs_g: number; fiber_g: number }
export interface Fund { seat_usd: 20; table_usd: 160; month_usd: 640; ledger: { month: string; tables_funded: number; seats: number; seats_taken: number } }
export interface Clock { today: string; weekday: string; week: number }
export interface CoachAlert { person_id: string; display_name: string; coach: string; reasons: string[]; night_shift: boolean }

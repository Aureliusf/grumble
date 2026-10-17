// Intake rules tables (03 §Stage 3, §Stage 4, §Stage 6) as data + small pure functions.
// Numbers in the "why" lines come from simulator-params.json, never typed here.
import type { Dish, Lang, SugarGroup } from '#shared/types'
import params from '~~/data/simulator-params.json'
import marisol from '~~/data/example-food-graph.marisol.json'

export type ScheduleType = 'day job' | 'night shift' | 'works from home' | 'retired' | 'not working'
export type StandardKind =
  | 'last_meal_by' | 'walk_after_dinner_min' | 'overnight_fast_hours' | 'protein_first' | 'starch_portion_g'
  | 'social_nights_per_week' | 'home_cooked_days_per_week' | 'legume_meals_per_week' | 'custom'

export interface IntakeAnswers {
  language: Lang
  name?: string
  age?: number
  sex?: 'female' | 'male' | 'other'
  food?: string
  sleep_start: string
  sleep_end: string
  work?: ScheduleType
  has_dog?: boolean
  dog?: string
  sugar?: SugarGroup | 'unsure'
  cgm?: boolean
  cancer_type?: string
  years_since?: number
  loves: string[]
  refuses: string[]
  grew_up_on?: string
  appetite?: 'steady' | 'low' | 'cycles'
  meals_out?: number
  places: string[]
  cooks_days?: number
  budget?: number
  snap?: boolean
  who_cooks?: 'self' | 'someone else' | 'nobody'
  store?: string
  dinner_company?: 'alone' | 'partner' | 'family' | 'friends' | 'varies'
  eats_with: string[]
  call?: string
  open_to_table?: boolean
  open_to_hosting?: boolean
  standards: ProposedStandard[]
  declined: string[]                 // standard ids the person said "not this one" to; kept across runs
  manual: string[]
  buddy?: string
  starred: string[]
  framing?: 'suggestive' | 'direct'
  never_mention: string[]
}

export interface ProposedStandard {
  id: string
  kind: StandardKind
  statement: string
  statement_en: string
  value?: number | string | boolean
  unit?: string
  relative_to_sleep?: boolean
  why: string
  required?: boolean
  coach_flag?: boolean
}

export interface Proposal extends ProposedStandard { accepted: boolean; isNew?: boolean }

// Translate into a given language; the page passes vue-i18n's t bound with { locale }.
export type Tr = (key: string, named?: Record<string, unknown>, lang?: Lang) => string

export const emptyAnswers = (language: Lang): IntakeAnswers => ({
  language,
  sleep_start: '23:00',
  sleep_end: '07:00',
  loves: [],
  refuses: [],
  places: [],
  eats_with: [],
  standards: [],
  declined: [],
  manual: [],
  starred: [],
  never_mention: [],
})

// --- dish attributes (by name/id words; dishes.json has no component breakdown) ---
const has = (d: Dish, re: RegExp) => re.test(`${d.id} ${d.name}`.toLowerCase())
const RICE = /\brice\b|arroz|\bdiri\b|moros|congri/
const PLANTAIN = /plantain|maduro|tostone|bannann|mangu/
const BREAD = /bread|toast|roll|biscuit|sandwich|\bpan\b|croissant/
const STARCH = new RegExp(`${RICE.source}|${PLANTAIN.source}|${BREAD.source}|yuca|potato|fries|pasta|spaghetti|noodle|grits|arepa|tortilla`)
const BEANS = /bean|frijol|\bpwa\b|moros|congri|lentil|chickpea|habichuela|legim/
const SWEET = /pastelito|pastry|guayaba|cake|flan|donut|cookie|\bpie\b|tres leches|dulce|batido|churro/
const SOUP = /soup|sopa|sancocho|ajiaco|caldo|joumou|stew/

export const isStarchy = (d: Dish) => has(d, STARCH)
export const isSweet = (d: Dish) => has(d, SWEET) && !has(d, /sandwich|carne/)

// "Not sure" and a skipped answer both resolve to normal; the schema requires a group.
export const sugarGroup = (a: IntakeAnswers): SugarGroup => (a.sugar && a.sugar !== 'unsure' ? a.sugar : 'normal')
const group = sugarGroup
const effects = (a: IntakeAnswers) => params.dinner_effects_by_group[group(a)]

// --- time resolution, relative to sleep (CLAUDE.md rule 2) ---
const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return ((h ?? 0) * 60 + (m ?? 0)) % 1440
}
const hhmm = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}
// Sleep at or after 23:00 (or before 04:00, i.e. late) → dinner by 20:00; otherwise 3 h before sleep.
export function lastMealBy(a: IntakeAnswers) {
  const s = mins(a.sleep_start)
  if (s >= 23 * 60 || s < 4 * 60) return '20:00'
  return hhmm(s - 180)
}
export const nightShift = (a: IntakeAnswers) => a.work === 'night shift'

function fmtClock(t: string, lang: Lang) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date(2025, 0, 1, h, m)
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', m ? { hour: 'numeric', minute: '2-digit' } : { hour: 'numeric' }).format(d)
}

// --- Stage 3: proposals ---
export function proposeStandards(a: IntakeAnswers, loved: Dish[], tr: Tr): ProposedStandard[] {
  const out: ProposedStandard[] = []
  const both = (key: string, named: Record<string, unknown> = {}) => ({
    statement: tr(key, named, a.language),
    statement_en: tr(key, named, 'en'),
  })
  const why = (key: string, named: Record<string, unknown> = {}) => tr(key, named, a.language)
  const e = effects(a)
  const night = nightShift(a)

  // always: last meal by
  if (night) {
    out.push({ id: 'dinner-before-sleep', kind: 'last_meal_by', value: '3h', relative_to_sleep: true, required: true,
      ...both('intake.std.last_meal_night', { h: 3 }), why: why('intake.why.last_meal', { n: Math.round(e.late_dinner_peak_delta) }) })
  }
  else {
    const t = lastMealBy(a)
    out.push({ id: `dinner-by-${t.slice(0, 2).replace(/^0/, '')}`, kind: 'last_meal_by', value: t, relative_to_sleep: false, required: true,
      statement: tr('intake.std.last_meal', { time: fmtClock(t, a.language) }, a.language),
      statement_en: tr('intake.std.last_meal', { time: fmtClock(t, 'en') }, 'en'),
      why: why('intake.why.last_meal', { n: Math.round(e.late_dinner_peak_delta) }) })
  }

  // always: ten minutes after dinner
  out.push({ id: 'walk-10', kind: 'walk_after_dinner_min', value: 10, unit: 'min', required: true,
    ...both('intake.std.walk'), why: why('intake.why.walk', { n: Math.round(Math.abs(e.walk_peak_delta)) }) })

  const starchy = loved.filter(isStarchy)
  if (loved.some(d => has(d, RICE) || has(d, PLANTAIN) || has(d, BREAD)))
    out.push({ id: 'beans-first', kind: 'protein_first', value: true, ...both('intake.std.protein_first'), why: why('intake.why.protein_first') })
  if (starchy.length)
    out.push({ id: 'rice-100', kind: 'starch_portion_g', value: 100, unit: 'g', ...both('intake.std.starch'),
      why: why('intake.why.starch', { n: Math.round(params.ols_peak_delta_mg_dl.per_g_carbs * 10) }) })

  const sweet = loved.find(isSweet)
  if (sweet) {
    const dish = sweet.name.split(/ and | with /i)[0]!.toLowerCase()
    out.push({ id: `${sweet.id.split('-')[0]}-morning`, kind: 'custom', value: 'before 11:00',
      ...both('intake.std.morning', { dish }), why: why('intake.why.morning', { dish }) })
  }

  if (a.open_to_table)
    out.push({ id: 'table-tuesday', kind: 'social_nights_per_week', value: 1, ...both('intake.std.table'), why: why('intake.why.table') })

  if ((a.cooks_days ?? 0) >= 3)
    out.push({ id: 'cook-nights', kind: 'home_cooked_days_per_week', value: a.cooks_days, ...both('intake.std.cook', { n: a.cooks_days }), why: why('intake.why.cook') })

  const fibers = loved.map(d => d.fiber_g).sort((x, y) => x - y)
  const median = fibers.length ? fibers[Math.floor((fibers.length - 1) / 2)]! : null
  if (median !== null && median < 8)
    out.push({ id: 'beans-3', kind: 'legume_meals_per_week', value: 3, ...both('intake.std.legume'), why: why('intake.why.legume') })

  // Overnight fast: never for night shift; only if the sleep window leaves 13 h from dinner to breakfast (wake + 1 h).
  if (group(a) !== 'normal' && !night) {
    const gap = (mins(a.sleep_end) + 60 - mins(lastMealBy(a)) + 1440) % 1440
    if (gap >= 13 * 60)
      out.push({ id: 'fast-13', kind: 'overnight_fast_hours', value: 13, unit: 'h', ...both('intake.std.fast'), why: why('intake.why.fast') })
  }
  return out
}

// Both timing standards declined → a custom one, flagged for the coach (03 §Stage 3).
export const figureItOut = (a: IntakeAnswers, tr: Tr): ProposedStandard => ({
  id: 'figure-it-out', kind: 'custom', coach_flag: true,
  statement: tr('intake.std.figure', {}, a.language), statement_en: tr('intake.std.figure', {}, 'en'),
  why: tr('intake.why.figure', {}, a.language),
})

// --- Stage 4: procedures, one per standard (02 §Procedure implementations) ---
const PROCEDURES: Record<StandardKind, { source: string; cadence: 'per_meal' | 'daily' | 'weekly'; computation: string }> = {
  last_meal_by: { source: 'meal_log', cadence: 'daily', computation: 'last item > 5 kcal on the 4am-to-4am eating day is <= resolved time' },
  walk_after_dinner_min: { source: 'tracker_steps', cadence: 'daily', computation: '>= 80 steps/min x value within 60 min after the last meal' },
  overnight_fast_hours: { source: 'meal_log', cadence: 'daily', computation: 'hours from last bite to first bite >= value' },
  protein_first: { source: 'daily_checkin', cadence: 'daily', computation: 'self-report toggle on the dinner card' },
  starch_portion_g: { source: 'meal_log', cadence: 'per_meal', computation: 'logged starch portion <= value x 1.2' },
  social_nights_per_week: { source: 'table_attendance', cadence: 'weekly', computation: 'checked in at a Versailles table this week' },
  home_cooked_days_per_week: { source: 'meal_log', cadence: 'weekly', computation: 'days with no restaurant-tagged meal >= value' },
  legume_meals_per_week: { source: 'meal_log', cadence: 'weekly', computation: 'legume meals >= value' },
  custom: { source: 'daily_checkin', cadence: 'daily', computation: 'not evaluated in code; self-report' },
}
export const procedureFor = (s: ProposedStandard, manual: boolean) => {
  const p = PROCEDURES[s.kind]
  return { standard_id: s.id, source: manual ? 'manual' : p.source, cadence: p.cadence, computation: manual ? 'self-report' : p.computation }
}

// --- Stage 6: moves on a dish (09 §moves vocabulary) ---
export function movesFor(d: Dish, appetite?: IntakeAnswers['appetite']): string[] {
  if (d.mediterranean_style && d.fiber_g >= 6) return ['as-is']
  const m: string[] = []
  if (d.calories > 900) m.push('share-it')
  if (has(d, PLANTAIN)) m.push('two-not-four')
  if (has(d, RICE) && d.carbs_g >= 60) m.push('one-cup')
  if (has(d, BEANS)) m.push('beans-first')
  else if (d.protein_g >= 20 && isStarchy(d)) m.push('protein-first')
  if (has(d, BREAD) && d.typical_meal_type !== 'breakfast') m.push('half-the-bread')
  if (isSweet(d)) m.push('morning-not-night')
  const plate = ['lunch', 'dinner', 'meal at work'].includes(d.typical_meal_type) && !isSweet(d)
  if (d.fiber_g < 5 && m.length < 2 && plate) m.push('add-beans')
  if (has(d, SOUP) && (appetite === 'low' || appetite === 'cycles')) m.unshift('soup-counts')
  return m.slice(0, 2)
}

// 09's lines name a dish ("Same vaca frita."); fill in the person's own.
export function moveText(m: string, d: Dish, tr: Tr, lang: Lang) {
  const dish = d.name.split(/ with | and /i)[0]!.toLowerCase()
  return tr(`moves.${m}`, { dish, Dish: dish.charAt(0).toUpperCase() + dish.slice(1) }, lang)
}

export function flagsFor(d: Dish) {
  const f: string[] = []
  if (d.fiber_g >= 8) f.push('high_fiber')
  if (d.calories < 400 || has(d, SOUP)) f.push('low_appetite_ok')
  if (d.typical_meal_type === 'drink' || d.typical_meal_type === 'snack') f.push('zero_prep')
  return f
}

const SLOT: Record<Dish['typical_meal_type'], 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
  'breakfast': 'breakfast', 'lunch': 'lunch', 'dinner': 'dinner', 'snack': 'snack',
  'late snack': 'snack', 'drink': 'snack', 'meal at work': 'lunch',
}
export const slotFor = (d: Dish) => SLOT[d.typical_meal_type] ?? 'dinner'

// --- places: Versailles and La Carreta templates from the example graph; a generic one otherwise ---
const KNOWN_PLACES = Object.fromEntries(marisol.dishes.places.map(p => [p.venue.toLowerCase(), p]))
export function placeFor(venue: string) {
  const known = KNOWN_PLACES[venue.toLowerCase()]
  if (known) return { ...known }
  // No made-up order for a place we know nothing about; the day plan does the balancing.
  return { venue, order: '', confidence: 'unknowable' as const }
}

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// The program default coach (02 §Rules: never null).
export const DEFAULT_COACH = { ...marisol.accountable.coach }

// --- Progressive intake: each run starts from what the last one learned ---

// Proposals for this run, merged with the last: an accepted standard keeps the person's own wording,
// a declined one stays declined, a new idea is on and marked new, and an accepted one whose trigger
// no longer fires is kept (they negotiated it).
export function mergeProposals(fresh: ProposedStandard[], previous: ProposedStandard[], declined: string[], firstRun: boolean): Proposal[] {
  const prev = new Map(previous.map(p => [p.id, p]))
  const merged: Proposal[] = fresh.map((p) => {
    const old = prev.get(p.id)
    if (old) return { ...p, statement: old.statement, statement_en: old.statement_en, accepted: true }
    if (declined.includes(p.id)) return { ...p, accepted: false }
    return { ...p, accepted: true, isNew: !firstRun }
  })
  const freshIds = new Set(fresh.map(p => p.id))
  for (const p of previous) if (!freshIds.has(p.id)) merged.push({ ...p, accepted: true })
  return merged
}

type AnyGraph = Record<string, any>

// The intake answers a saved food graph implies, so a later run starts there (the graph stays the only state).
export function answersFromGraph(g: AnyGraph): IntakeAnswers {
  const person = g.person ?? {}
  const risks = g.risks ?? {}
  const acc = g.accountable ?? {}
  const procedures: AnyGraph[] = g.procedures?.items ?? []
  const required = new Set<StandardKind>(['last_meal_by', 'walk_after_dinner_min'])
  // Graphs saved before "no one" stopped counting as a buddy carry it in the walk statement; drop it on read.
  const nobody = /^(no ?one|nobody|none|nadie|ninguno|ninguna|n\/a|-)$/i
  const buddyName: string | undefined = acc.buddy?.name && !nobody.test(acc.buddy.name.trim()) ? acc.buddy.name : undefined
  const unNobody = (st: string) => (acc.buddy?.name && !buddyName ? st.replace(new RegExp(`, (with|con) ${acc.buddy.name}$`, 'i'), '') : st)
  return {
    ...emptyAnswers(person.language === 'es' ? 'es' : 'en'),
    name: person.display_name,
    age: person.age,
    sex: person.sex,
    food: person.food_background,
    sleep_start: person.schedule?.sleep_start ?? '23:00',
    sleep_end: person.schedule?.sleep_end ?? '07:00',
    work: person.schedule?.type,
    has_dog: person.has_dog,
    dog: acc.dog ?? undefined,
    sugar: person.blood_sugar_group,
    cgm: person.wears_cgm,
    cancer_type: person.cancer_type,
    years_since: person.years_since_treatment,
    loves: risks.taste?.loves ?? [],
    refuses: risks.taste?.refuses ?? [],
    grew_up_on: risks.taste?.grew_up_on,
    appetite: risks.taste?.appetite_pattern,
    meals_out: risks.convenience?.meals_out_per_week,
    places: risks.convenience?.usual_places ?? [],
    cooks_days: risks.convenience?.cooks_days_per_week,
    budget: risks.money?.weekly_food_budget_usd,
    snap: risks.money?.snap,
    who_cooks: risks.money?.who_cooks,
    store: risks.money?.store,
    dinner_company: risks.company?.usual_dinner_company,
    eats_with: risks.company?.eats_with ?? [],
    call: risks.company?.would_call_on_a_bad_day,
    open_to_table: risks.company?.open_to_table,
    open_to_hosting: risks.company?.open_to_hosting,
    standards: (g.standards?.items ?? []).map((s: AnyGraph) => ({
      id: s.id, kind: s.kind, statement: unNobody(s.statement), statement_en: unNobody(s.statement_en ?? s.statement),
      value: s.value, unit: s.unit, relative_to_sleep: s.relative_to_sleep, why: s.why ?? '', required: required.has(s.kind),
    })),
    declined: g.standards?.declined ?? [],
    manual: procedures.filter(p => p.source === 'manual').map(p => p.standard_id),
    buddy: buddyName,
    starred: (g.dishes?.rotation ?? []).filter((r: AnyGraph) => r.star).map((r: AnyGraph) => r.dish_id),
    framing: g.contract?.framing,
    never_mention: g.contract?.never_mention ?? [],
  }
}

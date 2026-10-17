// Answers → a food graph that validates against data/food-graph.schema.json (02, 03).
import Ajv2020 from 'ajv/dist/2020'
import type { Dish } from '#shared/types'
import schema from '~~/data/food-graph.schema.json'
import { DEFAULT_COACH, flagsFor, moveText, sugarGroup, movesFor, placeFor, procedureFor, slotFor, slug, type IntakeAnswers, type Tr } from './rules'

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false })
const validate = ajv.compile(schema)

const today = () => new Date().toISOString().slice(0, 10)
// Skipped answers stay absent (03 §Stages): drop undefined keys.
const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>

export function buildGraph(a: IntakeAnswers, dishes: Dish[], tr: Tr) {
  const byId = new Map(dishes.map(d => [d.id, d]))
  const on = today()
  const accepted = a.standards
  const walkId = accepted.find(s => s.kind === 'walk_after_dinner_min')?.id
  const mealId = accepted.find(s => s.kind === 'last_meal_by')?.id
  const night = a.work === 'night shift'

  const standards = accepted.map((s) => {
    const withBuddy = s.kind === 'walk_after_dinner_min' && a.buddy
    return clean({
      id: s.id,
      kind: s.kind,
      statement: withBuddy ? `${s.statement}${tr('intake.std.with_buddy', { name: a.buddy }, a.language)}` : s.statement,
      statement_en: withBuddy ? `${s.statement_en}${tr('intake.std.with_buddy', { name: a.buddy }, 'en')}` : s.statement_en,
      value: s.value,
      unit: s.unit,
      relative_to_sleep: s.kind === 'last_meal_by' ? night : s.relative_to_sleep,
      why: s.why,
      negotiated_on: on,
    })
  })

  const rotation = a.loves.map((id) => {
    const d = byId.get(id)
    if (!d) return { dish_id: slug(id), slot: 'dinner' as const, star: a.starred.includes(id) || undefined, flags: [] }
    const moves = movesFor(d, a.appetite)
    return clean({
      dish_id: d.id,
      slot: slotFor(d),
      star: a.starred.includes(d.id) || undefined,
      move: moves.map(m => moveText(m, d, tr, a.language)).join(' '),
      flags: flagsFor(d),
    })
  })

  const tableRole = a.open_to_table && a.open_to_hosting ? 'both' : a.open_to_hosting ? 'host' : a.open_to_table ? 'guest' : 'none'

  const graph = {
    version: 1,
    updated: new Date().toISOString(),
    person: clean({
      id: `intake-${Date.now().toString(36)}`,
      display_name: a.name,
      language: a.language,
      age: a.age,
      food_background: a.food,
      cancer_type: a.cancer_type,
      years_since_treatment: a.years_since,
      blood_sugar_group: sugarGroup(a),
      wears_cgm: a.cgm,
      schedule: { type: a.work ?? 'not working', sleep_start: a.sleep_start, sleep_end: a.sleep_end, work_days: [] },
      has_dog: a.has_dog,
      dietary_restrictions: [],
    }),
    risks: {
      company: clean({
        eats_with: a.eats_with,
        usual_dinner_company: a.dinner_company,
        would_call_on_a_bad_day: a.call,
        open_to_table: a.open_to_table,
        open_to_hosting: a.open_to_hosting,
      }),
      taste: clean({
        loves: a.loves.map(id => (byId.has(id) ? id : slug(id))),
        refuses: a.refuses,
        grew_up_on: a.grew_up_on,
        appetite_pattern: a.appetite,
      }),
      money: clean({ weekly_food_budget_usd: a.budget, snap: a.snap, who_cooks: a.who_cooks, store: a.store }),
      convenience: clean({ meals_out_per_week: a.meals_out, cooks_days_per_week: a.cooks_days, usual_places: a.places }),
    },
    standards: { items: standards },
    procedures: { items: accepted.map(s => procedureFor(s, a.manual.includes(s.id))) },
    thresholds: {
      daily: {
        amber_if: [mealId && `${mealId} missed`, walkId && `${walkId} missed`].filter(Boolean),
        red_if: ['no food logged and no check-in'],
        amber_action: 'nudge',
        red_action: 'coach_notified',
      },
      weekly: {
        amber_if: [mealId && `${mealId} missed 3+ days`, walkId && `${walkId} missed 4+ days`].filter(Boolean),
        red_if: ['no log 3 consecutive days', 'mood <= 2 on 3 days', ...(a.cgm ? ['cgm time above 180 mg/dL > 25%'] : [])],
        red_action: 'coach_calls',
      },
    },
    accountable: {
      coach: { ...DEFAULT_COACH },
      buddy: a.buddy ? { name: a.buddy, walks: true } : null,
      table: { role: tableRole, usual_night: 'Tue', last_attended: null },
      dog: a.has_dog ? (a.dog || null) : null,
    },
    dishes: {
      rotation,
      places: a.places.map(v => placeFor(v, tr, a.language)),
    },
    contract: {
      framing: a.framing ?? 'suggestive',
      nag_tolerance: 'low',
      quiet_hours: [`${a.sleep_start}-${a.sleep_end}`],
      never_mention: a.never_mention,
    },
  }

  const ok = validate(graph)
  return { graph, ok, errors: ok ? [] : (validate.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message}`) }
}

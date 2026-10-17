// The simulator math from 04-simulator.md, every constant from data/simulator-params.json.
// One meal → a curve above baseline; a day → the meal curves added up on one clock.
// What happened to people like you, as a range, never a forecast.
import params from '../data/simulator-params.json'
import type { SugarGroup } from './types'
import type { Nutrients } from './nutrition'

const ols = params.ols_peak_delta_mg_dl
const SHAPE = Object.entries(params.shape_fraction_of_peak).map(([t, f]) => [Number(t), f] as const)

export const baselineFor = (g: SugarGroup) => params.baseline_mg_dl[g]
const groupKey = (g: SugarGroup) => g as keyof typeof params.dinner_effects_by_group

export interface MealOpts {
  group: SugarGroup
  dinner: boolean
  late: boolean          // resolved against sleep, not the clock (latenessFor)
  walk_min: number
}

// Late = at or after sleep_start − 3.5 h, on the person's own clock (04 §Inputs, CLAUDE.md rule 2).
export function latenessFor(time: string, sleepStart: string) {
  const m = (s: string) => { const [h, mm] = s.split(':').map(Number); return (h ?? 0) * 60 + (mm ?? 0) }
  const before = (m(sleepStart) - m(time) + 1440) % 1440
  return before <= 210
}

// Peak above baseline (mg/dL). Dinner uses the group-stratified late and walk effects; other meals the pooled ones.
export function peakDelta(n: Nutrients, o: MealOpts) {
  const base = baselineFor(o.group)
  const fx = params.dinner_effects_by_group[groupKey(o.group)]
  const late = o.late ? (o.dinner ? fx.late_dinner_peak_delta : ols.late_dinner_flag) : 0
  const walk = o.dinner
    ? fx.walk_peak_delta * Math.min(o.walk_min, 10) / 10
    : ols.per_min_walk_capped_30 * Math.min(o.walk_min, 30)
  const delta = ols.intercept
    + ols.per_g_carbs * n.carbs_g + ols.per_g_fiber * n.fiber_g + ols.per_g_protein * n.protein_g + ols.per_g_fat * n.fat_g
    + late + walk
    + (o.group === 'prediabetes' ? ols.prediabetes : 0)
    + (o.group === 'type 2 diabetes' ? ols.type_2_diabetes : 0)
    + ols.per_mg_dl_baseline * base
  return Math.max(delta, 0)
}

// Piecewise-linear shape, stretched so its peak lands at the group's time to peak.
export function shapeAt(t: number, group: SugarGroup) {
  const x = (t * 60) / params.time_to_peak_min[group]
  if (x <= 0) return 0
  for (let i = 1; i < SHAPE.length; i++) {
    const [t0, f0] = SHAPE[i - 1]!
    const [t1, f1] = SHAPE[i]!
    if (x <= t1) return f0 + ((f1 - f0) * (x - t0)) / (t1 - t0)
  }
  return 0
}

export interface DayMeal { at: number; n: Nutrients; dinner: boolean; late: boolean; walk_min: number; label: string }

// A day from `from` to `to` (minutes since midnight), each meal's curve added on top of baseline.
export function dayCurve(meals: DayMeal[], group: SugarGroup, from = 6 * 60, to = 24 * 60, step = 5) {
  const base = baselineFor(group)
  const deltas = meals.map(m => peakDelta(m.n, { group, dinner: m.dinner, late: m.late, walk_min: m.walk_min }))
  const points: { t: number; mg_dl: number }[] = []
  for (let t = from; t <= to; t += step) {
    const lift = meals.reduce((s, m, i) => (t >= m.at && t - m.at <= 240 ? s + deltas[i]! * shapeAt(t - m.at, group) : s), 0)
    points.push({ t, mg_dl: base + lift })
  }
  const peaks = meals.map((m, i) => {
    const near = points.filter(p => p.t >= m.at && p.t <= m.at + 180)
    const top = near.reduce((a, b) => (b.mg_dl > a.mg_dl ? b : a), near[0] ?? { t: m.at, mg_dl: base })
    return { label: m.label, at: top.t, mg_dl: top.mg_dl, delta: deltas[i]! }
  })
  // Glucose exposure over the day: area above baseline, mg/dL·min.
  const exposure = points.reduce((s, p) => s + (p.mg_dl - base) * step, 0)
  const above140 = points.filter(p => p.mg_dl > 140).length * step
  return { baseline: base, points, peaks, exposure, minutes_above_140: above140 }
}

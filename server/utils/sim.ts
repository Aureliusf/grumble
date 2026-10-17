import type { Curve, Dish, Lang, SimulateRequest, SimulateResponse, SugarGroup } from '../shared/types'
import { N_DINNERS, P, type Graph } from './data'
import { movesFor, type Portion } from './moves'
import { grumbleTime, resolveLate } from './time'
import { clockLabel, t } from './copy'

const O = P.ols_peak_delta_mg_dl
const SHAPE = Object.entries(P.shape_fraction_of_peak).map(([k, v]) => [Number(k), v] as const).sort((a, b) => a[0] - b[0])
const r1 = (n: number) => Math.round(n * 10) / 10

// 15 §sim.ts: pooled late/walk terms replaced by the group-stratified dinner effects; walk saturates at 10 min.
export function peakDelta(d: Portion, late: boolean, walkMin: number, group: SugarGroup, fiberMult = 1) {
  const fx = P.dinner_effects_by_group[group]
  return O.intercept + O.per_g_carbs * d.carbs_g + O.per_g_fiber * d.fiber_g * fiberMult
    + O.per_g_protein * d.protein_g + O.per_g_fat * d.fat_g
    + (group === 'prediabetes' ? O.prediabetes : 0) + (group === 'type 2 diabetes' ? O.type_2_diabetes : 0)
    + O.per_mg_dl_baseline * P.baseline_mg_dl[group]
    + (late ? fx.late_dinner_peak_delta : 0)
    + fx.walk_peak_delta * Math.min(walkMin, 10) / 10
}

// Piecewise linear through shape_fraction_of_peak, x in the 60-min-peak frame.
export function shape(x: number) {
  for (let i = 1; i < SHAPE.length; i++) {
    const [x0, y0] = SHAPE[i - 1], [x1, y1] = SHAPE[i]
    if (x <= x1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
  }
  return 0
}

// The tiles read the drawn curve, so chart and numbers always agree (DECISIONS: peak = top of the drawn curve).
export function curve(delta: number, group: SugarGroup, late: boolean, applied: string[], label: string): Curve {
  const base = P.baseline_mg_dl[group], ttp = P.time_to_peak_min[group]
  const rise = Array.from({ length: 49 }, (_, i) => ({ t: i * 5, y: delta * shape(i * 5 * 60 / ttp) }))
  const top = rise.reduce((a, b) => (b.y > a.y ? b : a))
  let iauc = 0, back = top.t + 5
  for (let i = 1; i < rise.length && rise[i].t <= 120; i++) iauc += (Math.max(rise[i].y, 0) + Math.max(rise[i - 1].y, 0)) / 2 * 5
  // The stretched shape reaches 0 at 240 * ttp / 60 min, so this always ends, past the 240-min chart if it has to.
  while (delta * shape(back * 60 / ttp) >= 3) back += 5
  return {
    label,
    points: rise.map(p => ({ t: p.t, mg_dl: r1(base + p.y) })),
    band: rise.map(p => ({ t: p.t, lo: r1(base + p.y * 0.75), hi: r1(base + p.y * 1.25) })),
    peak_mg_dl: r1(base + top.y),
    peak_delta: r1(top.y),
    time_to_peak_min: top.t,
    iauc_2h: Math.round(iauc),
    back_to_baseline_min: back,
    late,
    applied_moves: applied,
  }
}

export function simulate(req: SimulateRequest, dish: Dish, graph: Graph, lang: Lang): SimulateResponse {
  const group = graph.person.blood_sugar_group, schedule = graph.person.schedule
  const plan = movesFor(dish)
  const raw: Portion = { carbs_g: dish.carbs_g, fiber_g: dish.fiber_g, protein_g: dish.protein_g, fat_g: dish.fat_g, calories: dish.calories }
  const currentLate = resolveLate(req.time, schedule)

  const run = (time: string, walk: number, move: boolean, grumble: boolean) => {
    const late = move && plan.forceEarly ? false : resolveLate(time, schedule)
    const applied = [...(move ? plan.ids : []), ...(walk >= 10 ? ['walk10'] : []), ...(grumble && currentLate ? ['earlier'] : [])]
    const parts = (move ? plan.ids : []).map(id => t(lang, `short.${id}`))
    const label = [clockLabel(time), ...parts, walk ? t(lang, 'short.walk_n', { n: walk }) : t(lang, 'short.no_walk')].join(', ')
    const delta = peakDelta(move ? plan.portion : raw, late, walk, group, move ? plan.fiberMult : 1)
    return curve(delta, group, late, applied, label)
  }

  const current = run(req.time, req.walk_min, req.move, false)
  const grumble = run(grumbleTime(schedule), 10, true, true)
  return {
    baseline_mg_dl: P.baseline_mg_dl[group],
    group,
    n_dinners: N_DINNERS[group],
    current,
    grumble,
    delta: { peak_mg_dl: r1(grumble.peak_mg_dl - current.peak_mg_dl), iauc_pct: Math.round((grumble.iauc_2h / current.iauc_2h - 1) * 100) },
    same_as_ten: req.walk_min > 10,
  }
}

import type { Curve, Dish, Lang, SimulateRequest, SimulateResponse, SugarGroup } from '../shared/types'
import { N_DINNERS, P, type Graph } from './data'
import { movesFor, type Portion } from './moves'
import { peakDelta, shapeAt } from '../../shared/simulate'
import { dinnerTime, resolveLate } from './time'
import { clockLabel, t } from './copy'

const r1 = (n: number) => Math.round(n * 10) / 10

// The tiles read the drawn curve, so chart and numbers always agree (DECISIONS: peak = top of the drawn curve).
export function curve(delta: number, group: SugarGroup, late: boolean, applied: string[], label: string): Curve {
  const base = P.baseline_mg_dl[group]
  const rise = Array.from({ length: 49 }, (_, i) => ({ t: i * 5, y: delta * shapeAt(i * 5, group) }))
  const top = rise.reduce((a, b) => (b.y > a.y ? b : a))
  let iauc = 0, back = top.t + 5
  for (let i = 1; i < rise.length && rise[i].t <= 120; i++) iauc += (Math.max(rise[i].y, 0) + Math.max(rise[i - 1].y, 0)) / 2 * 5
  // The stretched shape reaches 0 at 240 * ttp / 60 min, so this always ends, past the 240-min chart if it has to.
  while (delta * shapeAt(back, group) >= 3) back += 5
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
    // One formula for What-if and the day view: shared/simulate.ts. What-if is a dinner ("Dinner at"); beans-first is
    // the fiber term counted 1.5x, which is the same as 1.5x the fiber grams in a linear model.
    const p = move ? plan.portion : raw
    const delta = peakDelta({ ...p, fiber_g: p.fiber_g * (move ? plan.fiberMult : 1) }, { group, dinner: true, late, walk_min: walk })
    return curve(delta, group, late, applied, label)
  }

  const current = run(req.time, req.walk_min, req.move, false)
  const grumble = run(dinnerTime(graph), 10, true, true)
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

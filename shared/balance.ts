// Balance a day around the meals that are already decided (the one they love, or what they actually ate).
// The other slots are filled from dishes.json, full or smaller plates, so the day lands near the targets:
// a heavy lunch pulls dinner toward lean protein and vegetables. The person keeps the heavy meal.
import type { Dish } from './types'
import { scale, sum, type Nutrients, type Targets } from './nutrition'

export type Slot = 'breakfast' | 'lunch' | 'dinner'
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner']
export const PORTIONS = [1, 0.75] as const

export interface Plate {
  slot: Slot
  dish: Dish
  portion: number           // 1 = the usual plate, 0.75 = a smaller plate
  fixed: boolean            // decided by the person (loved or eaten), not by the balancer
  pending?: boolean         // planned for a meal still ahead (the next-meal simulator), not eaten yet
  n: Nutrients              // the plate's numbers at this portion
}

export interface BalancedDay {
  plates: Plate[]
  totals: Nutrients
  targets: Targets
  heavy: Plate[]            // fixed plates over their share of the day; they turn the other lunch/dinner lean
}

const SLOT_TYPES: Record<Slot, Dish['typical_meal_type'][]> = {
  breakfast: ['breakfast'],
  lunch: ['lunch', 'meal at work', 'dinner'],
  dinner: ['dinner', 'lunch'],
}

export const slotOf = (d: Dish): Slot | null =>
  d.typical_meal_type === 'breakfast' ? 'breakfast'
    : d.typical_meal_type === 'dinner' ? 'dinner'
      : d.typical_meal_type === 'lunch' || d.typical_meal_type === 'meal at work' ? 'lunch'
        : null

export const plate = (slot: Slot, dish: Dish, portion = 1, fixed = false): Plate =>
  ({ slot, dish, portion, fixed, n: scale(dish, portion) })

// How far a day's totals sit from the targets. Over on calories and carbs costs most;
// under on fiber and protein costs next; going over on fiber or protein is free.
function distance(t: Nutrients, g: Targets) {
  const over = (x: number, y: number) => Math.max(0, x / y - 1)
  const under = (x: number, y: number) => Math.max(0, 1 - x / y)
  return 2 * over(t.carbs_g, g.carbs_g) ** 2
    + 1.5 * over(t.calories, g.calories) ** 2
    + 0.4 * under(t.calories, g.calories) ** 2
    + 1.5 * under(t.fiber_g, g.fiber_g) ** 2
    + 1.0 * under(t.protein_g, g.protein_g) ** 2
}

// Leanness of a single dish, for pruning: fiber and protein per calorie, less carbs.
const lean = (d: Dish) => (d.fiber_g * 4 + d.protein_g - d.carbs_g * 0.5) / Math.max(d.calories, 1)

// Lean protein and vegetables: at least a quarter of calories from protein, at most 40% from carbs.
export const isLean = (d: Dish) => (d.protein_g * 4) / d.calories >= 0.25 && (d.carbs_g * 4) / d.calories <= 0.40

// A plate is heavy when it runs more than 15% over a third of the day's calories or carbs.
export const isHeavy = (n: Nutrients, g: Targets) => n.calories > (g.calories / 3) * 1.15 || n.carbs_g > (g.carbs_g / 3) * 1.15

export function balanceDay(opts: {
  fixed: { slot: Slot; dish: Dish; portion?: number; pending?: boolean }[]
  dishes: Dish[]
  targets: Targets
  cuisine?: string          // the person's food, preferred when it costs little
  refuses?: string[]        // words from "anything you won't eat?"
  skip?: Slot[]             // meals already past and not logged: neither planned nor counted
}): BalancedDay {
  const { dishes, targets } = opts
  const fixed = opts.fixed.map(f => ({ ...plate(f.slot, f.dish, f.portion ?? 1, true), pending: f.pending }))
  const taken = new Set(fixed.map(p => p.slot))
  const open = SLOTS.filter(s => !taken.has(s) && !opts.skip?.includes(s))
  const usedIds = new Set(fixed.map(p => p.dish.id))

  const refused = (opts.refuses ?? []).flatMap(r => r.toLowerCase().split(/[^a-z]+/)).filter(w => w.length > 3)
  const ok = (d: Dish) => !usedIds.has(d.id) && !refused.some(w => d.name.toLowerCase().includes(w))
  const cuisine = (opts.cuisine ?? '').toLowerCase().slice(0, 4)
  const theirs = (d: Dish) => !!cuisine && d.cuisine.toLowerCase().startsWith(cuisine)

  // A heavy meal keeps its place; the other lunch and dinner become lean protein and vegetables.
  // Only what was eaten or loved counts as heavy; a planned meal doesn't reshape the day around itself.
  const heavy = fixed.filter(p => !p.pending && isHeavy(p.n, targets))

  // Per open slot: their cuisine's dishes plus the leanest overall, each at both portions.
  const candidates = open.map((slot) => {
    const all = dishes.filter(d => SLOT_TYPES[slot].includes(d.typical_meal_type) && ok(d))
    const leanOnly = heavy.length && slot !== 'breakfast' ? all.filter(isLean) : []
    const pool = leanOnly.length ? leanOnly : all
    const keep = [...pool.filter(theirs), ...[...pool].sort((a, b) => lean(b) - lean(a)).slice(0, 24)]
    return [...new Map(keep.map(d => [d.id, d])).values()].flatMap(d => PORTIONS.map(p => plate(slot, d, p)))
  })

  const base = sum(fixed.map(p => p.n))
  let best: Plate[] = []
  let bestScore = Infinity

  // Exhaustive over at most three slots × ~60 plates; well under a million combinations.
  const walk = (i: number, chosen: Plate[], acc: Nutrients) => {
    if (i === candidates.length) {
      const prefer = chosen.reduce((s, p) => s - (theirs(p.dish) ? 0.02 : 0) + (p.portion < 1 ? 0.01 : 0), 0)
      const score = distance(acc, targets) + prefer
      if (score < bestScore) { bestScore = score; best = chosen }
      return
    }
    for (const p of candidates[i]!) {
      if (chosen.some(c => c.dish.id === p.dish.id)) continue
      walk(i + 1, [...chosen, p], sum([acc, p.n]))
    }
  }
  walk(0, [], base)

  const plates = [...fixed, ...best].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
  return { plates, totals: sum(plates.map(p => p.n)), targets, heavy }
}

// The comparison day: the same fixed plates, every other slot the middle-of-the-range plate
// (median calories) for that slot in their cuisine, or across all dishes if their cuisine has none.
export function usualDay(fixedPlates: Plate[], dishes: Dish[], targets: Targets, cuisine?: string): BalancedDay {
  const c = (cuisine ?? '').toLowerCase().slice(0, 4)
  const taken = new Set(fixedPlates.map(p => p.slot))
  const fill = SLOTS.filter(s => !taken.has(s)).map((slot) => {
    const all = dishes.filter(d => slotOf(d) === slot)
    const mine = all.filter(d => c && d.cuisine.toLowerCase().startsWith(c))
    const pool = (mine.length ? mine : all).sort((a, b) => a.calories - b.calories)
    return plate(slot, pool[Math.floor(pool.length / 2)]!)
  })
  const plates = [...fixedPlates, ...fill].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))
  return { plates, totals: sum(plates.map(p => p.n)), targets, heavy: [] }
}

// The part of the day still open, split across the open meals by how much of a day each stands for.
export const MEAL_SHARE: Record<Slot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.4 }

export function mealBudget(targets: Targets, eaten: Nutrients, slot: Slot, open: Slot[]): Targets {
  const share = MEAL_SHARE[slot] / open.reduce((s, x) => s + MEAL_SHARE[x], 0)
  const left = (t: number, e: number) => Math.max(0, t - e) * share
  return {
    calories: left(targets.calories, eaten.calories),
    carbs_g: left(targets.carbs_g, eaten.carbs_g),
    protein_g: left(targets.protein_g, eaten.protein_g),
    fiber_g: left(targets.fiber_g, eaten.fiber_g),
  }
}

// How much of a dish fits a meal's budget: the portion that meets its calories and carbs (whichever runs out
// first), to the nearest quarter plate, ¼ to 1½.
export function portionFor(d: Dish, budget: Targets) {
  const fit = Math.min(budget.calories / Math.max(d.calories, 1), budget.carbs_g / Math.max(d.carbs_g, 1))
  return Math.min(1.5, Math.max(0.25, Math.round(fit * 4) / 4))
}

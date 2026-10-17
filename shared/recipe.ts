// A dish as its parts, and how to eat it.
// Parts come from data/dish-components.json (precomputed) or /api/recipe (Claude, ids fixed to components.json);
// grams are rescaled so the parts add up to the dish's calories in dishes.json. Everything below is plain math.
import type { Dish } from './types'
import { priceItem, totalOf, type PricedItem } from './meals'
import { sum, type Nutrients, type Targets } from './nutrition'

export interface Part { id: string; grams: number }

// Price the parts and scale every gram by one factor so the plate matches the dish's calories.
export function partsToDish(parts: Part[], dish: Dish): PricedItem[] {
  const priced = parts.map(p => priceItem({ kind: 'component', id: p.id, grams: p.grams, said: '' })).filter((x): x is PricedItem => !!x)
  const kcal = totalOf(priced).calories
  if (!kcal) return priced
  const f = dish.calories / kcal
  return parts.map(p => priceItem({ kind: 'component', id: p.id, grams: Math.round(p.grams * f), said: '' })).filter((x): x is PricedItem => !!x)
}

// First and whole: beans, legumes, vegetables, avocado. Then: meat, fish, eggs, cheese, milk (trimmed only if
// still needed, never below half). Last and less: starches, fried sides, bread, added fat and sugar (trimmed first, to ¼).
export type Role = 'first' | 'then' | 'last'
const FIRST = /beans|chickpeas|lentils|broccoli|vegetables|lettuce|tomato|avocado/
const THEN = /chicken|beef|steak|pork|salmon|fish|shrimp|egg|cheddar|queso|milk/
export const roleOf = (id: string): Role => (FIRST.test(id) ? 'first' : THEN.test(id) ? 'then' : 'last')
const RANK: Record<Role, number> = { first: 0, then: 1, last: 2 }

export interface HowItem extends PricedItem { role: Role; from: number; to: number }
export interface HowToEat { items: HowItem[]; n: Nutrients; lastFactor: number; thenFactor: number }

const quarter = (x: number) => Math.round(x * 4) / 4
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

// Fit the plate to the meal's budget (calories and carbs): shrink the "last" foods first, then the "then" foods;
// the "first" foods stay whole. Whatever is left over shows honestly in "your day after this meal".
export function howToEat(items: PricedItem[], budget: Targets): HowToEat {
  const tot = (r: Role) => totalOf(items.filter(i => roleOf(i.id) === r))
  const A = tot('first'), P = tot('then'), L = tot('last')
  const room = (have: number, want: number) => (want <= 0 ? 1 : Math.max(0, have) / want)
  const lastFactor = L.calories
    ? clamp(quarter(Math.min(room(budget.calories - A.calories - P.calories, L.calories), room(budget.carbs_g - A.carbs_g - P.carbs_g, L.carbs_g))), 0.25, 1)
    : 1
  const rest = budget.calories - A.calories - L.calories * lastFactor
  const thenFactor = P.calories && A.calories + P.calories + L.calories * lastFactor > budget.calories * 1.05
    ? clamp(quarter(rest / P.calories), 0.5, 1)
    : 1
  const out = items.map((i) => {
    const role = roleOf(i.id)
    const f = role === 'last' ? lastFactor : role === 'then' ? thenFactor : 1
    return { ...i, role, from: i.grams ?? 0, to: Math.round((i.grams ?? 0) * f), n: scaleN(i.n, f) }
  }).sort((x, y) => RANK[x.role] - RANK[y.role])
  return { items: out, n: sum(out.map(i => i.n)), lastFactor, thenFactor }
}

function scaleN(n: Nutrients, f: number): Nutrients {
  return { calories: n.calories * f, carbs_g: n.carbs_g * f, fiber_g: n.fiber_g * f, protein_g: n.protein_g * f, fat_g: n.fat_g * f, sugar_g: (n.sugar_g ?? 0) * f }
}

import type { Dish } from '../shared/types'

const KEYWORDS: Record<string, string[]> = {
  starch_rice: ['rice', 'arroz', 'moros', 'congrí', 'diri', 'gallo pinto', 'chow', 'fried rice'],
  starch_plantain: ['plantain', 'maduros', 'tostones', 'bannann', 'mofongo', 'mangu'],
  starch_bread: ['bread', 'pan', 'toast', 'sandwich', 'arepa', 'baleada', 'pupusa', 'roti', 'biscuit', 'dumpling', 'festival', 'bammy', 'patty', 'pate', 'empanada'],
  starch_other: ['yuca', 'potato', 'fries', 'pasta', 'noodle', 'grits', 'mac', 'spaghetti'],
  beans: ['beans', 'frijoles', 'pwa', 'gandules', 'lentil', 'chickpea', 'peas'],
  protein: ['chicken', 'pollo', 'gallina', 'beef', 'steak', 'pork', 'pernil', 'griot', 'fish', 'pescado', 'poisson', 'shrimp', 'egg', 'saltfish', 'goat', 'turkey', 'vaca', 'res', 'picadillo', 'ropa vieja', 'lechon', 'palomilla', 'carne'],
  fried: ['fried', 'frita', 'kode', 'chicharrón', 'croqueta', 'croquetas', 'tostones', 'pastelito'],
  sweet: ['cake', 'flan', 'tres leches', 'pastelito', 'dulce', 'sundae', 'churro', 'pudding', 'guayaba'],
  sweet_drink: ['soda', 'juice', 'jugo', 'guarapo', 'batido', 'sweet tea', 'malta'],
  coffee: ['cafecito', 'café', 'coffee', 'colada', 'cortadito'],
  soup: ['soup', 'sopa', 'sancocho', 'ajiaco', 'pho', 'caldo', 'joumou', 'ramen'],
  vegetables: ['salad', 'ensalada', 'legim', 'collards', 'okra', 'cabbage', 'vegetables'],
}
// Whole words only (optional plural), so "pan" doesn't match "pancake" and "mac" doesn't match "machaca".
const MATCHERS = Object.entries(KEYWORDS).map(([c, words]) =>
  [c, new RegExp(`(?<!\\p{L})(?:${words.join('|')})(?:s|es)?(?!\\p{L})`, 'iu')] as const)

export const components = (name: string) => MATCHERS.filter(([, re]) => re.test(name)).map(([c]) => c)

export interface Portion { carbs_g: number; fiber_g: number; protein_g: number; fat_g: number; calories: number }
export interface Plan { ids: string[]; portion: Portion; fiberMult: number; forceEarly: boolean }

type Rule = { id: string; when: (d: Dish, c: Set<string>) => boolean; apply?: (p: Portion, plan: Plan) => void }
const starch = (c: Set<string>) => [...c].some(x => x.startsWith('starch_'))
const RULES: Rule[] = [
  { id: 'one-cup', when: (d, c) => c.has('starch_rice') && d.carbs_g >= 60, apply: p => { p.carbs_g *= 0.65; p.calories *= 0.8 } },
  { id: 'two-not-four', when: (_, c) => c.has('starch_plantain'), apply: p => { p.carbs_g -= 25; p.calories -= 110 } },
  { id: 'beans-first', when: (_, c) => c.has('beans'), apply: (_, plan) => { plan.fiberMult = 1.5 } },
  { id: 'protein-first', when: (_, c) => c.has('protein') && starch(c) && !c.has('beans'), apply: (_, plan) => { plan.fiberMult = 1.25 } },
  { id: 'add-beans', when: (d, c) => d.fiber_g < 5 && starch(c), apply: p => { p.fiber_g += 8; p.protein_g += 7; p.carbs_g += 20 } },
  { id: 'morning-not-night', when: (d, c) => (c.has('sweet') || c.has('fried')) && ['snack', 'breakfast'].includes(d.typical_meal_type), apply: (_, plan) => { plan.forceEarly = true } },
  { id: 'share-it', when: d => d.calories > 900, apply: p => { for (const k of Object.keys(p) as (keyof Portion)[]) p[k] *= 0.5 } },
  { id: 'soup-counts', when: (_, c) => c.has('soup') },
  { id: 'as-is', when: (d, c) => (d.mediterranean_style && d.fiber_g >= 6) || (c.size === 1 && c.has('coffee')) },
]

// The first three dish moves that apply (15 §moves). walk10 and earlier are added by the simulator, outside the cap.
export function movesFor(dish: Dish): Plan {
  const c = new Set(components(dish.name))
  const plan: Plan = { ids: [], fiberMult: 1, forceEarly: false,
    portion: { carbs_g: dish.carbs_g, fiber_g: dish.fiber_g, protein_g: dish.protein_g, fat_g: dish.fat_g, calories: dish.calories } }
  for (const r of RULES.filter(r => r.when(dish, c)).slice(0, 3)) {
    plan.ids.push(r.id)
    r.apply?.(plan.portion, plan)
  }
  return plan
}

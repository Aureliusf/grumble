import type { Cost, Dish } from '../shared/types'
import componentsFile from '../../data/components.json'
import { dishes, type Graph } from './data'
import { movesFor } from './moves'

const PRICE = new Map<string, number | undefined>(componentsFile.components.map(c => [c.id, c.usd_per_100g]))

// What one home plate holds, in cooked edible grams from the USDA measures in data/components.json:
// meat or fish 3 oz (85 g); a starch 1 cup (rice 158 g, yuca 206 g, pasta 124 g, plantain 118-169 g); beans 1/2 cup (82-99 g);
// bread 2 slices (58 g); eggs 2 large; cheese 1 oz (28 g); salad 1 cup shredded (47 g); cooked vegetables 1/2 cup.
// Rows are tried in order and the first match in a group wins, so "sweet potato" isn't also a potato and
// "rice and peas" is kidney beans. A null food has no price in the source: a dish naming it stays unpriced rather than reading low.
type Part = [group: string, words: string[], food: string | null, grams: number]
const PARTS: Part[] = [
  ['rice', ['brown rice'], 'brown-rice', 202],
  ['rice', ['rice', 'arroz', 'moros', 'congrí', 'diri', 'gallo pinto'], 'white-rice', 158],
  ['beans', ['red beans', 'kidney', 'pwa', 'rice and peas'], 'red-beans', 89],
  ['beans', ['pinto'], 'pinto-beans', 86],
  ['beans', ['lentil'], 'lentils', 99],
  ['beans', ['chickpea'], 'chickpeas', 82],
  ['beans', ['gandules', 'peas', 'hummus'], null, 0],
  ['beans', ['bean', 'frijoles'], 'black-beans', 86],
  ['plantain', ['boiled plantain', 'mangu'], 'plantain-boiled', 137],
  ['plantain', ['tostones', 'bannann', 'mofongo'], 'plantain-green-fried', 118],
  ['plantain', ['maduros', 'plantain'], 'plantain-ripe-fried', 169],
  ['starch', ['sweet potato'], 'sweet-potato', 200],
  ['starch', ['fries'], 'french-fries', 117],
  ['starch', ['potato', 'papas'], 'potato', 148],
  ['starch', ['yuca', 'cassava'], 'yuca', 206],
  ['starch', ['pasta', 'spaghetti', 'mac', 'macaroni', 'noodle'], 'pasta', 124],
  ['starch', ['quinoa'], 'quinoa', 185],
  ['starch', ['oatmeal', 'oats'], 'oatmeal', 234],
  ['starch', ['tortilla'], 'corn-tortilla', 48],
  ['corn', ['corn'], 'corn', 103],
  ['bread', ['cuban sandwich', 'grits', 'biscuit', 'bagel', 'arepa', 'baleada', 'pupusa', 'roti', 'dumpling', 'festival', 'bammy', 'patty', 'pate', 'empanada', 'pita', 'crackers', 'wrap', 'pizza', 'pancake', 'cereal'], null, 0],
  ['bread', ['cheeseburger', 'burger'], 'burger-bun', 44],
  ['bread', ['toast', 'bread', 'sandwich', 'pan'], 'white-bread', 58],
  ['protein', ['shrimp'], 'shrimp', 85],
  ['protein', ['salmon'], 'salmon', 85],
  ['protein', ['fish', 'pescado', 'poisson', 'tilapia'], 'white-fish', 85],
  ['protein', ['picadillo', 'ground beef', 'meatball', 'cheeseburger', 'burger'], 'ground-beef', 85],
  ['protein', ['steak', 'beef', 'vaca', 'res', 'carne', 'palomilla', 'ropa vieja', 'bistec'], 'steak', 85],
  ['protein', ['pork', 'pernil', 'griot', 'lechon'], 'pork-loin', 85],
  ['protein', ['chicken', 'pollo', 'gallina'], 'chicken-thigh', 85],
  ['unpriced', ['breakfast sandwich', 'sausage', 'bacon', 'ham', 'hot dog', 'pepperoni', 'chorizo', 'gravy', 'turkey', 'goat', 'saltfish', 'ackee', 'tuna', 'sardine', 'croqueta', 'cream cheese', 'peanut butter', 'sancocho', 'ajiaco', 'pho', 'congee', 'ramen'], null, 0],
  ['egg', ['fried egg'], 'egg-fried', 92],
  ['egg', ['egg', 'omelet', 'huevo'], 'egg', 100],
  ['cheese', ['queso'], 'queso-fresco', 28],
  ['cheese', ['cheese', 'cheeseburger', 'cheddar'], 'cheddar', 28],
  ['greens', ['collards', 'okra', 'cabbage', 'callaloo', 'curtido', 'spinach', 'carrots', 'green banana'], null, 0],
  ['greens', ['salad', 'ensalada', 'greens'], 'lettuce', 47],
  ['vegetables', ['broccoli'], 'broccoli', 78],
  ['vegetables', ['vegetables', 'vegetable', 'legim'], 'mixed-vegetables', 91],
  ['tomato', ['tomato'], 'tomato', 62],
  ['avocado', ['avocado'], 'avocado', 75],
  ['fat', ['olive oil'], 'olive-oil', 13.5],
  ['fat', ['butter'], 'butter', 14.2],
  ['milk', ['milk', 'leche'], 'milk', 244],
  ['sweet', ['cake', 'flan', 'tres leches', 'pastelito', 'dulce', 'sundae', 'churro', 'pudding', 'guayaba', 'ice cream', 'cookie', 'granola', 'chocolate', 'syrup', 'smoothie', 'juice', 'jugo', 'soda', 'tea', 'coffee', 'cafecito', 'café', 'cafe', 'colada', 'cortadito', 'batido', 'malta', 'wine', 'beer', 'rum', 'mojito', 'yogurt', 'nuts', 'almonds', 'walnuts', 'flax', 'popcorn', 'chips', 'fruit', 'banana', 'berries', 'apple', 'mango', 'avena', 'akasan'], null, 0],
]
const word = (words: string[]) => new RegExp(`(?<!\\p{L})(?:${words.join('|')})(?:s|es)?(?!\\p{L})`, 'iu')
const ROWS = PARTS.map(([group, words, food, g]) => ({ group, re: word(words), food, g }))
// The add-beans move puts half a cup of black beans on the plate, so the plate Grumble suggests carries it.
const BEANS_SIDE = { food: 'black-beans', g: 86 }

const r2 = (n: number) => Math.round(n * 100) / 100

// Estimated home-cooked cost of the plate as Grumble suggests it (the dish plus any add-beans side).
// undefined = something on the plate has no published price, or nothing on it could be named.
function estimate(d: Dish): Cost | undefined {
  const seen = new Set<string>(), parts: { food: string | null; g: number }[] = []
  for (const row of ROWS) if (!seen.has(row.group) && row.re.test(d.name)) { seen.add(row.group); parts.push(row) }
  if (movesFor(d).ids.includes('add-beans')) parts.push(BEANS_SIDE)
  if (!parts.length || parts.some(p => !p.food || PRICE.get(p.food) == null)) return undefined
  return { usd: r2(parts.reduce((s, p) => s + PRICE.get(p.food!)! * p.g / 100, 0)), basis: 'estimated' }
}
const COSTS = new Map(dishes.map(d => [d.id, estimate(d)]))
export const dishCost = (id: string) => COSTS.get(id)

// 21 meals a week; a meal out costs a typical restaurant plate, about $20 with tax and tip (06 §Fund a week:
// "8 x ~$20 incl. tax and tip"). The rest of the week's food money is spread over the meals eaten at home.
export const MEALS_PER_WEEK = 21
export const RESTAURANT_PLATE_USD = 20
export function perMealUsd(g: Graph): number | undefined {
  const budget = g.risks.money?.weekly_food_budget_usd
  if (budget == null) return undefined
  const out = Math.min(g.risks.convenience?.meals_out_per_week ?? 0, MEALS_PER_WEEK - 1)
  return r2(Math.max(budget - out * RESTAURANT_PLATE_USD, 0) / (MEALS_PER_WEEK - out))
}

// 05 p8's threshold: a weekly budget under $70 is tight enough that the cost-saving moves come first.
export const TIGHT_BUDGET_USD = 70
export const tightBudget = (g: Graph) => (g.risks.money?.weekly_food_budget_usd ?? Infinity) < TIGHT_BUDGET_USD

// With a budget, a dish fits when its estimated cost is at or under the per-meal amount; unpriced dishes don't fit.
export const fits = (id: string, perMeal: number | undefined) => perMeal == null || (dishCost(id)?.usd ?? Infinity) <= perMeal

// Last resort when nothing in the rotation fits: the cheapest priced lunch or dinner in dishes.json.
export const cheapestDinner = () => dishes
  .filter(d => ['dinner', 'lunch'].includes(d.typical_meal_type) && dishCost(d.id))
  .sort((a, b) => dishCost(a.id)!.usd - dishCost(b.id)!.usd)[0]!

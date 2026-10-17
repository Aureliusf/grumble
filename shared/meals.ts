// A freeform meal ("a cup of rice, a palm of chicken, a cup of beans") as items with nutrients.
// Simple foods come from data/components.json (USDA FoodData Central, per 100 g); prepared dishes from
// data/dishes.json scaled by portion. Claude only splits the text and estimates grams; the numbers are computed here.
import componentsFile from '../data/components.json'
import dishesFile from '../data/dishes.json'
import type { Dish } from './types'
import { scale, sum, type Nutrients } from './nutrition'

export interface Component { id: string; name: string; per_100g: Nutrients; measures: { measure: string; g: number }[] }
export const COMPONENTS = componentsFile.components as Component[]
const componentById = new Map(COMPONENTS.map(c => [c.id, c]))
const dishById = new Map((dishesFile.dishes as Dish[]).map(d => [d.id, d]))

export interface LoggedItem {
  kind: 'component' | 'dish'
  id: string
  grams?: number | null      // components: grams eaten
  portion?: number | null    // dishes: fraction of the typical plate
  said: string               // the words it came from, e.g. "a cup of rice"
}

export interface PricedItem extends LoggedItem { name: string; n: Nutrients }

export function priceItem(i: LoggedItem): PricedItem | null {
  if (i.kind === 'component') {
    const c = componentById.get(i.id)
    const g = Math.min(Math.max(i.grams ?? 0, 0), 2000)
    if (!c || !g) return null
    return { ...i, grams: Math.round(g), name: c.name, n: scale(c.per_100g, g / 100) }
  }
  const d = dishById.get(i.id)
  const p = Math.min(Math.max(i.portion ?? 1, 0.25), 3)
  if (!d) return null
  return { ...i, portion: p, name: d.name, n: scale(d, p) }
}

export const totalOf = (items: PricedItem[]) => sum(items.map(i => i.n))

// Household measures Claude may use, anchored to USDA weights where USDA lists one.
export const HAND_MEASURES = 'palm of meat, chicken or fish ≈ 85 g (3 oz, USDA); a cup of cooked rice ≈ 158 g, of cooked beans ≈ 172 g (USDA); a fist ≈ 1 cup; a cupped hand ≈ 1/2 cup; a thumb ≈ 1 tablespoon'

// No key: split on commas and "and"/"y", match each piece to a food or dish by shared words,
// and assume one USDA measure (or one plate). Rough, but it never shows an empty day.
export function localParse(text: string, dishes: Dish[]): LoggedItem[] {
  const words = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter(w => w.length > 2)
  const ALIAS: Record<string, string> = { arroz: 'white-rice', rice: 'white-rice', pollo: 'chicken-breast', chicken: 'chicken-breast', frijoles: 'black-beans', beans: 'black-beans', huevo: 'egg', egg: 'egg', ensalada: 'lettuce', salad: 'lettuce', pescado: 'white-fish', fish: 'white-fish', maduros: 'plantain-ripe-fried', tostones: 'plantain-green-fried', papas: 'french-fries', fries: 'french-fries', aguacate: 'avocado', avocado: 'avocado', pan: 'white-bread', bread: 'white-bread' }
  return text.split(/,|\band\b|\by\b|\+/i).map(s => s.trim()).filter(Boolean).flatMap((piece): LoggedItem[] => {
    const w = words(piece)
    const alias = w.map(x => ALIAS[x]).find(Boolean)
    const dish = dishes.map(d => ({ d, s: words(d.name).filter(x => w.includes(x)).length })).sort((a, b) => b.s - a.s)[0]
    if (dish && dish.s >= 2) return [{ kind: 'dish', id: dish.d.id, portion: 1, said: piece }]
    if (alias) {
      const c = componentById.get(alias)!
      return [{ kind: 'component', id: alias, grams: c.measures[0]?.g ?? 100, said: piece }]
    }
    return []
  })
}

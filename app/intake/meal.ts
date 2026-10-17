// One meal in the person's words → its parts (USDA foods or whole dishes) and when it's eaten.
// Claude does it through POST /api/log; with no key, the same word match as Today stands in.
import type { Dish } from '#shared/types'
import { localParse, priceItem, type PricedItem } from '#shared/meals'
import { slotFor } from './rules'

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealSlot = typeof MEAL_SLOTS[number]

export interface MealParse {
  label: string          // their words, cleaned up
  items: PricedItem[]
  meal_type: MealSlot
  cuisine: string
  say: string            // Grumble's one line back
}

// The parts speak for themselves; the line is only for a meal with none found.
export function localMeal(text: string, dishes: Dish[], noMatch: string): MealParse {
  const items = localParse(text, dishes).map(priceItem).filter((x): x is PricedItem => !!x)
  const dish = dishes.find(d => items.some(i => i.kind === 'dish' && i.id === d.id))
  return { label: text.trim(), items, meal_type: dish ? slotFor(dish) : 'dinner', cuisine: dish?.cuisine ?? '', say: items.length ? '' : noMatch }
}

// Keep the dish whole when the meal is one dish from dishes.json; otherwise it's their own meal, in their words.
export const loveKey = (m: MealParse) => (m.items.length === 1 && m.items[0]!.kind === 'dish' ? m.items[0]!.id : m.label)

// One meal in the person's words → a dish from dishes.json.
// Claude does it through POST /api/meal; with no key, a word match stands in.
import type { Dish } from '#shared/types'

export interface MealMatch {
  dish_id: string        // an id from dishes.json, or 'none'
  meal: string           // their words, cleaned up
  cuisine: string
  say: string            // Grumble's one line back
}

const words = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 2)

export function localMatch(text: string, dishes: Dish[], line: (dish: Dish | null) => string): MealMatch {
  const said = new Set(words(text))
  let best: Dish | null = null
  let score = 0
  for (const d of dishes) {
    const s = words(`${d.id} ${d.name}`).filter(w => said.has(w)).length
    if (s > score) { best = d; score = s }
  }
  return { dish_id: best?.id ?? 'none', meal: text.trim(), cuisine: best?.cuisine ?? '', say: line(best) }
}

import type { Lang, MenuItem } from '../shared/types'
import { dishById } from './data'
import { movesFor } from './moves'
import { shortDish, t } from './copy'

// The five Tuesday plates (06 §The menu), mapped to real dishes.json rows; nothing invented.
export const MENU_IDS = [
  'vaca-frita-with-rice-and-black-beans',
  'grilled-chicken-with-salad-and-black-beans',
  'grilled-fish-with-rice-and-salad',
  'picadillo-with-white-rice-and-maduros',
  'black-bean-soup-with-a-little-white-rice',
]

export const menu = (lang: Lang): MenuItem[] => MENU_IDS.map(id => {
  const d = dishById.get(id)!, plan = movesFor(d), p = plan.portion
  return {
    dish_id: id, name: d.name, applied_moves: plan.ids,
    move: t(lang, `moves.${plan.ids[0] ?? 'as-is'}`, { dish: shortDish(d.name).toLowerCase() }),
    calories: Math.round(p.calories), carbs_g: Math.round(p.carbs_g), fiber_g: Math.round(p.fiber_g),
  }
})

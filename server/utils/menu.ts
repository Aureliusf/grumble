import type { Dish, Lang, MenuItem } from '../shared/types'
import { dishById } from './data'
import { movesFor } from './moves'
import { cap, shortDish, t } from './copy'
import { dishCost } from './cost'

// The five Tuesday plates (06 §The menu), mapped to real dishes.json rows; nothing invented.
export const MENU_IDS = [
  'vaca-frita-with-rice-and-black-beans',
  'grilled-chicken-with-salad-and-black-beans',
  'grilled-fish-with-rice-and-salad',
  'picadillo-with-white-rice-and-maduros',
  'black-bean-soup-with-a-little-white-rice',
]

// Moves that also save money: beans are the cheapest thing on the plate, and a shared plate is two dinners.
const COST_SAVING = ['add-beans', 'share-it']

// Every move in the plan, so the line matches the numbers; "as is" only when nothing else applies.
// costFirst (a tight budget) puts the money-saving moves first.
export const moveText = (d: Dish, lang: Lang, costFirst = false) => {
  const ids = movesFor(d).ids.filter(id => id !== 'as-is')
  if (costFirst) ids.sort((a, b) => Number(COST_SAVING.includes(b)) - Number(COST_SAVING.includes(a)))
  return (ids.length ? ids : ['as-is']).map(id => cap(t(lang, `moves.${id}`, { dish: shortDish(d.name).toLowerCase() }))).join(' ')
}

export const menu = (lang: Lang, costFirst = false): MenuItem[] => MENU_IDS.map(id => {
  const d = dishById.get(id)!, plan = movesFor(d), p = plan.portion
  return {
    dish_id: id, name: d.name, applied_moves: plan.ids,
    move: moveText(d, lang, costFirst),
    calories: Math.round(p.calories), carbs_g: Math.round(p.carbs_g), fiber_g: Math.round(p.fiber_g),
    cost: dishCost(id),
  }
})

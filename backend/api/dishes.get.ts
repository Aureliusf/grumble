import { defineEventHandler, getQuery } from 'h3'
import { dishes, graphs } from '../utils/data'

// All 127 by default; ?cuisine= filters; ?person_id= puts that person's loves and rotation first.
export default defineEventHandler(event => {
  const { cuisine, person_id } = getQuery(event) as { cuisine?: string; person_id?: string }
  const g = person_id ? graphs[person_id] as unknown as { risks: { taste?: { loves?: string[] } }; dishes: { rotation: { dish_id: string }[] } } : undefined
  const mine = new Set([...(g?.risks.taste?.loves ?? []), ...(g?.dishes.rotation.map(r => r.dish_id) ?? [])])
  return dishes
    .filter(d => !cuisine || d.cuisine.toLowerCase() === cuisine.toLowerCase())
    .map(({ id, name, cuisine, typical_meal_type, calories, carbs_g, protein_g, fat_g, fiber_g, mediterranean_style }) =>
      ({ id, name, cuisine, typical_meal_type, calories, carbs_g, protein_g, fat_g, fiber_g, mediterranean_style }))
    .sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)))
})

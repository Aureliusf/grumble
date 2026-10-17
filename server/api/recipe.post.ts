// POST /api/recipe { dish_id } → the dish as foods from data/components.json with grams for one typical plate,
// scaled so they add up to the dish's calories in dishes.json (shared/recipe.ts).
// Order: data/dish-components.json (precomputed, no network) → memory → Claude. 503 without a key and no precomputed parts.
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import dishesFile from '../../data/dishes.json'
import precomputed from '../../data/dish-components.json'
import { COMPONENTS } from '../../shared/meals'
import { partsToDish, type Part } from '../../shared/recipe'
import type { Dish } from '../../shared/types'

const DISHES = dishesFile.dishes as Dish[]
const byId = new Map(DISHES.map(d => [d.id, d]))
const IDS = COMPONENTS.map(c => c.id) as [string, ...string[]]
const memory = new Map<string, Part[]>(Object.entries((precomputed as { dishes: Record<string, Part[]> }).dishes))

const Parts = z.object({ parts: z.array(z.object({ id: z.enum(IDS), grams: z.number() })) })

// Frozen so the list caches across requests.
const SYSTEM = `You split a restaurant dish into its parts for a nutrition app. Use ONLY foods from the FOODS list, by id, and give the cooked, edible grams of each part on one typical plate as served in Miami. Pick the closest food when the exact one isn't listed (chicharrón or chorizo → pork-loin; arepa → corn-tortilla; plantain sides → the right plantain id). Include cooking fat only when it is a visible part of the dish. 2 to 7 parts. Use the USDA measures beside each food to size the parts.

FOODS (id | name | USDA measures):
${COMPONENTS.map(c => `${c.id} | ${c.name} | ${c.measures.slice(0, 3).map(m => `${m.measure} = ${m.g} g`).join('; ')}`).join('\n')}`

let client: Anthropic | null = null

export default defineEventHandler(async (event) => {
  const body = await readBody<{ dish_id?: string }>(event)
  const dish = body?.dish_id ? byId.get(body.dish_id) : undefined
  if (!dish) throw createError({ statusCode: 404, statusMessage: 'dish not found' })

  let parts = memory.get(dish.id)
  if (!parts) {
    if (!process.env.ANTHROPIC_API_KEY) throw createError({ statusCode: 503, statusMessage: 'no ANTHROPIC_API_KEY and no precomputed parts' })
    client ??= new Anthropic()
    try {
      const res = await client.beta.messages.parse({
        model: 'claude-opus-5-5',
        max_tokens: 2000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: betaZodOutputFormat(Parts) },
        cache_control: { type: 'ephemeral' },
        system: SYSTEM,
        messages: [{ role: 'user', content: `Dish: ${dish.name} (${dish.cuisine}). Whole plate: ${Math.round(dish.calories)} kcal, ${Math.round(dish.carbs_g)} g carbs, ${Math.round(dish.protein_g)} g protein, ${Math.round(dish.fat_g)} g fat.` }],
      })
      if (res.stop_reason === 'refusal' || !res.parsed_output?.parts.length) throw createError({ statusCode: 502, statusMessage: 'no parts returned' })
      parts = res.parsed_output.parts.map(p => ({ id: p.id, grams: Math.max(1, Math.round(p.grams)) }))
      memory.set(dish.id, parts)
    }
    catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw createError({ statusCode: 503, statusMessage: 'invalid ANTHROPIC_API_KEY' })
      if (err instanceof Anthropic.RateLimitError) throw createError({ statusCode: 429, statusMessage: 'rate limited' })
      if (err instanceof Anthropic.APIError) throw createError({ statusCode: 502, statusMessage: `Claude API error ${err.status}` })
      throw err
    }
  }
  return { dish_id: dish.id, parts, items: partsToDish(parts, dish) }
})

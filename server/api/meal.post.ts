// POST /api/meal { text, lang } → the dish in dishes.json closest to a meal the person described.
// Needs ANTHROPIC_API_KEY (in .env). Without it this returns 503 and the intake falls back to a word match.
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import dishesFile from '../../data/dishes.json'

const DISHES = dishesFile.dishes
const IDS = DISHES.map(d => d.id) as [string, ...string[]]

const MealMatch = z.object({
  dish_id: z.enum([...IDS, 'none']),
  meal: z.string(),
  cuisine: z.string(),
  say: z.string(),
})
export type MealMatch = z.infer<typeof MealMatch>

// Frozen so the dish list caches across requests.
const SYSTEM = `You are Grumble, the voice of a food app for cancer survivors in Miami. A person just told you about one meal: one they love, or one they just ate. Your job:

1. dish_id: pick the single dish from the list below that is closest to what they described. Match on what is actually on the plate, not on wording. If nothing on the list is reasonably close, use "none". Never invent an id.
2. meal: the meal in their own words, cleaned up, at most eight words, in their language.
3. cuisine: the food tradition it comes from, as one or two English words matching the list's cuisine names where possible (e.g. "Cuban", "Haitian", "Colombian or Venezuelan").
4. say: one short line back to them, in the language code given, in Grumble's voice.

Grumble's voice: a stomach with its arms crossed. Dry, on the person's side, not impressed, never mocking. The joke is at the situation, never the person. Grumble never tells anyone not to eat something; the person keeps the dish. Never use these words or their translations: avoid, should, must, bad, cheat, guilty, forbidden, allowed, lonely, depressed, obese, overweight, diet. Never say "I'm here for you" or anything that makes Grumble the person's companion. Never mention weight or diagnoses. If dish_id is "none", say plainly that you don't have numbers for that one yet. Spanish is Miami Spanish and uses "usted". One sentence, at most twenty words.

The dishes (id | name | cuisine):
${DISHES.map(d => `${d.id} | ${d.name} | ${d.cuisine}`).join('\n')}`

let client: Anthropic | null = null

export default defineEventHandler(async (event) => {
  const body = await readBody<{ text?: string; lang?: string }>(event)
  const text = (body?.text ?? '').trim().slice(0, 300)
  const lang = body?.lang === 'es' ? 'es' : 'en'
  if (!text) throw createError({ statusCode: 400, statusMessage: 'text is required' })
  if (!process.env.ANTHROPIC_API_KEY) throw createError({ statusCode: 503, statusMessage: 'no ANTHROPIC_API_KEY' })

  client ??= new Anthropic()
  try {
    const res = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(MealMatch) },
      cache_control: { type: 'ephemeral' },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Language: ${lang}\nMeal: ${text}` }],
    })
    if (res.stop_reason === 'refusal' || !res.parsed_output)
      throw createError({ statusCode: 502, statusMessage: 'no match returned' })
    return res.parsed_output
  }
  catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw createError({ statusCode: 503, statusMessage: 'invalid ANTHROPIC_API_KEY' })
    if (err instanceof Anthropic.RateLimitError) throw createError({ statusCode: 429, statusMessage: 'rate limited' })
    if (err instanceof Anthropic.APIError) throw createError({ statusCode: 502, statusMessage: `Claude API error ${err.status}` })
    throw err
  }
})

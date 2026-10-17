// POST /api/log { text, lang } → what the person ate, as items with nutrients.
// Claude splits the text into foods from data/components.json (USDA) or dishes from data/dishes.json and
// estimates the amount; shared/meals.ts does the math. Needs ANTHROPIC_API_KEY; 503 without it (the page falls back).
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import dishesFile from '../../data/dishes.json'
import { COMPONENTS, HAND_MEASURES, priceItem, totalOf, type PricedItem } from '../../shared/meals'

const DISHES = dishesFile.dishes
const IDS = [...COMPONENTS.map(c => c.id), ...DISHES.map(d => d.id)] as [string, ...string[]]

const Parsed = z.object({
  label: z.string(),
  items: z.array(z.object({
    kind: z.enum(['component', 'dish']),
    id: z.enum(IDS),
    grams: z.number().nullable(),
    portion: z.number().nullable(),
    said: z.string(),
  })),
  say: z.string(),
})

// Frozen so both lists cache across requests.
const SYSTEM = `You are Grumble, the voice of a food app for cancer survivors in Miami. A person tells you what they just ate, in their own words, often with household amounts ("a cup of rice", "a palm of chicken", "half a plate"). Turn it into items.

Rules for items:
- Prefer simple foods from FOODS when the person lists the parts of a plate (rice, chicken, beans, salad). Use kind "component", the food's id, and grams: your best estimate of the cooked, edible amount eaten. Set portion to null.
- Use a dish from DISHES only when they name a prepared dish as a whole ("a Cuban sandwich", "vaca frita", "a cheeseburger and fries"). Use kind "dish", the dish id, and portion: the fraction of a typical restaurant plate (1 = a normal plate, 0.5 = half). Set grams to null.
- Convert household amounts to grams with these anchors: ${HAND_MEASURES}. Each food's USDA measures are listed beside it; use them.
- No amount given: assume one ordinary serving.
- Never invent an id. If something isn't on either list, use the closest food on the lists and keep their words in "said".
- said: the few words from their text that this item came from.

label: the meal named the way they'd say it, at most six words, in the language code given.
say: one short line back to them, in that language, in Grumble's voice: a stomach with its arms crossed, dry, on their side, never mocking, joke at the situation not the person. Grumble never says don't; the person keeps the food. Never use: avoid, should, must, bad, cheat, guilty, forbidden, allowed, diet, or their translations. Never mention weight. Spanish is Miami Spanish with "usted". At most twenty words.

FOODS (id | name | USDA measures):
${COMPONENTS.map(c => `${c.id} | ${c.name} | ${c.measures.slice(0, 3).map(m => `${m.measure} = ${m.g} g`).join('; ')}`).join('\n')}

DISHES (id | name | cuisine):
${DISHES.map(d => `${d.id} | ${d.name} | ${d.cuisine}`).join('\n')}`

export interface LogResponse { label: string; items: PricedItem[]; total: ReturnType<typeof totalOf>; say: string }

let client: Anthropic | null = null

export default defineEventHandler(async (event): Promise<LogResponse> => {
  const body = await readBody<{ text?: string; lang?: string }>(event)
  const text = (body?.text ?? '').trim().slice(0, 400)
  const lang = body?.lang === 'es' ? 'es' : 'en'
  if (!text) throw createError({ statusCode: 400, statusMessage: 'text is required' })
  if (!process.env.ANTHROPIC_API_KEY) throw createError({ statusCode: 503, statusMessage: 'no ANTHROPIC_API_KEY' })

  client ??= new Anthropic()
  try {
    const res = await client.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(Parsed) },
      cache_control: { type: 'ephemeral' },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Language: ${lang}\nWhat they ate: ${text}` }],
    })
    const out = res.parsed_output
    if (res.stop_reason === 'refusal' || !out) throw createError({ statusCode: 502, statusMessage: 'nothing parsed' })
    const items = out.items.map(priceItem).filter((x): x is PricedItem => !!x)
    if (!items.length) throw createError({ statusCode: 422, statusMessage: 'no foods recognized' })
    return { label: out.label, items, total: totalOf(items), say: out.say }
  }
  catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw createError({ statusCode: 503, statusMessage: 'invalid ANTHROPIC_API_KEY' })
    if (err instanceof Anthropic.RateLimitError) throw createError({ statusCode: 429, statusMessage: 'rate limited' })
    if (err instanceof Anthropic.APIError) throw createError({ statusCode: 502, statusMessage: `Claude API error ${err.status}` })
    throw err
  }
})

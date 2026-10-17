import type { Dish, FoodGraph } from '#shared/types'
import { balanceDay, slotOf, SLOTS, usualDay, type Slot } from '#shared/balance'
import { dailyTargets, type Sex } from '#shared/nutrition'
import { fixtures } from '~/fixtures'

export interface Eaten { slot: Slot; dish_id: string; said: string }

const KEY = 'grumble.eaten'

// What the person said they ate today. Part of the day log beside the graph (05 §Data written per day).
export function useEaten() {
  const eaten = useState<Eaten[]>('eaten', () => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Eaten[] }
    catch { return [] }
  })
  watch(eaten, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }, { deep: true })
  return eaten
}

type Person = FoodGraph['person'] & { age?: number; sex?: Sex; food_background?: string }
type Risks = { taste?: { refuses?: string[]; loves?: string[] } }

// The day, balanced: the plan around the meal they love, and today around what they actually ate.
export function useDay(personId: string) {
  const graph = useGraph(personId)
  const { data: dishes } = useApi<Dish[]>('/api/dishes', fixtures.dishes)
  const eaten = useEaten()

  const byId = computed(() => new Map(dishes.value.map(d => [d.id, d])))
  const person = computed(() => graph.value.person as Person)
  const targets = computed(() => dailyTargets(person.value.age, person.value.sex))
  const common = computed(() => ({
    dishes: dishes.value,
    targets: targets.value,
    cuisine: person.value.food_background,
    refuses: (graph.value as { risks?: Risks }).risks?.taste?.refuses ?? [],
  }))

  // The meal they love: the starred rotation dish (dinner first), else the first one with numbers.
  const anchor = computed(() => {
    const rot = graph.value.dishes.rotation
      .map(r => ({ r, d: byId.value.get(r.dish_id) }))
      .filter((x): x is { r: typeof x.r; d: Dish } => !!x.d && !!(SLOTS.includes(x.r.slot as Slot) ? x.r.slot : slotOf(x.d)))
    const pick = rot.find(x => x.r.star && x.r.slot === 'dinner') ?? rot.find(x => x.r.star) ?? rot[0]
    if (!pick) return null
    const slot = (SLOTS.includes(pick.r.slot as Slot) ? pick.r.slot : slotOf(pick.d)) as Slot
    return { slot, dish: pick.d }
  })

  const plan = computed(() => balanceDay({ ...common.value, fixed: anchor.value ? [anchor.value] : [] }))

  const today = computed(() => {
    const ate = eaten.value
      .map(e => ({ slot: e.slot, dish: byId.value.get(e.dish_id) }))
      .filter((x): x is { slot: Slot; dish: Dish } => !!x.dish)
    return ate.length ? balanceDay({ ...common.value, fixed: ate }) : plan.value
  })

  // The same fixed plates with ordinary plates around them, for the what-if comparison.
  const usual = computed(() => usualDay(today.value.plates.filter(p => p.fixed), dishes.value, targets.value, person.value.food_background))

  return { graph, dishes, person, targets, anchor, plan, today, usual, eaten }
}

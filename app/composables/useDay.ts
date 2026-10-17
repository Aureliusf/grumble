import type { Dish, FoodGraph } from '#shared/types'
import { balanceDay, slotOf, SLOTS, usualDay, type Slot } from '#shared/balance'
import { dailyTargets, type Sex } from '#shared/nutrition'
import { mealFromParts, totalOf, unslug, type PricedItem } from '#shared/meals'
import { fixtures } from '~/fixtures'

// One meal the person logged: what they said, and the foods it came to.
export interface Eaten { slot: Slot; label: string; said: string; items: PricedItem[] }

const KEY = 'grumble.eaten'

// The meal the next-meal simulator is showing: planned, not eaten. Shared so every view agrees; not saved.
export const usePendingMeal = () => useState<{ slot: Slot; dish_id: string; portion: number } | null>('pendingMeal', () => null)

// What the person said they ate today. Part of the day log beside the graph (05 §Data written per day).
export function useEaten() {
  const eaten = useState<Eaten[]>('eaten', () => {
    // Entries from before freeform logging (dish_id only) are dropped.
    try { return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as Eaten[]).filter(e => Array.isArray(e.items)) }
    catch { return [] }
  })
  watch(eaten, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }, { deep: true })
  return eaten
}

const loggedDish = (e: Eaten): Dish => ({
  ...totalOf(e.items), id: `logged-${e.slot}`, name: e.label, cuisine: '', typical_meal_type: e.slot, mediterranean_style: false,
})

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
      .map(r => ({ r, d: byId.value.get(r.dish_id) ?? (r.portion_override ? mealFromParts(r.dish_id, unslug(r.dish_id), r.portion_override, r.slot as Dish['typical_meal_type']) : null) }))
      .filter((x): x is { r: typeof x.r; d: Dish } => !!x.d && !!(SLOTS.includes(x.r.slot as Slot) ? x.r.slot : slotOf(x.d)))
    const pick = rot.find(x => x.r.star && x.r.slot === 'dinner') ?? rot.find(x => x.r.star) ?? rot[0]
    if (!pick) return null
    const slot = (SLOTS.includes(pick.r.slot as Slot) ? pick.r.slot : slotOf(pick.d)) as Slot
    return { slot, dish: pick.d }
  })

  const plan = computed(() => balanceDay({ ...common.value, fixed: anchor.value ? [anchor.value] : [] }))

  // A logged meal becomes a plate of its own, with the summed numbers of what was in it.
  const ate = computed(() => eaten.value.map(e => ({ slot: e.slot, dish: loggedDish(e) })))

  // Meals before the latest logged one that weren't logged are past: skipped, not planned, not counted.
  const skipped = computed<Slot[]>(() => {
    if (!eaten.value.length) return []
    const last = Math.max(...eaten.value.map(e => SLOTS.indexOf(e.slot)))
    return SLOTS.slice(0, last).filter(s => !eaten.value.some(e => e.slot === s))
  })

  // Today from what was eaten alone: the next-meal simulator recommends from this.
  const todayEaten = computed(() => (ate.value.length ? balanceDay({ ...common.value, fixed: ate.value, skip: skipped.value }) : plan.value))

  // Today as everyone else shows it: eaten meals, plus the meal being simulated as a pending plate.
  const pending = usePendingMeal()
  const today = computed(() => {
    const p = pending.value
    const d = p && !eaten.value.some(e => e.slot === p.slot) ? byId.value.get(p.dish_id) : undefined
    if (!d || !p) return todayEaten.value
    return balanceDay({ ...common.value, fixed: [...ate.value, { slot: p.slot, dish: d, portion: p.portion, pending: true }], skip: skipped.value })
  })

  // The same fixed plates with ordinary plates around them, for the what-if comparison.
  const usual = computed(() => usualDay(today.value.plates.filter(p => p.fixed), dishes.value, targets.value, person.value.food_background))

  return { graph, dishes, person, targets, anchor, plan, today, todayEaten, usual, eaten, pending, skipped }
}

<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'
import type { Dish } from '#shared/types'
import { isLean, mealBudget, plate, portionFor, slotOf, SLOTS, type Slot } from '#shared/balance'
import { sum, type Nutrients } from '#shared/nutrition'
import { peakDelta } from '#shared/simulate'
import { COMPONENTS, type PricedItem } from '#shared/meals'
import { howToEat, partsToDish, type Part } from '#shared/recipe'
import precomputed from '~~/data/dish-components.json'

// After a meal is logged: simulate the next one. Pick any dish (the balanced day's pick comes first);
// Grumble works out how much of it fits what's left of the day, and shows the numbers, where the day
// lands, and the rise for people like you. Nothing is saved; logging the meal is still the box above.
const PERSON = 'N0771'
const { t, te } = useI18n()
const { todayEaten: day, eaten, dishes, targets, graph, person, pending } = useDay(PERSON)
const { mealsOf } = useDayGlucose(PERSON)

const slots = computed(() => eaten.value.map(e => e.slot))
const slot = computed<Slot | null>(() => {
  if (!slots.value.length) return null
  const last = Math.max(...slots.value.map(s => SLOTS.indexOf(s)))
  return SLOTS.slice(last + 1).find(s => !slots.value.includes(s)) ?? null
})
// Meals still ahead today: the ones after the latest logged. An unlogged breakfast at dinner time isn't coming.
const open = computed(() => {
  const last = Math.max(...slots.value.map(s => SLOTS.indexOf(s)))
  return SLOTS.slice(last + 1).filter(s => !slots.value.includes(s))
})
const recommended = computed(() => (slot.value ? day.value.plates.find(p => p.slot === slot.value && !p.fixed) : undefined))
const byId = computed(() => new Map(dishes.value.map(d => [d.id, d])))
const fits = (d: Dish) => !!slot.value && (slot.value === 'breakfast' ? slotOf(d) === 'breakfast' : slotOf(d) === 'lunch' || slotOf(d) === 'dinner')

const ateTotals = computed(() => sum(day.value.plates.filter(p => p.fixed).map(p => p.n)))
const budget = computed(() => (slot.value ? mealBudget(targets.value, ateTotals.value, slot.value, open.value) : null))

// A dish's parts: precomputed for all 127 (data/dish-components.json); /api/recipe only fills a gap.
const PRE = (precomputed as { dishes: Record<string, Part[]> }).dishes
const recipes = useState<Record<string, PricedItem[] | null>>('recipes', () => ({}))
const partsOf = (d: Dish): PricedItem[] | null => (PRE[d.id] ? partsToDish(PRE[d.id]!, d) : recipes.value[d.id] ?? null)

// The plate Grumble would serve of a dish: trimmed first/then/last when its parts are known, else the whole dish scaled.
function served(d: Dish) {
  const b = budget.value!
  const items = partsOf(d)
  if (items) { const how = howToEat(items, b); return { how, n: how.n, portion: 1 } }
  const portion = portionFor(d, b)
  return { how: null, n: plate(slot.value ?? 'dinner', d, portion).n, portion }
}

// Only dishes that, served that way, keep the day inside its calorie and carb targets (5% slack).
const SLACK = 1.05
const candidates = computed(() => {
  if (!slot.value || !budget.value) return []
  return dishes.value.filter(fits).map(d => ({ d, s: served(d) })).filter(({ s }) => {
    const after = sum([ateTotals.value, s.n])
    return after.calories <= targets.value.calories * SLACK && after.carbs_g <= targets.value.carbs_g * SLACK
  })
})
const candidateIds = computed(() => new Set(candidates.value.map(c => c.d.id)))
// Nothing fits: today's numbers are covered. No next meal is planned; logging stays open above.
const covered = computed(() => !!slot.value && !candidates.value.length)

// Default: the balanced day's pick if it fits, else the fitting dish that comes closest to what's left.
const fallbackId = computed(() => {
  const rec = recommended.value?.dish.id
  if (rec && candidateIds.value.has(rec)) return rec
  const want = budget.value?.calories ?? 0
  return [...candidates.value].sort((a, b) => Math.abs(want - a.s.n.calories) - Math.abs(want - b.s.n.calories))[0]?.d.id ?? ''
})
const picked = ref<string | null>(null)
watch(slot, () => { picked.value = null })
const dishId = computed({
  get: () => (picked.value && candidateIds.value.has(picked.value) ? picked.value : fallbackId.value),
  set: (v: string) => { picked.value = v },
})
const dish = computed(() => byId.value.get(dishId.value))
const isRecommended = computed(() => dishId.value === recommended.value?.dish.id)

const items = computed<SelectMenuItem[][]>(() => {
  if (!slot.value) return []
  const ok = (d: Dish) => candidateIds.value.has(d.id)
  const item = (d: Dish): SelectMenuItem => ({ label: d.name, value: d.id })
  const label = (l: string): SelectMenuItem => ({ type: 'label', label: l })
  const rec = recommended.value?.dish && ok(recommended.value.dish) ? recommended.value.dish : undefined
  const loved = graph.value.dishes.rotation.map(r => byId.value.get(r.dish_id)).filter((d): d is Dish => !!d && ok(d) && d.id !== rec?.id)
  const shown = new Set([rec?.id, ...loved.map(d => d.id)])
  const lean = candidates.value.map(c => c.d).filter(d => isLean(d) && !shown.has(d.id))
  lean.forEach(d => shown.add(d.id))
  const rest = candidates.value.map(c => c.d).filter(d => !shown.has(d.id)).sort((a, b) => a.name.localeCompare(b.name))
  return [
    ...(rec ? [[label(t('next.group_rec')), item(rec)]] : []),
    ...(loved.length ? [[label(t('next.group_yours')), ...loved.map(item)]] : []),
    ...(lean.length ? [[label(t('next.group_lean')), ...lean.map(item)]] : []),
    ...(rest.length ? [[label(t('next.group_all', { slot: t(`day.slots.${slot.value}`).toLowerCase() })), ...rest.map(item)]] : []),
  ]
})

// A dish missing from the precomputed file: ask /api/recipe once.
watch(dishId, async (id) => {
  if (!id || PRE[id] || id in recipes.value) return
  const res = await apiCall<{ items: PricedItem[] } | null>('/api/recipe', () => null, { method: 'POST', body: { dish_id: id } })
  recipes.value = { ...recipes.value, [id]: res?.items?.length ? res.items : null }
}, { immediate: true })

const servedNow = computed(() => (dish.value && budget.value ? served(dish.value) : null))
const how = computed(() => servedNow.value?.how ?? null)
const portion = computed(() => servedNow.value?.portion ?? 1)
const plateN = computed<Nutrients | null>(() => servedNow.value?.n ?? null)
const sim = computed(() => (dish.value && slot.value && plateN.value ? { ...plate(slot.value, dish.value, 1), n: plateN.value } : null))

// Where the day lands with this meal: eaten + this plate (the other open meals aren't counted yet).
const after = computed(() => (sim.value ? sum([ateTotals.value, sim.value.n]) : null))
const peak = computed(() => {
  if (!sim.value) return null
  const m = mealsOf({ plates: [sim.value], totals: sim.value.n, targets: targets.value, heavy: [] })[0]!
  return Math.round(peakDelta(m.n, { group: person.value.blood_sugar_group, dinner: m.dinner, late: m.late, walk_min: m.walk_min }))
})

const QUARTERS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾', '1': '1', '1.25': '1¼', '1.5': '1½' }
const q = (x: number) => QUARTERS[String(Math.round(x * 4) / 4)] ?? String(Math.round(x * 4) / 4)
const howMuch = computed(() => {
  if (how.value) return how.value.lastFactor < 1 || how.value.thenFactor < 1 ? t('next.plate_less') : t('next.plate_one')
  return t(portion.value === 1 ? 'next.plate_one' : 'next.plate_n', { n: q(portion.value) })
})
const heavy = computed(() => day.value.heavy[0]?.dish.name)

// An item's amount in cups when USDA gives a cup weight, else grams.
const cupOf = (id: string) => COMPONENTS.find(c => c.id === id)?.measures.find(m => /^1 cup\b/.test(m.measure))?.g
function amount(id: string, g: number) {
  if (g < 20) return t('next.taste')
  const cup = cupOf(id)
  if (!cup || g < cup / 8) return `${g} g`
  const n = Math.max(0.25, Math.round((g / cup) * 4) / 4)
  return `${q(n)} ${n > 1 ? t('next.cups') : t('next.cup')}`
}
const foodName = (i: PricedItem) => (te(`foods.${i.id}`) ? t(`foods.${i.id}`) : i.name.split(',')[0])

// Whatever the card shows is the planned meal for the rest of the app ("The rest of today", the spike bar).
watch([slot, dishId, plateN, covered], ([s, id, n, c]) => {
  pending.value = s && c ? { slot: s, dish_id: '', portion: 0, covered: true } : s && id && n ? { slot: s, dish_id: id, portion: 1, n } : null
}, { immediate: true })
const r = (n: number) => Math.round(n)
</script>

<template>
  <!-- nothing fits what's left: today's covered; logging above stays open -->
  <div v-if="slot && covered" class="mt-4 rounded-[var(--radius-grumble)] border-2 border-dashed border-cafecito-200 dark:border-crema-800 p-3">
    <p class="text-[15px] font-semibold text-cafecito-700 flex items-center gap-1.5">
      <UIcon name="i-lucide-check" class="size-4" />{{ t('next.covered_title', { slot: t(`day.slots.${slot}`) }) }}
    </p>
    <p class="mt-1 text-[15px] leading-snug">{{ t('next.covered_body') }}</p>
  </div>

  <div v-else-if="slot && dish" class="mt-4 rounded-[var(--radius-grumble)] border-2 border-cafecito-200 dark:border-crema-800 p-3">
    <p class="text-[15px] font-semibold text-cafecito-700 flex items-center gap-1.5">
      <UIcon name="i-lucide-arrow-right" class="size-4" />{{ t('next.title', { slot: t(`day.slots.${slot}`) }) }}
    </p>

    <USelectMenu
      v-model="dishId"
      :items="items"
      value-key="value"
      size="lg"
      class="w-full mt-2"
      :search-input="{ placeholder: t('next.search') }"
      :ui="{ base: 'rounded-full font-display font-semibold' }"
    />
    <p class="mt-1.5 text-[15px] text-crema-800/70 leading-snug">
      <template v-if="isRecommended">{{ heavy ? t('next.why_heavy', { dish: heavy }) : t('next.why_fit') }}</template>
      <template v-else-if="picked === dishId">{{ t('next.why_picked') }}</template>
      <template v-else>{{ t('next.why_closest') }}</template>
      {{ t('next.only_fitting') }}
    </p>

    <div v-if="sim" class="mt-3">
      <p class="font-display font-semibold text-[20px]">{{ t('next.how_much') }} <span class="text-grumble-600">{{ howMuch }}</span></p>
      <!-- how to eat it: each part, first or last, and how much -->
      <ul v-if="how" class="mt-2 flex flex-col gap-1">
        <li v-for="i in how.items" :key="i.id" class="flex items-center gap-2 text-[15px]">
          <UBadge
            :color="i.role === 'first' ? 'primary' : i.role === 'then' ? 'secondary' : 'neutral'"
            variant="soft"
            size="sm"
            class="rounded-full shrink-0 w-[4.5rem] justify-center"
>{{ t(`next.${i.role}`) }}</UBadge>
          <span class="flex-1 truncate">{{ foodName(i) }}</span>
          <span class="shrink-0 tabular" :class="amount(i.id, i.to) !== amount(i.id, i.from) ? 'text-grumble-600 font-semibold' : 'text-crema-800/70'">
            <template v-if="amount(i.id, i.to) !== amount(i.id, i.from)"><s class="text-crema-800/40 font-normal">{{ amount(i.id, i.from) }}</s> → </template>{{ amount(i.id, i.to) }}
          </span>
        </li>
      </ul>
      <MacroTiles :n="sim.n" tone="next" />
      <p v-if="peak !== null" class="mt-1 text-[15px] text-crema-800/80">{{ t('next.peak', { n: peak }) }}</p>
      <p v-if="after" class="mt-2 text-[15px] tabular leading-snug">
        <span class="font-semibold">{{ t('next.day_after') }}</span>
        {{ r(after.calories) }}/{{ targets.calories }} kcal · {{ r(after.carbs_g) }}/{{ targets.carbs_g }} g {{ t('macros.carbs') }} ·
        {{ r(after.protein_g) }}/{{ targets.protein_g }} g {{ t('macros.protein') }} · {{ r(after.fiber_g) }}/{{ targets.fiber_g }} g {{ t('macros.fiber') }}
      </p>
    </div>
  </div>
</template>

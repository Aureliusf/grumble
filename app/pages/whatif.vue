<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'
import type { Dish } from '#shared/types'
import { fixtures } from '~/fixtures'

const PERSON = 'N0771'
const { t, locale } = useI18n()

const graph = useGraph(PERSON)
const { data: dishes } = useApi<Dish[]>(`/api/dishes?person_id=${PERSON}`, fixtures.dishes)
const { state, result } = useWhatIf(PERSON)

const byId = computed(() => new Map(dishes.value.map(d => [d.id, d])))
const rotation = computed(() => graph.value.dishes.rotation)

// Dish picker groups: her rotation first, then Cuban, then the rest by cuisine.
const dishItems = computed<SelectMenuItem[][]>(() => {
  const mine = rotation.value.map(r => byId.value.get(r.dish_id)).filter((d): d is Dish => !!d)
  const mineIds = new Set(mine.map(d => d.id))
  const rest = dishes.value.filter(d => !mineIds.has(d.id))
  const cuisines = [...new Set(rest.map(d => d.cuisine))].filter(c => c !== 'Cuban').sort()
  const label = (l: string): SelectMenuItem => ({ type: 'label', label: l })
  const item = (d: Dish): SelectMenuItem => ({ label: d.name, value: d.id })
  return [
    [label(t('whatif.yours')), ...mine.map(item)],
    [label(t('whatif.all_cuban')), ...rest.filter(d => d.cuisine === 'Cuban').map(item)],
    ...cuisines.map(c => [label(c), ...rest.filter(d => d.cuisine === c).map(item)]),
  ]
})

// Unknown dish (e.g. a table-menu plate not in dishes.json): the three closest names.
const unknownDish = computed(() => dishes.value.length > 0 && !byId.value.has(state.dish_id))
const closest = computed(() => {
  if (!unknownDish.value) return []
  const words = new Set(state.dish_id.split('-'))
  return dishes.value
    .map(d => ({ d, score: d.id.split('-').filter(w => words.has(w)).length }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.d)
})

const minutes = computed({
  get: () => toMinutes(state.time),
  set: (m: number) => { state.time = toHHMM(m) },
})
const walks = [0, 10, 20] as const

const r = computed(() => result.value)
const groupKey = computed(() => (r.value.group === 'type 2 diabetes' ? 't2d' : r.value.group))
const signed = (n: number) => `${n < 0 ? '−' : '+'}${Math.abs(Math.round(n))}%`
const walkLabel = (n: number) => (n ? t('whatif.walk_n', { n }) : t('whatif.no_walk'))
const legendCurrent = computed(() => t('whatif.legend_current', { time: fmtTime(state.time, locale.value), walk: walkLabel(state.walk_min) }))

const moveSentence = computed(() => {
  const parts = r.value.grumble.applied_moves.map(m => t(`moveShort.${m}`))
  return parts.length ? `${capitalize(parts.join(', '))}.` : ''
})
const rotationMove = computed(() => rotation.value.find(x => x.dish_id === state.dish_id)?.move)
const showSameAsTen = computed(() => r.value.same_as_ten && state.walk_min > 10)
</script>

<template>
  <h1 class="font-display font-bold text-[34px] leading-tight">{{ t('whatif.title') }}</h1>

  <!-- controls -->
  <UCard>
    <div class="flex flex-col gap-5">
      <UFormField :label="t('whatif.dish')" :ui="{ label: 'text-[15px] font-semibold' }">
        <USelectMenu
          v-model="state.dish_id"
          :items="dishItems"
          value-key="value"
          size="xl"
          class="w-full"
          :ui="{ base: 'rounded-full' }"
        />
      </UFormField>
      <p v-if="unknownDish" class="text-[15px] text-crema-800/80">
        {{ t('whatif.unknown') }}
        <UButton
          v-for="d in closest"
          :key="d.id"
          size="sm"
          variant="soft"
          color="secondary"
          class="mr-1 mt-1"
          @click="state.dish_id = d.id"
        >{{ d.name }}</UButton>
      </p>

      <div>
        <div class="flex items-baseline justify-between">
          <span class="text-[15px] font-semibold">{{ t('whatif.time') }}</span>
          <span class="font-display font-semibold text-[26px] text-grumble-500 tabular">{{ fmtTime(state.time, locale) }}</span>
        </div>
        <USlider v-model="minutes" :min="17 * 60" :max="23 * 60" :step="30" size="xl" class="mt-2" />
      </div>

      <div>
        <span class="text-[15px] font-semibold">{{ t('whatif.walk') }}</span>
        <UFieldGroup class="mt-2 w-full">
          <UButton
            v-for="w in walks"
            :key="w"
            class="flex-1 justify-center"
            :color="state.walk_min === w ? 'primary' : 'neutral'"
            :variant="state.walk_min === w ? 'solid' : 'outline'"
            :aria-pressed="state.walk_min === w"
            @click="state.walk_min = w"
          >{{ w }} min</UButton>
        </UFieldGroup>
      </div>

      <div>
        <USwitch v-model="state.move" :label="t('whatif.move')" size="xl" :ui="{ label: 'text-[17px] font-semibold' }" />
        <div v-if="state.move && r.current.applied_moves.length" class="mt-2 flex flex-wrap gap-1.5">
          <UBadge v-for="m in r.current.applied_moves" :key="m" color="primary" variant="soft" class="rounded-full">
            {{ t(`moveShort.${m}`) }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>

  <!-- chart -->
  <UCard>
    <GlucoseCurve :current="r.current" :grumble="r.grumble" :baseline="r.baseline_mg_dl" />
    <div class="mt-2 flex flex-col gap-1 text-[15px]">
      <span class="flex items-center gap-2"><span class="inline-block w-4 h-1 rounded-full bg-grumble-500" />{{ legendCurrent }}</span>
      <span class="flex items-center gap-2"><span class="inline-block w-4 h-1 rounded-full bg-cafecito-500" />{{ t('whatif.move') }}</span>
    </div>
  </UCard>

  <!-- stat tiles -->
  <div class="grid grid-cols-3 gap-2">
    <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-3 text-center">
      <div class="text-[15px] text-crema-800/70">{{ t('whatif.peak') }}</div>
      <div class="font-display font-semibold text-[20px] tabular">
        <span class="text-grumble-500">{{ Math.round(r.current.peak_mg_dl) }}</span>
        <span class="text-crema-800/40"> → </span>
        <span class="text-cafecito-700">{{ Math.round(r.grumble.peak_mg_dl) }}</span>
      </div>
      <div class="text-xs text-crema-800/60">mg/dL</div>
    </div>
    <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-3 text-center">
      <div class="text-[15px] text-crema-800/70">{{ t('whatif.two_h') }}</div>
      <div class="font-display font-semibold text-[26px] text-cafecito-700 tabular">{{ signed(r.delta.iauc_pct) }}</div>
    </div>
    <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-3 text-center">
      <div class="text-[15px] text-crema-800/70">{{ t('whatif.back') }}</div>
      <div class="font-display font-semibold text-[20px] tabular">
        <span class="text-grumble-500">{{ r.current.back_to_baseline_min }}</span>
        <span class="text-crema-800/40"> → </span>
        <span class="text-cafecito-700">{{ r.grumble.back_to_baseline_min }}</span>
      </div>
      <div class="text-xs text-crema-800/60">min</div>
    </div>
  </div>

  <div v-if="showSameAsTen" class="flex items-center gap-2">
    <UBadge color="secondary" variant="solid" size="lg" class="rounded-full">{{ t('whatif.same_as_ten') }}</UBadge>
    <span class="text-[15px]">{{ t('whatif.same_as_ten_line') }}</span>
  </div>

  <p class="text-[15px] text-crema-800/70 -mt-1">
    {{ t('whatif.caption', { group: t(`groups.${groupKey}`), n: fmtNumber(r.n_dinners, locale) }) }}
    <br>
    <span class="text-xs">{{ t('whatif.range_note') }}</span>
  </p>

  <!-- the move -->
  <UCard>
    <p class="font-display font-semibold text-[20px]">{{ t('whatif.same_plate') }} {{ moveSentence }}</p>
    <p v-if="rotationMove" class="mt-1 text-[15px] text-grumble-600">{{ rotationMove }}</p>
    <p v-if="r.grumble.applied_moves.includes('beans-first')" class="mt-1 text-xs text-crema-800/60">{{ t('whatif.order_effect') }}</p>
    <UButton to="/table" color="primary" class="mt-4" trailing-icon="i-lucide-arrow-right">{{ t('whatif.see_tuesday') }}</UButton>
  </UCard>
</template>

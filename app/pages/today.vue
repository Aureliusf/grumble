<script setup lang="ts">
import type { Checkin, Lang, Table, TodayResponse } from '#shared/types'
import { SLOTS, type Slot } from '#shared/balance'
import { localParse, priceItem, totalOf, type PricedItem } from '#shared/meals'
import { fixtures } from '~/fixtures'

const PERSON = 'N0771'
const { t, locale } = useI18n()
const grumble = useGrumble()
const demo = useDemoState()

const { data: today } = useApi<TodayResponse>(`/api/today/${PERSON}`, fixtures.today)
const { data: dishes } = useApi(`/api/dishes?person_id=${PERSON}`, fixtures.dishes)
const { today: day, eaten } = useDay(PERSON)

const answers = reactive<{ energy?: 1|2|3|4|5; hunger?: 1|2|3|4|5; mood?: 1|2|3|4|5; company?: Checkin['company'] }>({})
const result = ref<TodayResponse | null>(null)
const accepted = ref<string | null>(null)
const sending = ref(false)

watch(answers, () => { if (!result.value) grumble.value = 'listening' })
onBeforeUnmount(() => { if (grumble.value === 'listening') grumble.value = 'grumbling' })

const scale = (key: string) => [0, 1, 2, 3, 4].map(i => t(`today.scale.${key}.${i}`))
const card = computed(() => result.value?.card)
const dishName = computed(() => dishes.value.find(d => d.id === card.value?.dish_id)?.name)
const isRed = computed(() => card.value?.kind === 'red')

// What did you eat? Freeform ("a cup of rice, a palm of chicken, a cup of beans") → /api/log splits it into
// USDA foods or dishes with amounts → the rest of today rebalances around it. A second entry for the same meal adds to it.
const ateText = ref('')
const ateSlot = ref<Slot>('lunch')
const adding = ref(false)
const lastSay = ref('')
interface LogResponse { label: string; items: PricedItem[]; say: string }

async function addEaten() {
  const text = ateText.value.trim()
  if (!text) return
  adding.value = true
  const res = await apiCall<LogResponse>('/api/log', () => {
    const items = localParse(text, dishes.value).map(priceItem).filter((x): x is PricedItem => !!x)
    return { label: text, items, say: '' }
  }, { method: 'POST', body: { text, lang: locale.value } })
  if (res.items.length) {
    const prev = eaten.value.find(e => e.slot === ateSlot.value)
    const entry = prev
      ? { ...prev, label: `${prev.label} + ${res.label}`, said: `${prev.said}; ${text}`, items: [...prev.items, ...res.items] }
      : { slot: ateSlot.value, label: res.label, said: text, items: res.items }
    eaten.value = [...eaten.value.filter(e => e.slot !== ateSlot.value), entry]
  }
  lastSay.value = res.say
  ateText.value = ''
  adding.value = false
}
const removeEaten = (slot: string) => { eaten.value = eaten.value.filter(e => e.slot !== slot) }
const logged = computed(() => SLOTS.map(s => eaten.value.find(e => e.slot === s)).filter(e => !!e))
const r = (n: number) => Math.round(n)
const amount = (i: PricedItem) => (i.kind === 'component' ? `${i.grams} g` : `×${i.portion}`)

async function submit() {
  sending.value = true
  const body: Checkin = { date: today.value.date, ...answers, company: answers.company ?? 'unknown' }
  result.value = await apiCall<TodayResponse>(`/api/checkin/${PERSON}`, fixtures.today, { method: 'POST', body: { ...body } })
  grumble.value = 'grumbling'
  sending.value = false
}

async function onAction(actionId: string) {
  if (!card.value) return
  const date = today.value.date
  await apiCall(`/api/today/${PERSON}/action`, (lang: Lang) => {
    // Fixture mode: remember the seat so /table shows it.
    if (actionId === 'seat') {
      const tbl = fixtures.tables(lang).find((x: Table) => x.date === date)
      if (tbl && !demo.value.seated.includes(tbl.id)) demo.value.seated.push(tbl.id)
    }
    return { ok: true }
  }, { method: 'POST', body: { card_id: card.value.id, action_id: actionId } })
  accepted.value = actionId
  if (actionId === 'seat') grumble.value = 'fed'
}
</script>

<template>
  <!-- nudge: one dry line about yesterday -->
  <div v-if="today.nudge && !isRed" class="flex items-center gap-3">
    <Grumble :state="grumble" :size="56" />
    <p class="font-display font-semibold text-[20px] leading-snug flex-1">{{ today.nudge }}</p>
  </div>

  <!-- what did you eat? -->
  <UCard v-if="!isRed">
    <p class="font-display font-semibold text-[20px] mb-3">{{ t('today.ate_title') }}</p>
    <div class="grid grid-cols-3 gap-2 mb-3">
      <UButton
        v-for="s in SLOTS"
        :key="s"
        size="lg"
        class="justify-center"
        :color="ateSlot === s ? 'primary' : 'neutral'"
        :variant="ateSlot === s ? 'solid' : 'outline'"
        @click="ateSlot = s"
      >{{ t(`day.slots.${s}`) }}</UButton>
    </div>
    <!-- Multiline so a whole plate fits: one food per line, or a sentence. Cmd/Ctrl+Enter adds. -->
    <form class="flex flex-col gap-2" @submit.prevent="addEaten">
      <UTextarea
        v-model="ateText"
        :placeholder="t('today.ate_placeholder')"
        :rows="5"
        autoresize
        :maxrows="10"
        size="xl"
        class="w-full"
        :disabled="adding"
        :ui="{ base: 'rounded-[var(--radius-grumble)] text-[17px] leading-relaxed' }"
        @keydown.meta.enter.prevent="addEaten"
        @keydown.ctrl.enter.prevent="addEaten"
      />
      <UButton type="submit" color="primary" block class="justify-center" :loading="adding" :disabled="!ateText.trim()">{{ t('today.ate_add') }}</UButton>
    </form>
    <p v-if="lastSay" class="mt-3 font-display font-semibold text-[17px] leading-snug">{{ lastSay }}</p>

    <!-- what it came to: each food, the amount, the numbers -->
    <div v-for="e in logged" :key="e.slot" class="mt-4 border-t border-crema-100 dark:border-crema-800 pt-3">
      <div class="flex items-baseline justify-between gap-2">
        <p class="font-semibold">{{ t(`day.slots.${e.slot}`) }} · <span class="font-normal">{{ e.label }}</span></p>
        <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" :aria-label="t('day.remove')" @click="removeEaten(e.slot)" />
      </div>
      <ul class="mt-1 flex flex-col gap-0.5 text-[15px]">
        <li v-for="(i, k) in e.items" :key="k" class="flex justify-between gap-3 tabular">
          <span class="text-crema-800/80 truncate">{{ i.name }} <span class="text-crema-800/50">· {{ i.said }}</span></span>
          <span class="shrink-0 text-crema-800/70">{{ amount(i) }} · {{ r(i.n.calories) }} kcal</span>
        </li>
      </ul>
      <p class="mt-1 text-xs text-crema-800/60 tabular">
        {{ r(totalOf(e.items).calories) }} kcal · {{ r(totalOf(e.items).carbs_g) }} g {{ t('day.carbs') }} · {{ r(totalOf(e.items).fiber_g) }} g {{ t('day.fiber') }} · {{ r(totalOf(e.items).protein_g) }} g {{ t('day.protein') }}
      </p>
    </div>
    <p v-if="logged.length" class="mt-2 text-xs text-crema-800/50">{{ t('today.usda_note') }}</p>
  </UCard>

  <template v-if="!isRed && eaten.length">
    <DayFeedback />
    <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('today.rest') }}</h2>
    <DayPlan :day="day" :fixed-label="t('day.ate')" />
  </template>

  <Transition
    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-6"
    mode="out-in"
  >
    <SuggestionCard
      v-if="card"
      :key="card.id"
      :card="card"
      :date="today.date"
      :dish-name="dishName"
      :accepted="accepted"
      @action="onAction"
    />
    <UCard v-else>
      <div class="flex flex-col gap-6">
        <FaceRow v-model="answers.energy" :label="t('today.energy')" :labels="scale('energy')" />
        <FaceRow v-model="answers.hunger" :label="t('today.hunger')" :labels="scale('hunger')" />
        <FaceRow v-model="answers.mood" :label="t('today.mood')" :labels="scale('mood')" />
        <CompanyChips v-model="answers.company" :label="t('today.company')" />
        <UButton color="primary" block :loading="sending" @click="submit">{{ t('today.done') }}</UButton>
      </div>
    </UCard>
  </Transition>
</template>

<script setup lang="ts">
import type { Checkin, Lang, Table, TodayResponse } from '#shared/types'
import { SLOTS, type Slot } from '#shared/balance'
import { localMatch, type MealMatch } from '~/intake/meal'
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

// What did you eat? → Claude finds the dish (/api/meal) → the rest of today rebalances around it.
const ateText = ref('')
const ateSlot = ref<Slot>('lunch')
const adding = ref(false)
async function addEaten() {
  const text = ateText.value.trim()
  if (!text) return
  adding.value = true
  const m = await apiCall<MealMatch>('/api/meal', () => localMatch(text, dishes.value, () => ''), { method: 'POST', body: { text, lang: locale.value } })
  if (m.dish_id !== 'none') {
    eaten.value = [...eaten.value.filter(e => e.slot !== ateSlot.value), { slot: ateSlot.value, dish_id: m.dish_id, said: text }]
    const next = SLOTS[SLOTS.indexOf(ateSlot.value) + 1]
    if (next) ateSlot.value = next
  }
  lastSay.value = m.say
  ateText.value = ''
  adding.value = false
}
const lastSay = ref('')
const removeEaten = (slot: string) => { eaten.value = eaten.value.filter(e => e.slot !== slot) }

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
    <form class="flex gap-2" @submit.prevent="addEaten">
      <UInput v-model="ateText" :placeholder="t('today.ate_placeholder')" size="xl" class="flex-1" :disabled="adding" :ui="{ base: 'rounded-full' }" />
      <UButton type="submit" color="primary" :loading="adding" :disabled="!ateText.trim()">{{ t('today.ate_add') }}</UButton>
    </form>
    <p v-if="lastSay" class="mt-3 font-display font-semibold text-[17px] leading-snug">{{ lastSay }}</p>
  </UCard>

  <template v-if="!isRed && eaten.length">
    <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('today.rest') }}</h2>
    <DayPlan :day="day" :fixed-label="t('day.ate')" removable @remove="removeEaten" />
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

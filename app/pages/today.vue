<script setup lang="ts">
import type { Checkin, Lang, Table, TodayResponse } from '#shared/types'
import { fixtures } from '~/fixtures'

const PERSON = 'N0771'
const { t } = useI18n()
const grumble = useGrumble()
const demo = useDemoState()

const { data: today } = useApi<TodayResponse>(`/api/today/${PERSON}`, fixtures.today)
const { data: dishes } = useApi(`/api/dishes?person_id=${PERSON}`, fixtures.dishes)

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

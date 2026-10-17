<script setup lang="ts">
import type { Dish, FoodGraph, Lang } from '#shared/types'
import { fixtures } from '~/fixtures'
import { buildGraph } from '~/intake/build'
import { DEFAULT_COACH, emptyAnswers, figureItOut, proposeStandards, type IntakeAnswers, type Proposal, type Tr } from '~/intake/rules'
import { localMatch, type MealMatch } from '~/intake/meal'
import { STEPS, type Step } from '~/intake/steps'

const { t, tm, rt, locale } = useI18n()
const { setLang } = useLang()
const { save } = useFoodGraph()
const grumble = useGrumble()
const nuxtApp = useNuxtApp()

const { data: dishes } = useApi<Dish[]>('/api/dishes', fixtures.dishes)
const byId = computed(() => new Map(dishes.value.map(d => [d.id, d])))

const answers = reactive<IntakeAnswers>(emptyAnswers(locale.value as Lang))
const proposals = ref<Proposal[]>([])
const result = ref<{ ok: boolean; errors: string[] } | null>(null)

// Stage 2 opens with one meal in their words; Claude finds the closest dish (server/api/meal.post.ts).
const mealText = ref('')
const match = ref<MealMatch | null>(null)
const matching = ref(false)
watch(mealText, () => { match.value = null })

async function findMeal() {
  matching.value = true
  const text = mealText.value.trim()
  const res = await apiCall<MealMatch>('/api/meal', () =>
    localMatch(text, dishes.value, d => (d ? t('intake.ui.closest', { dish: d.name }) : t('intake.ui.no_match'))),
  { method: 'POST', body: { text, lang: answers.language } })
  match.value = res
  answers.loves = res.dish_id !== 'none' ? [res.dish_id] : [res.meal || text]
  answers.food = res.cuisine || undefined
  matching.value = false
}
const matchedName = computed(() => (match.value ? byId.value.get(match.value.dish_id)?.name : undefined))

// Generated copy is written in the person's language with an English copy beside it.
const tr: Tr = (key, named = {}, lang) => t(key, named, { locale: lang ?? answers.language })

onMounted(async () => {
  grumble.value = 'listening'
  await Promise.all((['en', 'es'] as const).map(l => nuxtApp.$i18n.loadLocaleMessages(l)))
})
onBeforeUnmount(() => { grumble.value = 'grumbling' })

// --- the walk through the steps ---
const visible = computed(() => STEPS.filter(s => !s.when || s.when(answers)))
const idx = ref(0)
const step = computed<Step>(() => visible.value[Math.min(idx.value, visible.value.length - 1)]!)
const progress = computed(() => Math.round((idx.value / (visible.value.length - 1)) * 100))

const field = computed(() => step.value.field)
const get = (k: keyof IntakeAnswers) => answers[k] as unknown
function set(k: keyof IntakeAnswers, v: unknown) {
  (answers as Record<string, unknown>)[k] = v
}

const suggestions = computed(() => {
  if (step.value.suggestions) return step.value.suggestions
  if (step.value.suggestionsKey) return (tm(`intake.sugg.${step.value.suggestionsKey}`) as unknown[]).map(x => rt(x as never))
  if (step.value.id === 'buddy') return answers.eats_with
  return []
})

const missing = computed(() => {
  const s = step.value
  if (!s.required) return false
  if (s.type === 'sleep') return !answers.sleep_start || !answers.sleep_end
  if (s.type === 'meal') return matching.value
  return s.field ? get(s.field) === undefined : false
})

function enter(s: Step) {
  if (s.type === 'proposals' && !proposals.value.length) {
    const loved = answers.loves.map(id => byId.value.get(id)).filter((d): d is Dish => !!d)
    proposals.value = proposeStandards(answers, loved, tr).map(p => ({ ...p, accepted: true }))
  }
  if (s.type === 'done') finish()
}

function leave(s: Step) {
  if (s.type === 'proposals') {
    const kept = proposals.value.filter(p => p.accepted).map(({ accepted: _, ...p }) => p)
    const declinedBoth = proposals.value.filter(p => p.required).every(p => !p.accepted)
    answers.standards = declinedBoth ? [...kept, figureItOut(answers, tr)] : kept
  }
}

async function next() {
  const s = step.value
  // First Next on the meal screen asks Claude; the second moves on.
  if (s.type === 'meal' && mealText.value.trim() && !match.value) return findMeal()
  if (s.type === 'slider' && s.field && get(s.field) === undefined) set(s.field, s.start)
  leave(s)
  if (idx.value < visible.value.length - 1) idx.value++
  enter(step.value)
}
function back() {
  if (idx.value > 0) idx.value--
  // Editing an earlier answer re-proposes the standards.
  if (step.value.stage < 3) proposals.value = []
}
function skip() {
  if (field.value && !Array.isArray(get(field.value))) set(field.value, undefined)
  if (step.value.type === 'meal') { mealText.value = ''; answers.loves = []; answers.food = undefined }
  next()
}
function pick(v: unknown) {
  if (field.value) set(field.value, v)
  next()
}
async function pickLang(l: Lang) {
  answers.language = l
  await setLang(l)
  next()
}

function finish() {
  const out = buildGraph(answers, dishes.value, tr)
  result.value = { ok: out.ok, errors: out.errors }
  if (out.ok) save(out.graph as unknown as FoodGraph)
}

const optLabel = (v: string) => t(`intake.opt.${step.value.id}.${v}`)
const isSay = computed(() => ['say', 'done'].includes(step.value.type))
</script>

<template>
  <UProgress :model-value="progress" color="primary" size="sm" />

  <!-- Grumble asks -->
  <div class="flex items-start gap-3">
    <Grumble :state="step.type === 'done' ? 'fed' : 'listening'" :size="64" />
    <p class="flex-1 font-display font-semibold leading-snug pt-1" :class="isSay ? 'text-[26px]' : 'text-[20px]'">
      {{ t(`intake.q.${step.id}`) }}
    </p>
  </div>

  <Transition mode="out-in" enter-active-class="transition duration-200 ease-out motion-reduce:transition-none" enter-from-class="opacity-0 translate-y-3">
    <div :key="step.id" class="flex flex-col gap-4">
      <!-- language -->
      <div v-if="step.type === 'lang'" class="grid grid-cols-2 gap-3">
        <UButton v-for="l in (['en', 'es'] as const)" :key="l" size="xl" class="justify-center py-5 text-[20px]" :color="answers.language === l ? 'primary' : 'neutral'" :variant="answers.language === l ? 'solid' : 'outline'" @click="pickLang(l)">
          {{ l === 'en' ? 'English' : 'Español' }}
        </UButton>
      </div>

      <!-- one of several -->
      <div v-else-if="step.type === 'choice'" class="flex flex-col gap-2">
        <UButton
          v-for="o in step.options"
          :key="o"
          size="xl"
          block
          class="justify-start"
          :color="field && get(field) === o ? 'primary' : 'neutral'"
          :variant="field && get(field) === o ? 'solid' : 'outline'"
          @click="pick(o)"
        >{{ optLabel(o) }}</UButton>
      </div>

      <!-- yes / no -->
      <div v-else-if="step.type === 'yesno'" class="grid grid-cols-2 gap-3">
        <UButton v-for="v in [true, false]" :key="String(v)" size="xl" class="justify-center py-4" :color="field && get(field) === v ? 'primary' : 'neutral'" :variant="field && get(field) === v ? 'solid' : 'outline'" @click="pick(v)">
          {{ v ? t('intake.opt.yes') : t('intake.opt.no') }}
        </UButton>
      </div>

      <!-- short text -->
      <template v-else-if="step.type === 'text' && field">
        <form @submit.prevent="next">
          <UInput :model-value="(get(field) as string) ?? ''" :placeholder="t('intake.ui.type_here')" size="xl" class="w-full" autofocus :ui="{ base: 'rounded-full' }" @update:model-value="set(field, $event)" />
        </form>
        <div v-if="suggestions.length" class="flex flex-wrap gap-2">
          <UButton v-for="s in suggestions" :key="s" color="neutral" variant="outline" size="lg" @click="pick(s)">{{ s }}</UButton>
        </div>
      </template>

      <!-- a count -->
      <form v-else-if="step.type === 'number' && field" class="flex justify-center py-2" @submit.prevent="next">
        <UInputNumber
          :model-value="get(field) as number | undefined"
          :min="step.min"
          :max="step.max"
          :step="step.step"
          size="xl"
          autofocus
          class="w-52"
          :ui="{ base: 'font-display font-bold text-[34px] text-center tabular h-16 rounded-full' }"
          @update:model-value="set(field, $event ?? undefined)"
        />
      </form>

      <!-- a range -->
      <div v-else-if="step.type === 'slider' && field" class="flex flex-col gap-3">
        <span class="font-display font-bold text-[34px] text-grumble-500 tabular text-center">${{ (get(field) as number) ?? step.start }} <span class="text-[17px] font-medium text-crema-800/60">{{ t('intake.ui.per_week') }}</span></span>
        <USlider :model-value="(get(field) as number) ?? step.start" :min="step.min" :max="step.max" :step="step.step" size="xl" @update:model-value="set(field, $event)" />
      </div>

      <!-- sleep window -->
      <div v-else-if="step.type === 'sleep'" class="grid grid-cols-2 gap-3">
        <UFormField :label="t('intake.ui.asleep')"><UInput v-model="answers.sleep_start" type="time" size="xl" class="w-full" /></UFormField>
        <UFormField :label="t('intake.ui.up')"><UInput v-model="answers.sleep_end" type="time" size="xl" class="w-full" /></UFormField>
      </div>

      <!-- the reason Sylvester sent you -->
      <div v-else-if="step.type === 'cancer'" class="flex flex-col gap-3">
        <UFormField :label="t('intake.ui.cancer_type')"><UInput v-model="answers.cancer_type" size="xl" class="w-full" :ui="{ base: 'rounded-full' }" /></UFormField>
        <UFormField :label="t('intake.ui.years')"><UInputNumber v-model="answers.years_since" :min="0" :max="60" :step="0.5" size="xl" class="w-full" /></UFormField>
      </div>

      <IntakeList v-else-if="step.type === 'list' && field" :model-value="get(field) as string[]" :suggestions="suggestions" @update:model-value="set(field, $event)" />
      <!-- one meal they love, in their words -->
      <template v-else-if="step.type === 'meal'">
        <form @submit.prevent="next">
          <UInput v-model="mealText" :placeholder="t('intake.ui.type_here')" size="xl" class="w-full" autofocus :disabled="matching" :ui="{ base: 'rounded-full' }" />
        </form>
        <p v-if="!match && !matching" class="text-[15px] text-crema-800/60">{{ t('intake.ui.meal_hint') }}</p>
        <p v-if="matching" class="text-[15px] text-crema-800/60 flex items-center gap-2"><UIcon name="i-lucide-loader-circle" class="size-5 animate-spin" />{{ t('intake.ui.matching') }}</p>
        <div v-if="match" class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex flex-col gap-2">
          <p class="font-display font-semibold text-[20px] leading-snug">{{ match.say }}</p>
          <UBadge v-if="matchedName" color="primary" variant="soft" size="lg" icon="i-lucide-utensils" class="rounded-full self-start">{{ matchedName }}</UBadge>
        </div>
      </template>
      <IntakeProposals v-else-if="step.type === 'proposals'" v-model="proposals" :coach="DEFAULT_COACH.name" />
      <IntakeProcedures v-else-if="step.type === 'procedures'" v-model="answers.manual" :standards="answers.standards" />
      <IntakeRotation v-else-if="step.type === 'rotation'" v-model="answers.starred" :loves="answers.loves" :dishes="dishes" :appetite="answers.appetite" :lang="answers.language" />

      <!-- done -->
      <template v-else-if="step.type === 'done' && result">
        <UButton v-if="result.ok" to="/plan" color="primary" size="xl" block trailing-icon="i-lucide-arrow-right">{{ t('intake.ui.see_plan') }}</UButton>
        <UAlert v-else color="error" variant="soft" :title="t('intake.ui.invalid')" :description="result.errors.join(' · ')" />
      </template>
    </div>
  </Transition>

  <!-- back / skip / next -->
  <div v-if="step.type !== 'done'" class="flex items-center gap-2 pt-2">
    <UButton v-if="idx > 0" color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="back">{{ t('intake.ui.back') }}</UButton>
    <div class="ml-auto flex items-center gap-2">
      <UButton v-if="!step.required && !isSay" color="neutral" variant="ghost" @click="skip">{{ t('intake.ui.skip') }}</UButton>
      <UButton v-if="step.type !== 'lang'" color="primary" trailing-icon="i-lucide-arrow-right" :disabled="missing" :loading="matching" @click="next">{{ t('intake.ui.next') }}</UButton>
    </div>
  </div>
</template>

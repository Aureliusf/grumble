<script setup lang="ts">
import type { Dish, FoodGraph, Lang } from '#shared/types'
import { fixtures } from '~/fixtures'
import { buildGraph } from '~/intake/build'
import { partsOf, unslug } from '#shared/meals'
import { answersFromGraph, DEFAULT_COACH, emptyAnswers, figureItOut, lovedDish, mergeProposals, proposeStandards, type IntakeAnswers, type Proposal, type Tr } from '~/intake/rules'
import { localMeal, loveKey, type MealParse } from '~/intake/meal'
import { SECTIONS, STEPS, type Step } from '~/intake/steps'

const { t, tm, rt, locale } = useI18n()
const { setLang } = useLang()
const { save, own } = useFoodGraph()
const toast = useToast()
const grumble = useGrumble()
const nuxtApp = useNuxtApp()

const { data: dishes } = useApi<Dish[]>('/api/dishes', fixtures.dishes)
const byId = computed(() => new Map(dishes.value.map(d => [d.id, d])))

// Progressive intake: with a saved plan, start from what it knows and refine; otherwise the full interview.
const refining = ref(!!own.value)
const answers = reactive<IntakeAnswers>(own.value ? answersFromGraph(own.value) : emptyAnswers(locale.value as Lang))
const section = ref<string | null>(null)
const finishAfterSection = ref(false)
const proposals = ref<Proposal[]>([])
const result = ref<{ ok: boolean; errors: string[] } | null>(null)

// Stage 2 opens with one meal in their words; Claude splits it into parts like a Today log and says
// when it's eaten (server/api/log.post.ts). One dish from dishes.json stays whole.
const mealText = ref('')
const match = ref<MealParse | null>(null)
const matching = ref(false)
watch(mealText, () => { match.value = null })

async function findMeal() {
  matching.value = true
  const text = mealText.value.trim()
  const res = await apiCall<MealParse>('/api/log', () =>
    localMeal(text, dishes.value, t('intake.ui.no_match')),
  { method: 'POST', body: { text, lang: answers.language, love: true } })
  match.value = res
  const love = loveKey(res)
  // A later run adds to what they love (up to five, newest kept); the first run starts the list.
  answers.loves = refining.value ? [...answers.loves.filter(l => l !== love), love].slice(-5) : [love]
  answers.love_slots = { ...answers.love_slots, [love]: res.meal_type }
  if (!byId.value.has(love) && res.items.length) answers.love_parts = { ...answers.love_parts, [love]: partsOf(res.items) }
  answers.food = answers.food ?? (res.cuisine || undefined)
  matching.value = false
}
const matchedLove = computed(() => (match.value ? loveKey(match.value) : ''))
const matchedSlot = computed({
  get: () => answers.love_slots[matchedLove.value] ?? '',
  set: (v: string) => { answers.love_slots = { ...answers.love_slots, [matchedLove.value]: v } },
})

// Generated copy is written in the person's language with an English copy beside it.
const tr: Tr = (key, named = {}, lang) => t(key, named, { locale: lang ?? answers.language })

onMounted(async () => {
  grumble.value = 'listening'
  await Promise.all((['en', 'es'] as const).map(l => nuxtApp.$i18n.loadLocaleMessages(l)))
})
onBeforeUnmount(() => { grumble.value = 'grumbling' })

// --- the walk through the steps ---
const visible = computed(() => STEPS.filter(s => (!section.value || SECTIONS[section.value]!.includes(s.id)) && (!s.when || s.when(answers))))
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
  if (['call', 'buddy'].includes(step.value.id)) return answers.eats_with
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
  if (s.type === 'proposals' && !proposals.value.length) proposals.value = currentProposals()
  if (s.type === 'done') finish()
}

// This run's proposals, merged with what earlier runs accepted and declined.
function currentProposals() {
  const loved = answers.loves.map(id => lovedDish(answers, id, byId.value)).filter((d): d is Dish => !!d)
  const previous = answers.standards.filter(p => p.id !== 'figure-it-out')
  return mergeProposals(proposeStandards(answers, loved, tr), previous, answers.declined, !refining.value)
}

function leave(s: Step) {
  if (s.type === 'proposals') {
    answers.declined = proposals.value.filter(p => !p.accepted).map(p => p.id)
    const kept = proposals.value.filter(p => p.accepted).map(({ accepted: _a, isNew: _n, ...p }) => p)
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
  // The end of a reopened section goes back to the summary (or on to saving, if that's what sent us here).
  if (section.value && idx.value >= visible.value.length - 1) return closeSection()
  if (idx.value < visible.value.length - 1) idx.value++
  enter(step.value)
}
function back() {
  if (section.value && idx.value === 0) return closeSection()
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
  return out.ok
}

// --- refine mode: the summary, reopening a section, saving ---
function openSection(name: string) {
  section.value = name
  idx.value = 0
  proposals.value = []
  enter(step.value)
}
function closeSection() {
  section.value = null
  idx.value = 0
  if (finishAfterSection.value) { finishAfterSection.value = false; updatePlan() }
}
// Anything new to agree to goes through the good-day screen before the plan is saved.
function updatePlan() {
  if (currentProposals().some(p => p.isNew)) {
    finishAfterSection.value = true
    return openSection('goodday')
  }
  if (!answers.standards.length) answers.standards = currentProposals().filter(p => p.accepted).map(({ accepted: _a, isNew: _n, ...p }) => p)
  if (finish()) {
    toast.add({ title: t('intake.refine.updated'), color: 'primary', icon: 'i-lucide-check' })
    navigateTo('/plan')
  }
}
function startOver() {
  Object.assign(answers, emptyAnswers(answers.language))
  refining.value = false
  section.value = null
  idx.value = 0
  proposals.value = []
  mealText.value = ''
}

const dishName = (id: string) => byId.value.get(id)?.name ?? unslug(id)
const summaries = computed(() => {
  const a = answers
  const opt = (k: string, v?: string) => (v ? t(`intake.opt.${k}.${v}`) : '')
  const accepted = a.standards.length
  return [
    { key: 'you', line: [a.name, a.age, opt('work', a.work), `${fmtTime(a.sleep_start, locale.value)}–${fmtTime(a.sleep_end, locale.value)}`].filter(Boolean).join(' · ') },
    { key: 'food', line: [a.loves.map(dishName).join(', '), a.refuses.length ? `${t('intake.refine.not')}: ${a.refuses.join(', ')}` : ''].filter(Boolean).join(' · ') },
    { key: 'week', line: [a.meals_out != null ? t('intake.refine.out_n', { n: a.meals_out }) : '', a.places.join(', '), a.budget != null ? `$${a.budget}` : ''].filter(Boolean).join(' · ') },
    { key: 'people', line: [opt('dinner_company', a.dinner_company), a.eats_with.join(', '), a.buddy].filter(Boolean).join(' · ') },
    { key: 'goodday', line: t('intake.refine.standards_n', accepted) },
    { key: 'dishes', line: a.starred.map(dishName).join(', ') },
    { key: 'talk', line: [opt('framing', a.framing)?.split('.')[0], a.never_mention.join(', ')].filter(Boolean).join(' · ') },
  ].filter(x => x.key !== 'dishes' || a.loves.length)
})

const optLabel = (v: string) => t(`intake.opt.${step.value.id}.${v}`)
const isSay = computed(() => ['say', 'done'].includes(step.value.type))
</script>

<template>
  <AiBanner />

  <!-- refine: what Grumble knows, one more meal, change any section -->
  <template v-if="refining && !section">
    <div class="flex items-start gap-3">
      <Grumble state="listening" :size="64" />
      <p class="flex-1 font-display font-semibold text-[20px] leading-snug pt-1">{{ t('intake.refine.hello') }}</p>
    </div>

    <UCard>
      <p class="font-display font-semibold text-[20px] mb-3">{{ t('intake.refine.one_more') }}</p>
      <form class="flex gap-2" @submit.prevent="mealText.trim() && findMeal()">
        <UInput v-model="mealText" :placeholder="t('intake.ui.type_here')" size="xl" class="flex-1" :disabled="matching" :ui="{ base: 'rounded-full' }" />
        <UButton type="submit" color="primary" :loading="matching" :disabled="!mealText.trim()">{{ t('intake.ui.add') }}</UButton>
      </form>
      <IntakeMeal v-if="match" v-model="matchedSlot" :meal="match" class="mt-3" />
    </UCard>

    <div class="flex flex-col gap-2">
      <div v-for="sec in summaries" :key="sec.key" class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <p class="font-display font-semibold text-[17px]">{{ t(`intake.refine.sections.${sec.key}`) }}</p>
          <p class="text-[15px] text-crema-800/70 truncate">{{ sec.line || '—' }}</p>
        </div>
        <UButton size="sm" color="neutral" variant="outline" @click="openSection(sec.key)">{{ t('intake.refine.change') }}</UButton>
      </div>
    </div>

    <UButton color="primary" size="xl" block class="justify-center" icon="i-lucide-refresh-cw" @click="updatePlan">{{ t('intake.refine.update') }}</UButton>
    <UAlert v-if="result && !result.ok" color="error" variant="soft" :title="t('intake.ui.invalid')" :description="result.errors.join(' · ')" />
    <UButton color="neutral" variant="link" class="self-center" @click="startOver">{{ t('intake.refine.start_over') }}</UButton>
  </template>

  <template v-else>
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
          <IntakeMeal v-if="match" v-model="matchedSlot" :meal="match" />
        </template>
        <IntakeProposals v-else-if="step.type === 'proposals'" v-model="proposals" :coach="DEFAULT_COACH.name" />
        <IntakeProcedures v-else-if="step.type === 'procedures'" v-model="answers.manual" :standards="answers.standards" />
        <IntakeRotation v-else-if="step.type === 'rotation'" v-model="answers.starred" :answers="answers" :dishes="dishes" :lang="answers.language" />

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
</template>

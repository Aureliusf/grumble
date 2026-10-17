<script setup lang="ts">
import params from '~~/data/simulator-params.json'
import { COMPONENTS } from '#shared/meals'
import { sum } from '#shared/nutrition'
import { SLOTS, type Slot } from '#shared/balance'
import { dayCurve } from '#shared/simulate'
import type { Eaten } from '~/composables/useDay'

// "How today's going": two or three lines on what's been eaten so far, judged against the share of the day
// those meals stand for. Every number is computed here; the copy is a move, never a "don't" (09).
const PERSON = 'N0771'
const { t } = useI18n()
const { eaten, targets, person, graph, plan } = useDay(PERSON)
const { curves, mealsOf, today, frame } = useDayGlucose(PERSON)

// How much of the day each meal stands for.
const SHARE: Record<Slot, number> = { breakfast: 0.25, lunch: 0.35, dinner: 0.4 }

const r = (n: number) => Math.round(n)
const refuses = computed(() => ((graph.value as { risks?: { taste?: { refuses?: string[] } } }).risks?.taste?.refuses ?? []).join(' ').toLowerCase())
// A fix from the USDA list: one ordinary amount and what it adds.
function fix(ids: string[], grams: number, nutrient: 'fiber_g' | 'protein_g') {
  const c = ids.map(id => COMPONENTS.find(x => x.id === id)!).find(x => !x.id.split('-').some(w => w.length > 3 && refuses.value.includes(w))) ?? COMPONENTS.find(x => x.id === ids[0])!
  return { name: t(`feedback.foods.${c.id}`), adds: r((c.per_100g[nutrient] * grams) / 100) }
}

const lines = computed(() => {
  const ate = eaten.value as Eaten[]
  if (!ate.length) return []
  const slots = ate.map(e => e.slot)
  const pace = slots.reduce((s, x) => s + SHARE[x], 0)
  const done = SLOTS.every(s => slots.includes(s))
  // The next meal is the first open slot after the latest one logged; past dinner it's a snack.
  const last = Math.max(...slots.map(x => SLOTS.indexOf(x)))
  const next = SLOTS.slice(last + 1).find(s => !slots.includes(s))
  const when = t(`feedback.at.${next ?? 'snack'}`)
  const x = sum(ate.flatMap(e => e.items.map(i => i.n)))
  const g = targets.value
  const out: { tone: 'good' | 'nudge'; text: string }[] = []

  // The latest meal, if it ran clearly higher than the plate the plan had for that slot: the walk, with its number.
  const latest = [...ate].reverse()[0]!
  const peakAt = (day: typeof today.value, slot: Slot) => {
    const i = day.plates.findIndex(p => p.slot === slot)
    return i < 0 ? null : dayCurve(mealsOf(day), person.value.blood_sugar_group, frame.value.from, frame.value.to).peaks[i]?.mg_dl ?? null
  }
  const ateAt = peakAt(today.value, latest.slot)
  const plannedAt = peakAt(plan.value, latest.slot)
  if (ateAt != null && plannedAt != null && ateAt - plannedAt >= 15) {
    const walk = Math.abs(params.dinner_effects_by_group[person.value.blood_sugar_group].walk_peak_delta)
    out.push({ tone: 'nudge', text: t('feedback.spike', { meal: t(`feedback.the.${latest.slot}`), d: r(ateAt - plannedAt), n: r(walk) }) })
  }

  if (x.carbs_g > g.carbs_g * pace * 1.2)
    out.push({ tone: 'nudge', text: next ? t('feedback.carbs_ahead', { n: r(x.carbs_g), target: g.carbs_g, next: t(`feedback.the.${next}`) }) : t('feedback.carbs_over', { n: r(x.carbs_g), target: g.carbs_g }) })

  if (x.fiber_g < g.fiber_g * pace * 0.75) {
    const f = fix(['black-beans', 'lentils', 'chickpeas', 'broccoli'], 172, 'fiber_g')
    out.push({ tone: 'nudge', text: t('feedback.fiber', { n: r(x.fiber_g), target: g.fiber_g, food: f.name, adds: f.adds, when }) })
  }

  if (x.protein_g < g.protein_g * pace * 0.75) {
    const p = fix(['chicken-breast', 'white-fish', 'egg'], 85, 'protein_g')
    out.push({ tone: 'nudge', text: t('feedback.protein', { n: r(x.protein_g), target: g.protein_g, food: p.name, adds: p.adds, when }) })
  }
  else if (x.protein_g >= g.protein_g * pace * 0.9) {
    out.push({ tone: 'good', text: t('feedback.protein_ok', { n: r(x.protein_g), target: g.protein_g }) })
  }

  if (done && x.calories > g.calories * 1.1) out.push({ tone: 'nudge', text: t('feedback.kcal_over', { n: r(x.calories), target: g.calories }) })
  else if (done && x.calories < g.calories * 0.7) out.push({ tone: 'good', text: t('feedback.kcal_light', { n: r(x.calories), target: g.calories }) })

  if (slots.includes('dinner')) out.push({ tone: 'good', text: t('moves.walk10') })
  if (!out.some(o => o.tone === 'nudge')) out.unshift({ tone: 'good', text: t('feedback.on_track') })
  return out.slice(0, 4)
})
</script>

<template>
  <div v-if="lines.length" class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex gap-3">
    <Grumble :state="lines.some(l => l.tone === 'nudge') ? 'grumbling' : 'fed'" :size="48" class="shrink-0 self-start" />
    <div class="flex-1 min-w-0">
      <p class="font-display font-semibold text-[20px]">{{ t('feedback.title') }}</p>
      <ul class="mt-2 flex flex-col gap-2">
        <li v-for="(l, i) in lines" :key="i" class="flex gap-2 text-[17px] leading-snug">
          <UIcon :name="l.tone === 'good' ? 'i-lucide-check' : 'i-lucide-arrow-right'" class="size-5 shrink-0 mt-0.5" :class="l.tone === 'good' ? 'text-cafecito-500' : 'text-grumble-500'" />
          <span>{{ l.text }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

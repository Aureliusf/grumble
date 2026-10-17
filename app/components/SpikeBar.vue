<script setup lang="ts">
// Today's glucose spikes under the header: the day's curve as a sparkline (coral above 140) and each meal's
// rise above baseline. Same numbers as What if → Whole day; people like you, not a forecast.
const PERSON = 'N0771'
const { t } = useI18n()
const { curves, frame, mealsOf, today } = useDayGlucose(PERSON)

const W = 400
const H = 30
const day = computed(() => curves.value.b)
// Baseline sits on the bottom edge; the top is the day's peak or 200, whichever is higher, so 140 always shows.
const Y0 = computed(() => day.value.baseline)
const Y1 = computed(() => Math.max(200, curves.value.peakB + 5))
const x = (m: number) => ((m - frame.value.from) / (frame.value.to - frame.value.from)) * W
const y = (v: number) => H - ((Math.min(Math.max(v, Y0.value), Y1.value) - Y0.value) / (Y1.value - Y0.value)) * H

const area = computed(() => {
  const pts = day.value.points
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.mg_dl).toFixed(1)}`).join('')
  return `${line}L${W},${H}L0,${H}Z`
})
const y140 = computed(() => y(140))

// One chip per meal: the rise above baseline at that meal's peak.
const chips = computed(() => {
  const meals = mealsOf(today.value)
  return day.value.peaks.map((p, i) => ({
    slot: meals[i]!.slot,
    rise: Math.round(p.mg_dl - day.value.baseline),
    over: p.mg_dl > 140,
    ate: meals[i]!.fixed,
  }))
})
</script>

<template>
  <NuxtLink
    to="/whatif?mode=day"
    class="block px-4 pb-2"
    :aria-label="t('spike.aria')"
  >
    <div class="flex items-baseline justify-between text-xs text-crema-800/60">
      <span>{{ t('spike.title') }}</span>
      <UIcon name="i-lucide-chevron-right" class="size-3.5 self-center" />
    </div>
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" width="100%" :height="H" class="block mt-0.5" aria-hidden="true">
      <defs>
        <clipPath id="spike-over"><rect x="0" y="0" :width="W" :height="y140" /></clipPath>
      </defs>
      <path :d="area" fill="var(--color-cafecito-300)" fill-opacity="0.55" />
      <path :d="area" fill="var(--color-grumble-500)" clip-path="url(#spike-over)" />
      <line x1="0" :x2="W" :y1="y140" :y2="y140" stroke="var(--color-crema-800)" stroke-opacity="0.35" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="mt-1 grid grid-cols-3 gap-1 text-xs tabular">
      <span
        v-for="c in chips"
        :key="c.slot"
        class="flex items-center gap-1"
        :class="c.over ? 'text-grumble-600 font-bold' : 'text-crema-800/70'"
      >
        <span class="inline-block size-1.5 rounded-full" :class="c.ate ? 'bg-grumble-500' : 'bg-cafecito-300'" />
        {{ t(`day.slots.${c.slot}`) }} +{{ c.rise }}
      </span>
    </div>
  </NuxtLink>
</template>

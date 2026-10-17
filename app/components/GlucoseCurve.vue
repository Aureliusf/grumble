<script setup lang="ts">
import type { Curve } from '#shared/types'

const props = withDefaults(defineProps<{
  current: Curve
  grumble?: Curve | null
  baseline: number
  height?: number
}>(), { grumble: null, height: 220 })

// viewBox 0 0 400 220; y 70–240 mg/dL; x 0–240 min (14 §whatif)
const W = 400
const H = 220
const pad = { l: 30, r: 10, t: 22, b: 24 }
const Y0 = 70
const Y1 = 240
const T1 = 240

const x = (t: number) => pad.l + (t / T1) * (W - pad.l - pad.r)
const y = (v: number) => pad.t + (1 - (Math.min(Math.max(v, Y0), Y1) - Y0) / (Y1 - Y0)) * (H - pad.t - pad.b)

const linePath = (c: Curve) =>
  c.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.mg_dl).toFixed(1)}`).join('')

const areaPath = (c: Curve) => {
  const first = c.points[0]
  const last = c.points[c.points.length - 1]
  if (!first || !last) return ''
  return `${linePath(c)}L${x(last.t).toFixed(1)},${y(props.baseline).toFixed(1)}L${x(first.t).toFixed(1)},${y(props.baseline).toFixed(1)}Z`
}

const bandPath = (c: Curve) => {
  if (!c.band.length) return ''
  const hi = c.band.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.hi).toFixed(1)}`).join('')
  const lo = [...c.band].reverse().map(p => `L${x(p.t).toFixed(1)},${y(p.lo).toFixed(1)}`).join('')
  return `${hi}${lo}Z`
}

const grid = [100, 140, 180]
const ticks = [0, 60, 120, 180, 240]
const tickLabel = (t: number) => (t === 0 ? '0' : `${t / 60}h`)

// Remount the grumble line when its shape changes so it draws in again.
const grumbleKey = computed(() => props.grumble?.points.map(p => p.mg_dl).join(',') ?? '')
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" width="100%" :height="height" class="block overflow-visible" role="img" aria-label="mg/dL">
    <!-- grid -->
    <g class="text-crema-800/50" font-size="10" font-family="var(--font-sans)">
      <line v-for="g in grid" :key="g" :x1="pad.l" :x2="W - pad.r" :y1="y(g)" :y2="y(g)"
            :stroke="g === 140 ? 'currentColor' : 'var(--color-crema-200)'" :stroke-dasharray="g === 140 ? '4 4' : undefined"
            stroke-width="1" />
      <text v-for="g in grid" :key="`l${g}`" :x="pad.l - 6" :y="y(g) + 3" text-anchor="end" fill="currentColor">{{ g }}</text>
      <text v-for="tk in ticks" :key="`t${tk}`" :x="x(tk)" :y="H - 6" text-anchor="middle" fill="currentColor">{{ tickLabel(tk) }}</text>
    </g>

    <!-- baseline -->
    <line :x1="pad.l" :x2="W - pad.r" :y1="y(baseline)" :y2="y(baseline)" stroke="var(--color-crema-800)" stroke-opacity="0.35" stroke-width="1" />

    <!-- current: coral -->
    <path :d="bandPath(current)" fill="var(--color-grumble-500)" fill-opacity="0.08" />
    <path :d="areaPath(current)" fill="var(--color-grumble-500)" fill-opacity="0.12" />
    <path :d="linePath(current)" fill="none" stroke="var(--color-grumble-500)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />

    <!-- grumble's move: cafecito -->
    <g v-if="grumble" :key="grumbleKey">
      <path :d="bandPath(grumble)" fill="var(--color-cafecito-500)" fill-opacity="0.08" class="fade" />
      <path :d="areaPath(grumble)" fill="var(--color-cafecito-500)" fill-opacity="0.12" class="fade" />
      <path :d="linePath(grumble)" fill="none" stroke="var(--color-cafecito-500)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="draw" />
    </g>

    <!-- peaks -->
    <g font-family="var(--font-display)" font-size="17" font-weight="600" class="tabular">
      <circle :cx="x(current.time_to_peak_min)" :cy="y(current.peak_mg_dl)" r="4.5" fill="var(--color-grumble-500)" stroke="white" stroke-width="2" />
      <text :x="x(current.time_to_peak_min) + 8" :y="y(current.peak_mg_dl) - 6" fill="var(--color-grumble-600)">{{ Math.round(current.peak_mg_dl) }}</text>
      <template v-if="grumble">
        <circle :cx="x(grumble.time_to_peak_min)" :cy="y(grumble.peak_mg_dl)" r="4.5" fill="var(--color-cafecito-500)" stroke="white" stroke-width="2" />
        <text :x="x(grumble.time_to_peak_min) + 8" :y="y(grumble.peak_mg_dl) - 6" fill="var(--color-cafecito-700)">{{ Math.round(grumble.peak_mg_dl) }}</text>
      </template>
    </g>
  </svg>
</template>

<style scoped>
.draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 600ms ease-out forwards; }
.fade { animation: fade 600ms ease-out; }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .draw { animation: none; stroke-dashoffset: 0; }
  .fade { animation: none; }
}
</style>

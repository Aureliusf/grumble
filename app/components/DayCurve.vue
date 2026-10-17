<script setup lang="ts">
// A whole waking day of glucose (from wake-up, on the person's own clock): the usual day (coral) and the balanced day (cafecito).
// Hand-rolled SVG like GlucoseCurve; points come from shared/simulate.ts dayCurve().
interface Pt { t: number; mg_dl: number }
const props = defineProps<{ usual: Pt[]; balanced: Pt[]; baseline: number; meals: { at: number; label: string }[]; from: number; to: number }>()

const W = 400
const H = 220
const pad = { l: 30, r: 10, t: 16, b: 24 }
const T0 = computed(() => props.from)
const T1 = computed(() => props.to)
const Y0 = 70
const Y1 = 240
const x = (t: number) => pad.l + ((t - T0.value) / (T1.value - T0.value)) * (W - pad.l - pad.r)
const y = (v: number) => pad.t + (1 - (Math.min(Math.max(v, Y0), Y1) - Y0) / (Y1 - Y0)) * (H - pad.t - pad.b)
const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.mg_dl).toFixed(1)}`).join('')
const area = (pts: Pt[]) => `${path(pts)}L${x(T1.value)},${y(props.baseline)}L${x(T0.value)},${y(props.baseline)}Z`
const grid = [100, 140, 180]
// A tick every three hours on the clock, across the person's day.
const ticks = computed(() => { const out: number[] = []; for (let t = Math.ceil(T0.value / 180) * 180; t <= T1.value; t += 180) out.push(t); return out })
const tick = (t: number) => { const h = (t / 60) % 24; return h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a` }
const key = computed(() => props.balanced.map(p => Math.round(p.mg_dl)).join(','))
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" width="100%" :height="220" class="block overflow-visible" role="img" aria-label="mg/dL">
    <g font-size="10" font-family="var(--font-sans)" class="text-crema-800/50">
      <line v-for="g in grid" :key="g" :x1="pad.l" :x2="W - pad.r" :y1="y(g)" :y2="y(g)"
            :stroke="g === 140 ? 'currentColor' : 'var(--color-crema-200)'" :stroke-dasharray="g === 140 ? '4 4' : undefined" />
      <text v-for="g in grid" :key="`l${g}`" :x="pad.l - 6" :y="y(g) + 3" text-anchor="end" fill="currentColor">{{ g }}</text>
      <text v-for="tk in ticks" :key="`t${tk}`" :x="x(tk)" :y="H - 6" text-anchor="middle" fill="currentColor">{{ tick(tk) }}</text>
    </g>
    <line :x1="pad.l" :x2="W - pad.r" :y1="y(baseline)" :y2="y(baseline)" stroke="var(--color-crema-800)" stroke-opacity="0.35" />

    <!-- meal times -->
    <g v-for="m in meals" :key="m.label">
      <line :x1="x(m.at)" :x2="x(m.at)" :y1="pad.t" :y2="H - pad.b" stroke="var(--color-crema-200)" />
      <text :x="x(m.at) + 3" :y="pad.t + 2" font-size="10" fill="var(--color-crema-800)" fill-opacity="0.6" font-family="var(--font-sans)">{{ m.label }}</text>
    </g>

    <path :d="area(usual)" fill="var(--color-grumble-500)" fill-opacity="0.10" />
    <path :d="path(usual)" fill="none" stroke="var(--color-grumble-500)" stroke-width="2.5" stroke-linejoin="round" />
    <g :key="key">
      <path :d="area(balanced)" fill="var(--color-cafecito-500)" fill-opacity="0.12" class="fade" />
      <path :d="path(balanced)" fill="none" stroke="var(--color-cafecito-500)" stroke-width="3" stroke-linejoin="round" pathLength="1" class="draw" />
    </g>
  </svg>
</template>

<style scoped>
.draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 700ms ease-out forwards; }
.fade { animation: fade 700ms ease-out; }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .draw { animation: none; stroke-dashoffset: 0; } .fade { animation: none; } }
</style>

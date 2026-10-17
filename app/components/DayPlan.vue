<script setup lang="ts">
import type { BalancedDay } from '#shared/balance'

// One day: three plates and the day's totals against the targets.
import { SLOTS, type Slot } from '#shared/balance'

const props = defineProps<{ day: BalancedDay; fixedLabel: string; removable?: boolean; skipped?: Slot[] }>()
const emit = defineEmits<{ remove: [slot: string] }>()
const { t } = useI18n()

const heavyLine = computed(() => {
  const h = props.day.heavy[0]
  return h ? t('day.heavy', { dish: h.dish.name }) : null
})
const r = (n: number) => Math.round(n)
const meters = computed(() => {
  const { totals: x, targets: g } = props.day
  return [
    { key: 'kcal', v: x.calories, g: g.calories, cap: true },
    { key: 'carbs', v: x.carbs_g, g: g.carbs_g, cap: true },
    { key: 'fiber', v: x.fiber_g, g: g.fiber_g, cap: false },
    { key: 'protein', v: x.protein_g, g: g.protein_g, cap: false },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <p v-if="heavyLine" class="font-display font-semibold text-[17px] leading-snug text-cafecito-700">{{ heavyLine }}</p>

    <!-- a meal already past and not logged: shown, not planned -->
    <div
      v-for="s in SLOTS.filter(x => skipped?.includes(x) && !day.plates.some(p => p.slot === x))"
      :key="`skip-${s}`"
      class="rounded-[var(--radius-grumble)] border-2 border-dashed border-crema-200 dark:border-crema-800 px-4 py-3 flex gap-3 text-[15px] text-crema-800/60"
    >
      <span class="w-20 shrink-0 font-semibold">{{ t(`day.slots.${s}`) }}</span>
      <span>{{ t('day.not_logged') }}</span>
    </div>

    <div
      v-for="p in day.plates"
      :key="p.slot"
      class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex gap-3"
      :class="p.pending ? 'border-2 border-dashed border-cafecito-300' : p.fixed ? 'ring-2 ring-grumble-200' : ''"
    >
      <div class="w-20 shrink-0">
        <p class="text-[15px] font-semibold text-crema-800/70">{{ t(`day.slots.${p.slot}`) }}</p>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-display font-semibold text-[17px] leading-snug">{{ p.dish.name }}</p>
        <div class="mt-1 flex flex-wrap gap-1.5">
          <UBadge v-if="p.pending" color="secondary" variant="soft" icon="i-lucide-clock" class="rounded-full">{{ t('day.pending') }}</UBadge>
          <UBadge v-else-if="p.fixed" color="primary" variant="soft" class="rounded-full">{{ fixedLabel }}</UBadge>
          <UBadge v-if="p.portion < 1" color="secondary" variant="soft" class="rounded-full">{{ t('day.smaller') }}</UBadge>
        </div>
        <p class="mt-1 text-[15px] text-crema-800/70 tabular">
          {{ r(p.n.calories) }} kcal · {{ r(p.n.carbs_g) }} g {{ t('day.carbs') }} · {{ r(p.n.fiber_g) }} g {{ t('day.fiber') }} · {{ r(p.n.protein_g) }} g {{ t('day.protein') }}
        </p>
      </div>
      <UButton v-if="removable && p.fixed && !p.pending" icon="i-lucide-x" size="sm" color="neutral" variant="ghost" :aria-label="t('day.remove')" @click="emit('remove', p.slot)" />
    </div>

    <!-- the day against its targets -->
    <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 grid grid-cols-2 gap-x-4 gap-y-3">
      <div v-for="m in meters" :key="m.key">
        <div class="flex items-baseline justify-between text-[15px]">
          <span class="font-semibold">{{ capitalize(t(`day.${m.key}`)) }}</span>
          <span class="tabular text-crema-800/70">{{ t('day.of', { n: r(m.v), target: m.g }) }}</span>
        </div>
        <div class="mt-1 h-2 rounded-full bg-crema-100 dark:bg-crema-800 overflow-hidden">
          <div
            class="h-full rounded-full"
            :class="m.cap && m.v > m.g * 1.05 ? 'bg-grumble-500' : 'bg-cafecito-500'"
            :style="{ width: `${Math.min(100, (m.v / m.g) * 100)}%` }"
          />
        </div>
      </div>
      <p class="col-span-2 text-xs text-crema-800/60">{{ t('day.targets_note') }}</p>
    </div>
  </div>
</template>

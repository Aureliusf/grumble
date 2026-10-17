<script setup lang="ts">
import type { Nutrients } from '#shared/nutrition'

// Protein, carbs, fat and sugar as four tiles, calories and fiber underneath. Grams, rounded.
const props = defineProps<{ n: Nutrients; tone?: 'ate' | 'next' }>()
const { t } = useI18n()
const r = (x?: number) => Math.round(x ?? 0)
const tiles = computed(() => [
  { key: 'protein', v: props.n.protein_g },
  { key: 'carbs', v: props.n.carbs_g },
  { key: 'fat', v: props.n.fat_g },
  { key: 'sugar', v: props.n.sugar_g },
])
</script>

<template>
  <div class="mt-2">
    <div class="grid grid-cols-4 gap-1.5">
      <div
        v-for="x in tiles"
        :key="x.key"
        class="rounded-xl px-2 py-1.5 text-center"
        :class="tone === 'next' ? 'bg-cafecito-50 dark:bg-crema-800' : 'bg-crema-100 dark:bg-crema-800'"
      >
        <div class="font-display font-semibold text-[20px] leading-tight tabular">{{ r(x.v) }}<span class="text-[13px] font-medium"> g</span></div>
        <div class="text-[13px] text-crema-800/70">{{ t(`macros.${x.key}`) }}</div>
      </div>
    </div>
    <p class="mt-1 text-xs text-crema-800/60 tabular">{{ r(n.calories) }} kcal · {{ r(n.fiber_g) }} g {{ t('macros.fiber') }}</p>
  </div>
</template>

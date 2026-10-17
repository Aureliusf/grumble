<script setup lang="ts">
import type { Standard } from '#shared/types'

const props = defineProps<{ standard: Standard }>()
const { locale } = useI18n()

const ICONS: Record<string, string> = {
  last_meal_by: 'i-lucide-clock',
  walk_after_dinner_min: 'i-lucide-footprints',
  protein_first: 'i-lucide-bean',
  starch_portion_g: 'i-lucide-soup',
  custom: 'i-lucide-croissant',
  social_nights_per_week: 'i-lucide-utensils',
}
const icon = computed(() => ICONS[props.standard.kind] ?? 'i-lucide-check')
const statement = computed(() =>
  locale.value === 'en' && props.standard.statement_en ? props.standard.statement_en : props.standard.statement)
</script>

<template>
  <UCard>
    <div class="flex gap-3">
      <div class="shrink-0 size-11 rounded-full bg-grumble-50 text-grumble-500 grid place-items-center">
        <UIcon :name="icon" class="size-6" />
      </div>
      <div>
        <p class="font-display font-semibold text-[20px] leading-snug">{{ statement }}</p>
        <p class="mt-1 text-[15px] text-crema-800/70 dark:text-crema-200/70">{{ standard.why }}</p>
      </div>
    </div>
  </UCard>
</template>

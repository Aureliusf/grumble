<script setup lang="ts">
import { MEAL_SLOTS, type MealParse } from '~/intake/meal'

// What Grumble made of one meal: its parts, and when it's eaten (the person can change only that).
defineProps<{ meal: MealParse }>()
const slot = defineModel<string>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex flex-col gap-3">
    <p v-if="meal.say" class="font-display font-semibold text-[20px] leading-snug">{{ meal.say }}</p>
    <div v-if="meal.items.length">
      <MealItems :items="meal.items" />
      <p class="mt-2 text-xs text-crema-800/50">{{ t('today.usda_note') }}</p>
    </div>
    <div class="flex flex-col gap-2">
      <p class="text-[15px] text-crema-800/60">{{ t('intake.ui.meal_type') }}</p>
      <div class="flex flex-wrap gap-2">
        <UButton v-for="s in MEAL_SLOTS" :key="s" size="lg" :color="slot === s ? 'primary' : 'neutral'" :variant="slot === s ? 'solid' : 'outline'" @click="slot = s">
          {{ t(`intake.opt.meal_type.${s}`) }}
        </UButton>
      </div>
    </div>
  </div>
</template>

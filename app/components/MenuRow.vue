<script setup lang="ts">
import type { MenuItem } from '#shared/types'

defineProps<{ item: MenuItem }>()
const { t } = useI18n()
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-4' }">
    <p class="font-display font-semibold text-[17px] leading-snug">{{ item.name }}</p>
    <p class="text-[15px] text-grumble-600">{{ item.move }}</p>
    <p class="mt-1 text-[15px] text-crema-800/70 tabular">
      {{ item.calories }} {{ t('table.menu.kcal') }} · {{ item.carbs_g }} {{ t('table.menu.carbs') }} · {{ item.fiber_g }} {{ t('table.menu.fiber') }}
    </p>
    <UButton
      :to="{ path: '/whatif', query: { dish: item.dish_id, time: '18:30', walk: '10', move: '1' } }"
      color="secondary"
      variant="soft"
      size="lg"
      class="mt-3"
      trailing-icon="i-lucide-activity"
    >{{ t('table.menu.what_does') }}</UButton>
  </UCard>
</template>

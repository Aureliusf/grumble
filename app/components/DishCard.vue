<script setup lang="ts">
import type { RotationItem } from '#shared/types'

defineProps<{ item: RotationItem; name: string }>()
const { t } = useI18n()
</script>

<template>
  <NuxtLink
    :to="{ path: '/whatif', query: { dish: item.dish_id } }"
    class="snap-start shrink-0 w-[15rem] rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
  >
    <div class="flex items-start gap-2">
      <p class="font-display font-semibold text-[17px] leading-snug flex-1">{{ name }}</p>
      <UIcon v-if="item.star" name="i-lucide-star" class="size-5 shrink-0 text-grumble-500 fill-current" :aria-label="t('plan.star')" />
    </div>
    <p class="text-[15px] text-grumble-600 leading-snug flex-1">{{ item.move }}</p>
    <div class="flex items-center gap-1.5">
      <UBadge color="neutral" variant="soft" class="rounded-full">{{ t(`plan.slot.${item.slot}`) }}</UBadge>
      <UBadge v-if="item.cost_usd != null" color="secondary" variant="soft" class="rounded-full tabular">${{ item.cost_usd.toFixed(2) }}</UBadge>
    </div>
  </NuxtLink>
</template>

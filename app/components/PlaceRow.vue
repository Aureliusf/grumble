<script setup lang="ts">
import type { Place } from '#shared/types'

defineProps<{ place: Place; skipLabel: string }>()
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-4' }">
    <div class="flex gap-3">
      <div class="shrink-0 size-11 rounded-full bg-cafecito-50 text-cafecito-500 grid place-items-center">
        <UIcon name="i-lucide-map-pin" class="size-6" />
      </div>
      <div>
        <p class="font-display font-semibold text-[17px]">{{ place.venue }}</p>
        <p v-if="place.order" class="text-[15px] font-bold leading-snug">{{ place.order }}</p>
        <p v-if="place.avoid" class="mt-1 text-[15px] text-crema-800/60">{{ skipLabel }} {{ place.avoid }}</p>
      </div>
    </div>
  </UCard>
</template>

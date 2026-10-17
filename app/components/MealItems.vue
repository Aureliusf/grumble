<script setup lang="ts">
import { totalOf, type PricedItem } from '#shared/meals'

// What a meal came to: each food, the amount, the numbers. Shared by Today's log and the intake meal.
const props = defineProps<{ items: PricedItem[] }>()
const r = (n: number) => Math.round(n)
const amount = (i: PricedItem) => (i.kind === 'component' ? `${i.grams} g` : `×${i.portion}`)
const total = computed(() => totalOf(props.items))
</script>

<template>
  <div>
    <ul class="mt-1 flex flex-col gap-0.5 text-[15px]">
      <li v-for="(i, k) in items" :key="k" class="flex justify-between gap-3 tabular">
        <span class="text-crema-800/80 truncate">{{ i.name }} <span v-if="i.said" class="text-crema-800/50">· {{ i.said }}</span></span>
        <span class="shrink-0 text-crema-800/70">{{ amount(i) }} · {{ r(i.n.calories) }} kcal</span>
      </li>
    </ul>
    <MacroTiles :n="total" />
  </div>
</template>

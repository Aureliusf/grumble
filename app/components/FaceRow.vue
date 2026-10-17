<script setup lang="ts">
type Score = 1 | 2 | 3 | 4 | 5

defineProps<{ label: string; labels: string[] }>()
const model = defineModel<Score | undefined>()
const FACES = ['😣', '🙁', '😐', '🙂', '😄']
const scores: Score[] = [1, 2, 3, 4, 5]
</script>

<template>
  <fieldset>
    <legend class="font-display font-semibold text-[20px] mb-2">{{ label }}</legend>
    <div class="grid grid-cols-5 gap-1" role="radiogroup">
      <button
        v-for="s in scores"
        :key="s"
        type="button"
        role="radio"
        :aria-checked="model === s"
        class="flex flex-col items-center gap-1 focus:outline-none group"
        @click="model = model === s ? undefined : s"
      >
        <span
          class="size-14 rounded-full grid place-items-center text-[28px] transition-all ring-2"
          :class="model === s ? 'bg-grumble-100 ring-grumble-500 scale-105' : 'bg-crema-100 ring-transparent group-focus-visible:ring-grumble-300'"
        >{{ FACES[s - 1] }}</span>
        <span class="text-[15px] leading-tight text-center" :class="model === s ? 'font-bold text-grumble-600' : 'text-crema-800/70'">{{ labels[s - 1] }}</span>
      </button>
    </div>
  </fieldset>
</template>

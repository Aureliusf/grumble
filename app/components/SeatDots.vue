<script setup lang="ts">
const props = defineProps<{ total: number; left: number }>()
const taken = computed(() => props.total - props.left)
</script>

<template>
  <div class="flex gap-1" aria-hidden="true">
    <span
      v-for="i in total"
      :key="i"
      class="size-3 rounded-full"
      :class="i <= taken ? 'bg-grumble-500' : 'bg-crema-200 dark:bg-crema-800'"
    />
  </div>
</template>

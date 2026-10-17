<script setup lang="ts">
// A short free list with quick picks: refuses, places, eats_with, never_mention.
const props = defineProps<{ suggestions?: string[] }>()
const model = defineModel<string[]>({ required: true })
const { t } = useI18n()
const draft = ref('')

function add(v: string) {
  const x = v.trim()
  if (x && !model.value.includes(x)) model.value = [...model.value, x]
  draft.value = ''
}
const remove = (v: string) => { model.value = model.value.filter(x => x !== v) }
const open = computed(() => (props.suggestions ?? []).filter(s => !model.value.includes(s)))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="model.length" class="flex flex-wrap gap-2">
      <UButton v-for="v in model" :key="v" color="primary" size="lg" trailing-icon="i-lucide-x" @click="remove(v)">{{ v }}</UButton>
    </div>
    <form class="flex gap-2" @submit.prevent="add(draft)">
      <UInput v-model="draft" :placeholder="t('intake.ui.type_here')" size="xl" class="flex-1" :ui="{ base: 'rounded-full' }" />
      <UButton type="submit" color="secondary" variant="soft" icon="i-lucide-plus" :disabled="!draft.trim()" :aria-label="t('intake.ui.add')" />
    </form>
    <div v-if="open.length" class="flex flex-wrap gap-2">
      <UButton v-for="s in open" :key="s" color="neutral" variant="outline" size="lg" icon="i-lucide-plus" @click="add(s)">{{ s }}</UButton>
    </div>
  </div>
</template>

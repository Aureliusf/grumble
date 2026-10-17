<script setup lang="ts">
import type { Dish } from '#shared/types'

// Up to five loved dishes: autocomplete from dishes.json, free text allowed (03 §Taste).
const props = defineProps<{ dishes: Dish[]; food?: string }>()
const model = defineModel<string[]>({ required: true })
const { t } = useI18n()
const q = ref('')
const MAX = 5

const byId = computed(() => new Map(props.dishes.map(d => [d.id, d])))
const label = (id: string) => byId.value.get(id)?.name ?? id

// Their cuisine first, then everything else, filtered by the search words.
const cuisineHint = computed(() => (props.food ?? '').toLowerCase().slice(0, 4))
const matches = computed(() => {
  const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
  const pool = props.dishes.filter(d => !model.value.includes(d.id))
  const hit = (d: Dish) => words.every(w => d.name.toLowerCase().includes(w))
  const mine = (d: Dish) => !!cuisineHint.value && d.cuisine.toLowerCase().startsWith(cuisineHint.value)
  const list = words.length ? pool.filter(hit) : pool.filter(mine)
  return list.sort((a, b) => Number(mine(b)) - Number(mine(a))).slice(0, 6)
})

function add(v: string) {
  if (model.value.length >= MAX || model.value.includes(v)) return
  model.value = [...model.value, v]
  q.value = ''
}
const remove = (v: string) => { model.value = model.value.filter(x => x !== v) }
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-2">
      <UButton v-for="v in model" :key="v" color="primary" size="lg" trailing-icon="i-lucide-x" @click="remove(v)">{{ label(v) }}</UButton>
      <span class="self-center text-[15px] text-crema-800/60 tabular">{{ t('intake.ui.up_to', { n: model.length }) }}</span>
    </div>
    <template v-if="model.length < MAX">
      <UInput v-model="q" :placeholder="t('intake.ui.search_dishes')" icon="i-lucide-search" size="xl" :ui="{ base: 'rounded-full' }" />
      <div class="flex flex-col gap-1.5">
        <UButton
          v-for="d in matches"
          :key="d.id"
          color="neutral"
          variant="soft"
          size="lg"
          icon="i-lucide-plus"
          class="justify-start text-left"
          @click="add(d.id)"
        >{{ d.name }}</UButton>
        <UButton v-if="q.trim() && !matches.length" color="secondary" variant="outline" size="lg" icon="i-lucide-plus" class="justify-start" @click="add(q.trim())">
          {{ t('intake.ui.add_as_written', { text: q.trim() }) }}
        </UButton>
      </div>
    </template>
  </div>
</template>

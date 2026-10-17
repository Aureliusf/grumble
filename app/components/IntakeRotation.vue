<script setup lang="ts">
import type { Dish, Lang } from '#shared/types'
import { movesFor, type IntakeAnswers } from '~/intake/rules'

// Each loved dish with its move from the 09 vocabulary; the person stars defaults (03 §Stage 6).
const props = defineProps<{ loves: string[]; dishes: Dish[]; appetite?: IntakeAnswers['appetite']; lang: Lang }>()
const starred = defineModel<string[]>({ required: true })
const { t } = useI18n()

const byId = computed(() => new Map(props.dishes.map(d => [d.id, d])))
const rows = computed(() => props.loves.map((id) => {
  const d = byId.value.get(id)
  return { id, name: d?.name ?? id, move: d ? movesFor(d, props.appetite).map(m => t(`moves.${m}`, {}, { locale: props.lang })).join(' ') : null }
}))
const toggle = (id: string) => {
  starred.value = starred.value.includes(id) ? starred.value.filter(x => x !== id) : [...starred.value, id]
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      v-for="r in rows"
      :key="r.id"
      type="button"
      class="text-left rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 flex gap-3 items-start"
      :aria-pressed="starred.includes(r.id)"
      @click="toggle(r.id)"
    >
      <div class="flex-1">
        <p class="font-display font-semibold text-[17px] leading-snug">{{ r.name }}</p>
        <p v-if="r.move" class="text-[15px] text-grumble-600">{{ r.move }}</p>
        <p v-else class="text-[15px] text-crema-800/60">{{ t('intake.ui.no_numbers') }}</p>
      </div>
      <UIcon name="i-lucide-star" class="size-7 shrink-0" :class="starred.includes(r.id) ? 'text-grumble-500' : 'text-crema-200'" />
    </button>
  </div>
</template>

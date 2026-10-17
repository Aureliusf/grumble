<script setup lang="ts">
import { SLOTS } from '#shared/balance'

// After a meal is logged: the next meal the balanced day recommends, with its numbers and one line of why.
// It's the same plate "The rest of today" shows; nothing here is chosen separately.
const PERSON = 'N0771'
const { t } = useI18n()
const { today: day, eaten } = useDay(PERSON)

const next = computed(() => {
  const slots = eaten.value.map(e => e.slot)
  if (!slots.length) return null
  const last = Math.max(...slots.map(s => SLOTS.indexOf(s)))
  const slot = SLOTS.slice(last + 1).find(s => !slots.includes(s))
  return slot ? day.value.plates.find(p => p.slot === slot && !p.fixed) ?? null : null
})
const heavy = computed(() => day.value.heavy[0]?.dish.name)
</script>

<template>
  <div v-if="next" class="mt-4 rounded-[var(--radius-grumble)] border-2 border-cafecito-200 dark:border-crema-800 p-3">
    <p class="text-[15px] font-semibold text-cafecito-700 flex items-center gap-1.5">
      <UIcon name="i-lucide-arrow-right" class="size-4" />{{ t('next.title', { slot: t(`day.slots.${next.slot}`) }) }}
    </p>
    <div class="mt-1 flex items-start gap-2">
      <p class="flex-1 font-display font-semibold text-[17px] leading-snug">{{ next.dish.name }}</p>
      <UBadge v-if="next.portion < 1" color="secondary" variant="soft" class="rounded-full shrink-0">{{ t('day.smaller') }}</UBadge>
    </div>
    <p class="text-[15px] text-crema-800/70 leading-snug">{{ heavy ? t('next.why_heavy', { dish: heavy }) : t('next.why_fit') }}</p>
    <MacroTiles :n="next.n" tone="next" />
  </div>
</template>

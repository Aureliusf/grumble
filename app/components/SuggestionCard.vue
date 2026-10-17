<script setup lang="ts">
import type { TodayResponse } from '#shared/types'

type Card = TodayResponse['card']

const props = defineProps<{ card: Card; date: string; dishName?: string; accepted?: string | null }>()
const emit = defineEmits<{ action: [id: string] }>()
const { t, locale } = useI18n()

const time = computed(() => fmtTime(props.card.time, locale.value))
// The table's date and time in numbers: "Tue, 1/14 · 6:30 PM" / "mar, 14/1 · 6:30 p. m."
const when = computed(() => `${fmtDate(props.date, locale.value, { weekday: 'short', month: 'numeric', day: 'numeric' })} · ${time.value}`)
const weekday = computed(() => capitalize(fmtDate(props.date, locale.value, { weekday: 'long' })))
const evidenceKey = computed(() => props.card.evidence.replace(' ', '_'))
const [primary, ...others] = props.card.actions
</script>

<template>
  <div class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm overflow-hidden">
    <!-- table: coral band -->
    <template v-if="card.kind === 'table'">
      <div class="bg-grumble-500 text-white px-5 py-4 flex items-center gap-3">
        <UIcon name="i-lucide-utensils" class="size-7" />
        <div class="flex-1">
          <p class="font-display font-semibold text-[15px] uppercase tracking-[0.12em] opacity-90">{{ t('today.invited') }}</p>
          <p class="font-display font-bold text-[26px] leading-tight">{{ card.title }}</p>
          <p class="font-display font-semibold text-[20px] tabular opacity-95">{{ capitalize(when) }}</p>
        </div>
      </div>
      <div class="p-5 flex flex-col gap-3">
        <p class="text-[17px]">{{ card.body }}</p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge v-if="card.person" color="primary" variant="soft" size="lg" icon="i-lucide-user" class="rounded-full">{{ card.person }}</UBadge>
          <UBadge color="secondary" variant="soft" size="lg" icon="i-lucide-footprints" class="rounded-full">{{ t('today.walk_n', { n: card.walk_min }) }}</UBadge>
        </div>
        <TableInfo :host="card.person" />
        <div v-if="accepted === 'seat'" class="flex items-center gap-2 font-display font-semibold text-[20px] text-grumble-600">
          <UIcon name="i-lucide-circle-check" class="size-7" /> {{ weekday }}
        </div>
        <div v-else-if="!accepted" class="flex flex-col gap-2">
          <UButton v-if="primary" color="primary" block @click="emit('action', primary.id)">{{ primary.label }}</UButton>
          <UButton v-for="a in others" :key="a.id" color="neutral" variant="ghost" block @click="emit('action', a.id)">{{ a.label }}</UButton>
        </div>
      </div>
    </template>

    <!-- red: calm, the coach, one instruction -->
    <div v-else-if="card.kind === 'red'" class="p-6 flex flex-col gap-3">
      <UBadge v-if="card.person" color="secondary" variant="soft" size="lg" icon="i-lucide-phone" class="rounded-full self-start">{{ card.person }}</UBadge>
      <p class="font-display font-semibold text-[20px] leading-snug">{{ card.title }}</p>
      <p class="text-[17px]">{{ card.body }}</p>
    </div>

    <!-- dinner / place -->
    <div v-else class="p-5 flex flex-col gap-3">
      <p class="font-display font-bold text-[26px] leading-tight">{{ card.kind === 'dinner' && dishName ? dishName : card.title }}</p>
      <p v-if="card.move" class="text-[17px] text-grumble-600 font-semibold">{{ card.move }}</p>
      <p class="text-[17px]">{{ card.body }}</p>
      <div class="flex flex-wrap gap-1.5">
        <UBadge color="primary" variant="soft" size="lg" icon="i-lucide-clock" class="rounded-full tabular">{{ time }}</UBadge>
        <UBadge color="secondary" variant="soft" size="lg" icon="i-lucide-footprints" class="rounded-full">{{ t('today.walk_n', { n: card.walk_min }) }}</UBadge>
        <UBadge v-if="card.person" color="primary" variant="soft" size="lg" icon="i-lucide-user" class="rounded-full">{{ card.person }}</UBadge>
      </div>
      <div v-if="card.actions.length && !accepted" class="flex flex-col gap-2">
        <UButton v-for="(a, i) in card.actions" :key="a.id" :color="i ? 'neutral' : 'primary'" :variant="i ? 'ghost' : 'solid'" block @click="emit('action', a.id)">{{ a.label }}</UButton>
      </div>
    </div>

    <div class="px-5 pb-3 -mt-1 flex justify-end">
      <span class="text-xs text-crema-800/50">{{ t(`today.evidence.${evidenceKey}`) }}</span>
    </div>
  </div>
</template>

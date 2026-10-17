<script setup lang="ts">
import type { Table } from '#shared/types'

const props = defineProps<{ table: Table; busy?: boolean }>()
const emit = defineEmits<{ seat: []; host: [] }>()
const { t, locale } = useI18n()

const hostless = computed(() => props.table.host.years_out === 0 && props.table.host.name === '—')
const date = computed(() => capitalize(fmtDate(props.table.date, locale.value)))
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-3">
      <div class="flex items-baseline justify-between gap-2">
        <p class="font-display font-semibold text-[20px]">{{ date }}</p>
        <span class="font-display text-[17px] text-crema-800/70 tabular">{{ fmtTime(table.time, locale) }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <template v-if="!hostless">
          <span class="font-semibold">{{ table.host.name }}</span>
          <UBadge color="secondary" variant="soft" class="rounded-full">{{ t('table.years_out', { n: table.host.years_out }) }}</UBadge>
        </template>
        <span v-else class="font-semibold">{{ t('table.host_you') }}</span>
        <UBadge color="neutral" variant="soft" icon="i-lucide-languages" class="rounded-full">{{ t(`table.language.${table.language}`) }}</UBadge>
      </div>

      <div class="flex items-center gap-3">
        <SeatDots :total="table.seats_total" :left="table.seats_left" />
        <span class="text-[15px] tabular">{{ t('table.seats_left', table.seats_left) }}</span>
      </div>

      <p v-if="table.funded_by" class="text-[15px] text-cafecito-700 flex items-center gap-1.5">
        <UIcon name="i-lucide-heart-handshake" class="size-5" /> {{ t('table.funded_by', { name: table.funded_by }) }}
      </p>

      <div v-if="table.mine === 'guest'" class="flex items-center gap-2 font-display font-semibold text-[20px] text-grumble-600">
        <UIcon name="i-lucide-circle-check" class="size-7" /> {{ t('table.your_seat') }}
      </div>
      <div v-else-if="table.mine === 'host'" class="flex items-center gap-2 font-display font-semibold text-[20px] text-grumble-600">
        <UIcon name="i-lucide-circle-check" class="size-7" /> {{ t('table.hosting') }}
      </div>
      <UButton v-else-if="hostless" color="secondary" block icon="i-lucide-hand" @click="emit('host')">{{ t('table.host_this') }}</UButton>
      <UButton v-else-if="table.seats_left > 0" color="primary" block :loading="busy" @click="emit('seat')">{{ t('table.save_seat') }}</UButton>
      <UBadge v-else color="neutral" variant="soft" class="rounded-full self-start">{{ t('table.full') }}</UBadge>
    </div>
  </UCard>
</template>

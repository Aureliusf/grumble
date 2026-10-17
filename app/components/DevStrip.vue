<script setup lang="ts">
import type { Clock } from '#shared/types'
import { fixtures } from '~/fixtures'

const { t, locale } = useI18n()
const dev = useDevStrip()
const { data: clock } = useApi<Clock>('/api/clock', fixtures.clock)
</script>

<template>
  <div class="flex items-center gap-2 px-4 pb-1.5 text-xs text-crema-800/60 tabular">
    <span>{{ fmtDate(clock.today, locale) }} · {{ t('app.week', { n: clock.week }) }}</span>
    <UBadge v-if="dev.fixture" size="sm" color="warning" variant="soft" class="rounded-full">
      {{ t('app.fixture') }}
    </UBadge>
  </div>
</template>

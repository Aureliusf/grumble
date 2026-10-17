<script setup lang="ts">
import type { Clock } from '#shared/types'
import { fixtures } from '~/fixtures'

const { t, locale } = useI18n()
const dev = useDevStrip()
const { data: clock } = useApi<Clock>('/api/clock', fixtures.clock)

// A new page starts clean; only its own fallbacks light the chip.
const stop = useRouter().beforeEach(() => { dev.value.fallbacks = [] })
onBeforeUnmount(stop)
</script>

<template>
  <div class="flex items-center gap-2 px-4 pb-1.5 text-xs text-crema-800/60 tabular">
    <span>{{ fmtDate(clock.today, locale) }} · {{ t('app.week', { n: clock.week }) }}</span>
    <UBadge v-if="dev.fallbacks.length" :title="dev.fallbacks.join(', ')" size="sm" color="warning" variant="soft" class="rounded-full">
      {{ t('app.fixture') }}
    </UBadge>
  </div>
</template>

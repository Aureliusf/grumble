<script setup lang="ts">
import type { Fund } from '#shared/types'
import { fixtures } from '~/fixtures'

// "What is this?" for the Versailles table: what it is, who hosts, who pays, what's the catch (06).
// Plain answers for someone seeing the invite for the first time and wondering what's being sold.
const props = withDefaults(defineProps<{ host?: string; tone?: 'light' | 'card' }>(), { host: undefined, tone: 'card' })
const { t } = useI18n()
const { data: fund } = useApi<Fund>('/api/fund', fixtures.fund)
const open = ref(false)

const items = computed(() => [
  { q: t('tableInfo.what_q'), a: t('tableInfo.what_a') },
  { q: props.host ? t('tableInfo.host_q', { name: props.host }) : t('tableInfo.host_q_any'), a: t('tableInfo.host_a', { name: props.host ?? t('tableInfo.the_host') }) },
  { q: t('tableInfo.pay_q'), a: t('tableInfo.pay_a', { seat: `$${fund.value.seat_usd}` }) },
  { q: t('tableInfo.catch_q'), a: t('tableInfo.catch_a') },
])
</script>

<template>
  <UCollapsible v-model:open="open">
    <UButton
      color="neutral"
      variant="link"
      size="sm"
      icon="i-lucide-info"
      :trailing-icon="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
      class="px-0 font-sans font-semibold text-[15px]"
      :aria-expanded="open"
    >{{ t('tableInfo.toggle') }}</UButton>
    <template #content>
      <dl class="mt-2 rounded-[var(--radius-grumble)] bg-crema-100 dark:bg-crema-800 p-4 flex flex-col gap-3 text-[15px]">
        <div v-for="it in items" :key="it.q">
          <dt class="font-display font-semibold text-[17px]">{{ it.q }}</dt>
          <dd class="mt-0.5 text-crema-800 dark:text-crema-100 leading-snug">{{ it.a }}</dd>
        </div>
      </dl>
    </template>
  </UCollapsible>
</template>

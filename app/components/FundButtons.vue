<script setup lang="ts">
import type { Fund } from '#shared/types'

type FundKind = 'seat' | 'table' | 'month'

const props = defineProps<{ fund: Fund; busy?: FundKind | null }>()
const emit = defineEmits<{ fund: [kind: FundKind] }>()
const { t } = useI18n()

const options = computed(() => [
  { kind: 'seat' as const, usd: props.fund.seat_usd },
  { kind: 'table' as const, usd: props.fund.table_usd },
  { kind: 'month' as const, usd: props.fund.month_usd },
])
</script>

<template>
  <div class="flex flex-col gap-2">
    <UButton
      v-for="o in options"
      :key="o.kind"
      :color="o.kind === 'table' ? 'primary' : 'secondary'"
      :variant="o.kind === 'table' ? 'solid' : 'soft'"
      block
      size="xl"
      class="py-4 text-[20px] justify-center"
      :loading="busy === o.kind"
      @click="emit('fund', o.kind)"
    >
      <span class="tabular">${{ o.usd }}</span>
      <span class="font-medium">{{ t(`table.fund.${o.kind}`) }}</span>
    </UButton>
  </div>
</template>

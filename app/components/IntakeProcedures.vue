<script setup lang="ts">
import { procedureFor, type ProposedStandard } from '~/intake/rules'

// One procedure per standard; any can be switched to self-report (03 §Stage 4).
const props = defineProps<{ standards: ProposedStandard[] }>()
const manual = defineModel<string[]>({ required: true })
const { t } = useI18n()

const rows = computed(() => props.standards.map(s => ({ s, p: procedureFor(s, manual.value.includes(s.id)) })))
function toggle(id: string, on: boolean) {
  manual.value = on ? [...manual.value, id] : manual.value.filter(x => x !== id)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <UCard v-for="{ s, p } in rows" :key="s.id" :ui="{ body: 'p-4 sm:p-4' }">
      <p class="font-display font-semibold text-[17px] leading-snug">{{ s.statement }}</p>
      <p class="text-[15px] text-crema-800/70">{{ t(`intake.source.${p.source}`) }} · {{ t(`intake.cadence.${p.cadence}`) }}</p>
      <USwitch
        class="mt-2"
        :model-value="manual.includes(s.id)"
        :label="t('intake.ui.manual')"
        @update:model-value="toggle(s.id, $event)"
      />
    </UCard>
  </div>
</template>

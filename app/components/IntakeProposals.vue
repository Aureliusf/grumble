<script setup lang="ts">
import type { Proposal } from '~/intake/rules'

// Grumble proposes, the person edits (03 §Stage 3).
defineProps<{ coach: string }>()
const model = defineModel<Proposal[]>({ required: true })
const { t } = useI18n()

const declinedBoth = computed(() => model.value.filter(p => p.required).every(p => !p.accepted))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="p in model"
      :key="p.id"
      class="rounded-[var(--radius-grumble)] bg-white dark:bg-crema-900 shadow-sm p-4 transition-opacity"
      :class="p.accepted ? '' : 'opacity-50'"
    >
      <UTextarea
        v-model="p.statement"
        :disabled="!p.accepted"
        autoresize
        :rows="1"
        variant="none"
        class="w-full"
        :ui="{ base: '!font-display !font-semibold !text-[20px] !leading-snug !p-0 !text-crema-900 dark:!text-crema-50' }"
      />
      <p class="mt-1 text-[15px] text-crema-800/70">{{ p.why }}</p>
      <UButton
        class="mt-2"
        size="sm"
        :color="p.accepted ? 'neutral' : 'primary'"
        :variant="p.accepted ? 'ghost' : 'soft'"
        :icon="p.accepted ? 'i-lucide-x' : 'i-lucide-undo-2'"
        @click="p.accepted = !p.accepted"
      >{{ p.accepted ? t('intake.ui.not_this') : t('intake.ui.keep') }}</UButton>
    </div>
    <p v-if="declinedBoth" class="font-display font-semibold text-[17px] text-cafecito-700">{{ t('intake.ui.declined', { coach }) }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Table } from '#shared/types'

const props = defineProps<{ table: Table | null; busy?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [payload: { date: string; seats: number; language: Table['language'] }] }>()
const { t, locale } = useI18n()

const seats = ref(8)
const language = ref<Table['language']>('both')
const langs: Table['language'][] = ['es', 'en', 'both']
const date = computed(() => (props.table ? fmtDate(props.table.date, locale.value, { weekday: 'long', day: 'numeric', month: 'long' }) : ''))
</script>

<template>
  <UModal v-model:open="open" :title="t('table.modal.title', { date })" :description="t('table.modal.blurb')">
    <template #body>
      <div class="flex flex-col gap-6">
        <div>
          <p class="font-display font-semibold text-[20px] mb-3 tabular">{{ t('table.modal.seats', { n: seats }) }}</p>
          <USlider v-model="seats" :min="4" :max="8" :step="1" size="xl" />
        </div>
        <div>
          <p class="font-display font-semibold text-[17px] mb-2">{{ t('table.modal.language') }}</p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="l in langs"
              :key="l"
              size="lg"
              :color="language === l ? 'primary' : 'neutral'"
              :variant="language === l ? 'solid' : 'outline'"
              @click="language = l"
            >{{ t(`table.language.${l}`) }}</UButton>
          </div>
        </div>
        <UButton
          color="primary"
          block
          :loading="busy"
          @click="table && emit('submit', { date: table.date, seats, language })"
        >{{ t('table.modal.submit') }}</UButton>
      </div>
    </template>
  </UModal>
</template>

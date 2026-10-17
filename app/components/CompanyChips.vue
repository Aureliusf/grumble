<script setup lang="ts">
import type { Checkin } from '#shared/types'

type Company = Checkin['company']

defineProps<{ label: string }>()
const model = defineModel<Company | undefined>()
const { t } = useI18n()
const options: Company[] = ['alone', 'someone', 'out', 'table', 'unknown']
</script>

<template>
  <fieldset>
    <legend class="font-display font-semibold text-[20px] mb-2">{{ label }}</legend>
    <div class="flex flex-wrap gap-2" role="radiogroup">
      <UButton
        v-for="o in options"
        :key="o"
        size="lg"
        role="radio"
        :aria-checked="model === o"
        :color="model === o ? 'primary' : 'neutral'"
        :variant="model === o ? 'solid' : 'outline'"
        @click="model = o"
      >{{ t(`today.companies.${o}`) }}</UButton>
    </div>
  </fieldset>
</template>

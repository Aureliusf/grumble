<script setup lang="ts">
import type { Lang } from '#shared/types'

const { t } = useI18n()
const { locale, setLang } = useLang()
const langs: Lang[] = ['es', 'en']
</script>

<template>
  <UFieldGroup size="xs" :aria-label="t('app.language')">
    <UButton
      v-for="l in langs"
      :key="l"
      size="xs"
      :color="locale === l ? 'primary' : 'neutral'"
      :variant="locale === l ? 'solid' : 'outline'"
      :aria-pressed="locale === l"
      @click="setLang(l)"
    >
      {{ l.toUpperCase() }}
    </UButton>
  </UFieldGroup>
</template>

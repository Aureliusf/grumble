<script setup lang="ts">
// Shown where meals are read in the person's words (Today, Intake) when the server has no ANTHROPIC_API_KEY:
// the word match stands in and misses many meals, so say so instead of failing silently.
const { t } = useI18n()
const ai = ref(true)
onMounted(async () => {
  ai.value = (await apiCall<{ ai: boolean }>('/api/status', () => ({ ai: false }))).ai
})
</script>

<template>
  <UAlert
    v-if="!ai"
    color="warning"
    variant="soft"
    icon="i-lucide-triangle-alert"
    :title="t('app.ai_off.title')"
    :description="t('app.ai_off.body')"
    class="rounded-[var(--radius-grumble)]"
  />
</template>

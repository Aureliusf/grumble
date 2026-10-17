<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center text-center gap-6 pt-6">
    <Grumble :size="220" />
    <h1 class="font-display font-bold text-[34px] text-grumble-500 leading-tight">Grumble</h1>
    <p class="text-[17px] text-crema-800 dark:text-crema-200 max-w-[22rem]">{{ t('splash.line') }}</p>
    <UButton to="/plan" color="primary" trailing-icon="i-lucide-arrow-right">{{ t('splash.start') }}</UButton>
  </div>
</template>

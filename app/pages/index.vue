<script setup lang="ts">
const { t } = useI18n()
// Someone with a plan goes to Today; someone new starts the intake.
const { own } = useFoodGraph()
</script>

<template>
  <div class="flex flex-col items-center text-center gap-6 pt-6">
    <Grumble :size="220" />
    <h1 class="font-display font-bold text-[34px] text-grumble-500 leading-tight">Grumble</h1>
    <p class="text-[17px] text-crema-800 dark:text-crema-200 max-w-[22rem]">{{ t('splash.line') }}</p>
    <div class="flex flex-col gap-2 w-full max-w-[20rem]">
      <UButton :to="own ? '/today' : '/intake'" color="primary" block class="justify-center" trailing-icon="i-lucide-arrow-right">{{ own ? t('nav.today') : t('intake.ui.start') }}</UButton>
      <UButton to="/plan" color="neutral" variant="outline" block class="justify-center">{{ t('splash.start') }}</UButton>
    </div>
  </div>
</template>

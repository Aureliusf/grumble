<script setup lang="ts">
const { t, locale } = useI18n()
const { restore } = useLang()
const isDev = import.meta.dev

onMounted(restore)
useHead({ htmlAttrs: { lang: locale } })

const tabs = computed(() => [
  { to: '/plan', icon: 'i-lucide-clipboard-list', label: t('nav.plan') },
  { to: '/whatif', icon: 'i-lucide-activity', label: t('nav.whatif') },
  { to: '/today', icon: 'i-lucide-sun', label: t('nav.today') },
  { to: '/table', icon: 'i-lucide-utensils', label: t('nav.table') },
])
</script>

<template>
  <div class="min-h-dvh bg-crema-50 dark:bg-crema-950">
    <div class="max-w-[430px] mx-auto min-h-dvh flex flex-col bg-crema-50 dark:bg-crema-950 sm:shadow-xl sm:shadow-cafecito-900/5">
      <header class="sticky top-0 z-30 bg-crema-50/90 dark:bg-crema-950/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div class="flex items-center gap-3 px-4 py-2">
          <NuxtLink to="/" class="shrink-0" aria-label="Grumble">
            <img src="/logo-horizontal.png" alt="Grumble" width="160" height="40" class="h-10 w-auto select-none mix-blend-multiply" draggable="false">
          </NuxtLink>
          <div class="ml-auto">
            <LangPill />
          </div>
        </div>
        <DevStrip v-if="isDev" />
      </header>

      <main class="flex-1 px-4 py-5 pb-32 flex flex-col gap-4">
        <slot />
      </main>

      <nav class="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div class="max-w-[430px] mx-auto pointer-events-auto bg-white/95 dark:bg-crema-900/95 backdrop-blur border-t border-crema-200 dark:border-crema-800 pb-[env(safe-area-inset-bottom)]">
          <ul class="grid grid-cols-4">
            <li v-for="tab in tabs" :key="tab.to">
              <NuxtLink
                :to="tab.to"
                class="flex flex-col items-center gap-0.5 py-2.5 text-[15px] font-display font-medium text-crema-800/60 dark:text-crema-200/60"
                active-class="!text-grumble-500"
              >
                <UIcon :name="tab.icon" class="size-6" />
                <span>{{ tab.label }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </div>
</template>

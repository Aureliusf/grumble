<script setup lang="ts">
const { t, locale } = useI18n()
const { restore, setLang } = useLang()
// The spike bar needs a day to draw; the splash and the intake don't have one yet.
const route = useRoute()
const router = useRouter()
const showSpikes = computed(() => !['/', '/intake'].includes(route.path))

// The date strip and the "fixture" chip are for us, not judges: only with ?debug (kept for the session).
const debug = useState('debug', () => import.meta.dev && route.query.debug !== undefined)

// ?demo puts the app in the state the pitch starts from: Marisol's plan (no saved intake),
// nothing logged today, English. Server state (seats, funding) resets when `npm run dev` restarts.
const { clear: clearGraph } = useFoodGraph()
const eaten = useEaten()
onMounted(async () => {
  if (route.query.demo !== undefined) {
    clearGraph()
    eaten.value = []
    await setLang('en')
    const { demo: _, ...rest } = route.query
    router.replace({ query: rest })
    return
  }
  restore()
})
useHead({ htmlAttrs: { lang: locale } })

// Today first: it's the screen people open every day. Intake last: it's where they go back to refine.
const tabs = computed(() => [
  { to: '/today', icon: 'i-lucide-sun', label: t('nav.today') },
  { to: '/plan', icon: 'i-lucide-clipboard-list', label: t('nav.plan') },
  { to: '/whatif', icon: 'i-lucide-activity', label: t('nav.whatif') },
  { to: '/table', icon: 'i-lucide-utensils', label: t('nav.table') },
  { to: '/intake', icon: 'i-lucide-message-circle', label: t('nav.intake') },
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
        <SpikeBar v-if="showSpikes" />
        <DevStrip v-if="debug" />
      </header>

      <main class="flex-1 px-4 py-5 pb-32 flex flex-col gap-4">
        <slot />
      </main>

      <nav class="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div class="max-w-[430px] mx-auto pointer-events-auto bg-white/95 dark:bg-crema-900/95 backdrop-blur border-t border-crema-200 dark:border-crema-800 pb-[env(safe-area-inset-bottom)]">
          <ul class="grid grid-cols-5">
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

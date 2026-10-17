export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  vite: { optimizeDeps: { include: ['ajv/dist/2020'] } },
  // Aurelio's server/ was written as a standalone Nitro app without noUncheckedIndexedAccess, and Nuxt's typed
  // $fetch routes pull those files into the app's type project too, so the flag is off everywhere.
  typescript: { tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false } } },
  nitro: { typescript: { tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false } } } },
  ssr: false,
  colorMode: { preference: 'light' },
  fonts: {
    families: [
      { name: 'Fredoka', provider: 'google', weights: [500, 600, 700] },
      { name: 'Nunito', provider: 'google', weights: [400, 600, 700] },
    ],
  },
  // Icons come from the local @iconify-json/lucide set, never the Iconify CDN.
  icon: {
    serverBundle: 'local',
    clientBundle: { scan: true },
  },
  i18n: {
    restructureDir: 'app',
    langDir: 'i18n',
    locales: [
      { code: 'en', file: 'en.json', name: 'EN' },
      { code: 'es', file: 'es.json', name: 'ES' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts',
  },
  app: {
    head: {
      title: 'Grumble',
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/grumble.png' }],
    },
  },
})

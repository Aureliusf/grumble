export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
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
      { code: 'es', file: 'es.json', name: 'ES' },
      { code: 'en', file: 'en.json', name: 'EN' },
    ],
    defaultLocale: 'es',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts',
  },
  app: {
    head: {
      title: 'Grumble',
      htmlAttrs: { lang: 'es' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/grumble.png' }],
    },
  },
})

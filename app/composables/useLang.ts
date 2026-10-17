import type { Lang } from '#shared/types'

const KEY = 'grumble.lang'

export function useLang() {
  const { locale, setLocale } = useI18n()
  async function setLang(code: Lang) {
    await setLocale(code)
    try { localStorage.setItem(KEY, code) } catch {}
  }
  function restore() {
    let saved: string | null = null
    try { saved = localStorage.getItem(KEY) } catch {}
    if (saved === 'en' || saved === 'es') setLocale(saved)
  }
  return { locale: computed(() => locale.value as Lang), setLang, restore }
}

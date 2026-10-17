import type { Lang } from '#shared/types'

type Fixture<T> = (lang: Lang) => T

// $fetch with the fixture on error (16 §Errors). The demo never shows an empty screen.
export async function apiCall<T>(
  path: string,
  fixture: Fixture<T>,
  opts: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
): Promise<T> {
  const lang = useNuxtApp().$i18n.locale.value as Lang
  const dev = useDevStrip()
  try {
    const res = await $fetch<T>(path, { method: opts.method ?? 'GET', body: opts.body, query: { lang } }) as T
    // A route that doesn't exist yet comes back as the SPA's HTML with a 200; that's a miss too.
    if (res === null || typeof res !== 'object') throw new Error(`${path}: not JSON`)
    dev.value.fallbacks = dev.value.fallbacks.filter(p => p !== path)
    return res
  }
  catch {
    if (!dev.value.fallbacks.includes(path)) dev.value.fallbacks = [...dev.value.fallbacks, path]
    return structuredClone(toRaw(fixture(lang)))
  }
}

// GET that refetches when the language changes; starts on the fixture so nothing is blank.
export function useApi<T>(path: string, fixture: Fixture<T>) {
  const { locale } = useI18n()
  return useAsyncData(path, () => apiCall(path, fixture), {
    watch: [locale],
    default: () => fixture(locale.value as Lang),
  })
}

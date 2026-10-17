import type { Lang } from '../shared/types'
import en from '../i18n/en.json'
import es from '../i18n/es.json'
import { toMin } from './time'

const DICT = { en, es } as Record<Lang, Record<string, unknown>>

const lookup = (lang: Lang, key: string): string | undefined =>
  key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], DICT[lang]) as string | undefined

// Missing Spanish falls back to English, never to the key's text being invented.
export const t = (lang: Lang, key: string, vars: Record<string, string | number> = {}) =>
  (lookup(lang, key) ?? lookup('en', key) ?? key).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

const EN = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty']
const ES = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const ES_TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta']
const enNum = (n: number) => n < 20 ? EN[n] : EN_TENS[Math.floor(n / 10)] + (n % 10 ? `-${EN[n % 10]}` : '')
const esNum = (n: number) => n < 30 ? (n === 1 ? 'uno' : ES[n]) : ES_TENS[Math.floor(n / 10)] + (n % 10 ? ` y ${n % 10 === 1 ? 'uno' : ES[n % 10]}` : '')

// "21:40" -> "nine forty" / "nueve cuarenta"; "18:30" -> "six thirty" / "seis y media"
export function spellTime(hhmm: string, lang: Lang) {
  const m = toMin(hhmm), h = Math.floor(m / 60) % 12 || 12, min = m % 60
  if (lang === 'es') return ES[h] + (min === 0 ? '' : min === 30 ? ' y media' : min === 15 ? ' y cuarto' : ` ${esNum(min)}`)
  return EN[h] + (min === 0 ? '' : min < 10 ? ` oh ${EN[min]}` : ` ${enNum(min)}`)
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// "21:40" -> "9:40", "20:00" -> "8": a clock time in digits, no am/pm, for lines where the meal makes it obvious
export const shortClock = (hhmm: string) => {
  const m = toMin(hhmm), h = Math.floor(m / 60) % 12 || 12, min = m % 60
  return min ? `${h}:${String(min).padStart(2, '0')}` : String(h)
}

// "21:30" -> "9:30 pm"
export const clockLabel = (hhmm: string) => {
  const m = toMin(hhmm), h = Math.floor(m / 60)
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

// "Vaca frita with rice and black beans" -> "Vaca frita"
export const shortDish = (name: string) => name.split(/ with | and /i)[0]

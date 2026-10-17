// Clock helpers. "HH:MM" strings in and out; minutes since midnight in between.
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

export function fmtTime(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(2025, 0, 1, h, m)
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(d)
}

export function fmtDate(iso: string, locale: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', opts).format(new Date(`${iso}T12:00:00`))
}

export const fmtNumber = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US').format(n)

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

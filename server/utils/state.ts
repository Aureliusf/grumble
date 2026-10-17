import type { Checkin, Fund, Lang, Table } from '../shared/types'
import { addDays, clock, graphs, logs, personas, seeds, type LogDay } from './data'

// In-memory demo state, reset on every boot (16: "Restarting resets the demo. That is a feature.").
interface TableState {
  id: string; date: string; language: Table['language']; seats_total: number; seats_taken: number
  host: Table['host'] | null; host_id?: string; funded_by?: string | Record<Lang, string>; guests: Set<string>
}

const today = clock().today
const OPEN = { name: '—', years_out: 0 }   // the host-less Tuesday, as 16's fixture spells it
const hostFrom = (h: { persona?: string; name?: string; years_out?: number } | null): Table['host'] | null => {
  if (!h) return null
  // A seeded years_out wins over the persona row: the demo ages Tony to 4 years out (16), as 10 ages Dani.
  if (h.persona) return { name: h.persona[0].toUpperCase() + h.persona.slice(1), years_out: h.years_out ?? Math.round(personas[h.persona].profile.years_since_treatment) }
  return { name: h.name!, years_out: h.years_out! }
}

export const tables: TableState[] = seeds.tables.map((s, i) => ({
  id: s.id, date: addDays(today, 7 * i), language: s.language as Table['language'],
  seats_total: s.seats_total, seats_taken: s.seats_taken, host: hostFrom(s.host), funded_by: s.funded_by, guests: new Set(),
}))

// Seeded donors are localized; a name typed into the fund form shows as typed.
export const tableView = (t: TableState, personId: string, lang: Lang = 'es'): Table => ({
  id: t.id, date: t.date, time: '18:30', venue: 'Versailles', host: t.host ?? OPEN, language: t.language,
  seats_total: t.seats_total, seats_left: t.seats_total - t.seats_taken - t.guests.size,
  ...(t.funded_by ? { funded_by: typeof t.funded_by === 'string' ? t.funded_by : t.funded_by[lang] } : {}),
  mine: t.host_id === personId ? 'host' : t.guests.has(personId) ? 'guest' : 'none',
})

// Idempotent: a second tap doesn't take a second seat.
export function seat(t: TableState, personId: string) {
  if (!t.guests.has(personId) && t.host_id !== personId && t.seats_total - t.seats_taken - t.guests.size > 0) t.guests.add(personId)
}

export function host(t: TableState, personId: string, seats: number, language: Table['language']) {
  const p = graphs[personId].person
  Object.assign(t, { host: { name: p.display_name, years_out: Math.round(p.years_since_treatment ?? 0) }, host_id: personId, seats_total: seats, seats_taken: 0, language })
  t.guests.delete(personId)
}

export const ledger = { ...seeds.fund.ledger }
export const fundView = (lang: Lang): Fund => ({
  seat_usd: 20, table_usd: 160, month_usd: 640,
  ledger: { month: new Date(`${today}T12:00:00Z`).toLocaleString(lang, { month: 'long', timeZone: 'UTC' }), ...ledger },
})

export const checkins = new Map<string, Checkin>()
export const skipped = new Map<string, Set<string>>()

// Trailing seven days: the last seven logged days, or six plus today's check-in.
export function weekDays(personId: string): LogDay[] {
  const c = checkins.get(personId)
  const days = (logs[personId] ?? []).filter(d => d.date >= addDays(today, c ? -6 : -7) && d.date < today)
  return c ? [...days, { date: today, checked_in: true, mood_1_to_5: c.mood, energy_1_to_5: c.energy, hunger_1_to_5: c.hunger }] : days
}
export const yesterday = (personId: string) => (logs[personId] ?? []).find(d => d.date === addDays(today, -1))

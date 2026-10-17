import type { Table } from '../shared/types'
import { badRequest, graphOf, langOf } from '../utils/http'
import { host, tableView, tables } from '../utils/state'

// Host a table: takes the host-less Tuesday on that date (or the first host-less one).
export default defineEventHandler(async event => {
  const { person_id, date, seats, language } = await readBody<{ person_id: string; date?: string; seats: number; language: Table['language'] }>(event)
  graphOf(event, person_id)
  if (!(seats >= 4 && seats <= 8) || !['es', 'en', 'both'].includes(language)) throw badRequest('seats 4-8, language es|en|both')
  const t = tables.find(t => !t.host && t.date === date) ?? tables.find(t => !t.host)
  if (!t) throw badRequest('Every Tuesday already has a host')
  host(t, person_id, seats, language)
  return tableView(t, person_id, langOf(event))
})

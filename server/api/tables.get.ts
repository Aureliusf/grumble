import { defineEventHandler, getQuery } from 'h3'
import { tableView, tables } from '../utils/state'

export default defineEventHandler(event => {
  const personId = String(getQuery(event).person_id ?? 'N0771')
  return tables.map(t => tableView(t, personId))
})

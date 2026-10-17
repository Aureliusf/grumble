import { badRequest, langOf } from '../utils/http'
import { fundView, ledger, tables } from '../utils/state'

const ADDS = { seat: { tables: 0, seats: 1 }, table: { tables: 1, seats: 8 }, month: { tables: 4, seats: 32 } }

// Mock payment: updates the ledger; a name goes on the next unfunded table.
export default defineEventHandler(async event => {
  const { kind, name } = (await readBody<{ kind?: unknown; name?: unknown }>(event)) ?? {}
  if (typeof kind !== 'string' || !Object.hasOwn(ADDS, kind)) throw badRequest('kind must be seat|table|month')
  if (name != null && typeof name !== 'string') throw badRequest('name must be a string')
  const donor = typeof name === 'string' ? name.trim() : ''
  ledger.tables_funded += ADDS[kind as keyof typeof ADDS].tables
  ledger.seats += ADDS[kind as keyof typeof ADDS].seats
  const t = donor && tables.find(t => !t.funded_by)
  if (t) t.funded_by = donor
  return fundView(langOf(event))
})

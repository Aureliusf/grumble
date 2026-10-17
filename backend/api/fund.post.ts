import { defineEventHandler, readBody } from 'h3'
import { badRequest, langOf } from '../utils/http'
import { fundView, ledger, tables } from '../utils/state'

const ADDS = { seat: { tables: 0, seats: 1 }, table: { tables: 1, seats: 8 }, month: { tables: 4, seats: 32 } }

// Mock payment: updates the ledger; a name goes on the next unfunded table.
export default defineEventHandler(async event => {
  const { kind, name } = await readBody<{ kind: keyof typeof ADDS; name?: string }>(event)
  if (!ADDS[kind]) throw badRequest('kind must be seat|table|month')
  ledger.tables_funded += ADDS[kind].tables
  ledger.seats += ADDS[kind].seats
  const t = name?.trim() && tables.find(t => !t.funded_by)
  if (t) t.funded_by = name!.trim()
  return fundView(langOf(event))
})

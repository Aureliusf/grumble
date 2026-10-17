import { defineEventHandler, readBody } from 'h3'
import type { ActionResponse } from '../../../shared/types'
import { clock } from '../../../utils/data'
import { badRequest, graphOf, langOf } from '../../../utils/http'
import { today } from '../../../utils/rules'
import { seat, skipped, tables } from '../../../utils/state'

// "seat" puts the person at today's table; "skip" drops this card so the next rule fires.
export default defineEventHandler(async (event): Promise<ActionResponse> => {
  const graph = graphOf(event), id = graph.person.id, lang = langOf(event)
  const { card_id, action_id } = (await readBody<{ card_id?: unknown; action_id?: unknown }>(event)) ?? {}
  const card = today(graph, lang).card
  const tb = tables.find(t => t.date === clock().today && t.host)
  const reseat = card_id === 'p2-table' && action_id === 'seat' && !!tb?.guests.has(id)
  if (!reseat && (card_id !== card.id || !card.actions.some(a => a.id === action_id))) throw badRequest('card_id and action_id must match the card offered today')
  if (action_id === 'seat') {
    if (!tb) throw badRequest('No table today')
    seat(tb, id)
  } else skipped.set(id, (skipped.get(id) ?? new Set()).add(card.id))
  return { ok: true, fed: action_id === 'seat' && tb!.guests.has(id), today: today(graph, lang) }
})

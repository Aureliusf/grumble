import { defineEventHandler, readBody } from 'h3'
import type { ActionResponse } from '../../../shared/types'
import { clock } from '../../../utils/data'
import { badRequest, graphOf, langOf } from '../../../utils/http'
import { today } from '../../../utils/rules'
import { seat, skipped, tables } from '../../../utils/state'

// "seat" puts the person at today's table; "skip" drops this card so the next rule fires.
export default defineEventHandler(async (event): Promise<ActionResponse> => {
  const graph = graphOf(event), id = graph.person.id
  const { card_id, action_id } = await readBody<{ card_id: string; action_id: string }>(event)
  if (action_id === 'seat') {
    const tb = tables.find(t => t.date === clock().today && t.host)
    if (!tb) throw badRequest('No table today')
    seat(tb, id)
  } else if (action_id === 'skip') {
    skipped.set(id, (skipped.get(id) ?? new Set()).add(card_id))
  } else throw badRequest('action_id must be seat or skip')
  return { ok: true, fed: action_id === 'seat', today: today(graph, langOf(event)) }
})

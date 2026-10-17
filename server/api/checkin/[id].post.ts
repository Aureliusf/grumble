import type { Checkin } from '../../shared/types'
import { clock } from '../../utils/data'
import { badRequest, graphOf, langOf } from '../../utils/http'
import { today } from '../../utils/rules'
import { checkins } from '../../utils/state'

const COMPANY = ['alone', 'someone', 'out', 'table', 'unknown']
const scale = (v: unknown) => v === undefined || [1, 2, 3, 4, 5].includes(v as number)

export default defineEventHandler(async event => {
  const graph = graphOf(event), body = await readBody<Checkin>(event)
  if (!COMPANY.includes(body?.company) || !scale(body.energy) || !scale(body.hunger) || !scale(body.mood)) throw badRequest('company must be one of ' + COMPANY.join('|') + '; energy/hunger/mood 1-5')
  checkins.set(graph.person.id, { ...body, date: clock().today })
  return today(graph, langOf(event))
})

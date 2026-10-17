import { defineEventHandler, readBody } from 'h3'
import type { SimulateRequest } from '../shared/types'
import { dishById } from '../utils/data'
import { badRequest, graphOf, langOf, notFound } from '../utils/http'
import { simulate } from '../utils/sim'

export default defineEventHandler(async event => {
  const req = await readBody<SimulateRequest>(event)
  if (!req?.dish_id || typeof req.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(req.time) || ![0, 10, 20, 30].includes(req.walk_min) || typeof req.move !== 'boolean') throw badRequest('Expected dish_id, time "HH:MM", walk_min 0|10|20|30 and boolean move')
  const dish = dishById.get(req.dish_id)
  if (!dish) throw notFound(`Dish ${req.dish_id}`)
  return simulate(req, dish, graphOf(event, req.person_id), langOf(event))
})

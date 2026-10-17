import { createError, getQuery, getRouterParam, type H3Event } from 'h3'
import type { Lang } from '../shared/types'
import { graphs } from './data'

export const langOf = (event: H3Event): Lang => (getQuery(event).lang === 'en' ? 'en' : 'es')

export function graphOf(event: H3Event, id = getRouterParam(event, 'id')) {
  const g = id ? graphs[id] : undefined
  if (!g) throw createError({ statusCode: 404, statusMessage: `No food graph for ${id}` })
  return g
}

export const notFound = (what: string) => createError({ statusCode: 404, statusMessage: `${what} not found` })
export const badRequest = (msg: string) => createError({ statusCode: 400, statusMessage: msg })

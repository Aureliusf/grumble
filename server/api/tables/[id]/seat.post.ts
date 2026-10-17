import { graphOf, langOf, notFound } from '../../../utils/http'
import { seat, tableView, tables } from '../../../utils/state'

export default defineEventHandler(async event => {
  const { person_id } = await readBody<{ person_id: string }>(event)
  graphOf(event, person_id)
  const t = tables.find(t => t.id === getRouterParam(event, 'id'))
  if (!t) throw notFound('Table')
  seat(t, person_id)
  return tableView(t, person_id, langOf(event))
})

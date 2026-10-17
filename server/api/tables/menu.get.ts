import { graphs } from '../../utils/data'
import { tightBudget } from '../../utils/cost'
import { langOf } from '../../utils/http'
import { menu } from '../../utils/menu'

// ?person_id= orders the cost-saving moves first for someone on a tight weekly budget.
export default defineEventHandler(event => {
  const g = graphs[String(getQuery(event).person_id ?? '')]
  return menu(langOf(event), !!g && tightBudget(g))
})

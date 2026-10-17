import { defineEventHandler } from 'h3'
import type { CoachAlert } from '../../shared/types'
import { graphs } from '../../utils/data'
import { weekDays } from '../../utils/state'
import { weekStatus } from '../../utils/status'

// Red week = coach alert. Who to call first, for the coach badge.
export default defineEventHandler((): CoachAlert[] => Object.values(graphs).flatMap(g => {
  const w = weekStatus(g, weekDays(g.person.id))
  return w.coach_alerted ? [{ person_id: g.person.id, display_name: g.person.display_name, coach: g.accountable.coach.name, reasons: w.reasons, night_shift: g.person.schedule.type === 'night shift' }] : []
}))

import type { Week } from '../shared/types'
import type { Graph, LogDay, Standard } from './data'
import { onTime, resolveTarget } from './time'

type Status = 'green' | 'amber' | 'red'

// One function per standard kind (02 §Procedures). null = not evaluated for this day.
function procedure(std: Standard, day: LogDay, graph: Graph): boolean | null {
  if (std.kind === 'last_meal_by') return day.food_logged && day.last_ate ? onTime(day.last_ate, resolveTarget(std, graph.person.schedule), graph.person.schedule) : null
  if (std.kind === 'walk_after_dinner_min') return day.walked_after_dinner_min == null ? null : day.walked_after_dinner_min >= Number(std.value)
  return null
}

const missed = (graph: Graph, id: string, day: LogDay) => {
  const std = graph.standards.items.find(s => s.id === id)
  return std ? procedure(std, day, graph) === false : false
}

// Supported predicates from 02 rule 5. CGM predicates are false: no CGM rows are seeded today.
function hit(pred: string, days: LogDay[], graph: Graph): boolean {
  let m: RegExpMatchArray | null
  if ((m = pred.match(/^(\S+) missed (\d+)\+ days$/))) return days.filter(d => missed(graph, m![1], d)).length >= Number(m[2])
  if ((m = pred.match(/^(\S+) missed$/))) return days.some(d => missed(graph, m![1], d))
  if ((m = pred.match(/^no log (\d+) consecutive days$/))) {
    let run = 0, best = 0
    for (const d of days) { run = d.food_logged === false ? run + 1 : 0; best = Math.max(best, run) }
    return best >= Number(m[1])
  }
  if ((m = pred.match(/^mood <= (\d+) on (\d+) days$/))) return days.filter(d => (d.mood_1_to_5 ?? 6) <= Number(m![1])).length >= Number(m[2])
  if (pred === 'no food logged and no check-in') return days.some(d => d.food_logged === false && !d.checked_in && d.mood_1_to_5 == null && d.energy_1_to_5 == null && d.hunger_1_to_5 == null)
  return false
}

function evaluate(rules: { amber_if?: string[]; red_if?: string[] }, days: LogDay[], graph: Graph): { status: Status; reasons: string[] } {
  const red = (rules.red_if ?? []).filter(p => hit(p, days, graph))
  if (red.length) return { status: 'red', reasons: red }
  const amber = (rules.amber_if ?? []).filter(p => hit(p, days, graph))
  return { status: amber.length ? 'amber' : 'green', reasons: amber }
}

export const dayStatus = (graph: Graph, day: LogDay) => evaluate(graph.thresholds.daily, [day], graph)

// A red week is also the coach alert (DECISIONS: both, always together).
export function weekStatus(graph: Graph, days: LogDay[]): Week {
  const { status, reasons } = evaluate(graph.thresholds.weekly, days, graph)
  return { status, red: status === 'red', reasons, coach_alerted: status === 'red' }
}

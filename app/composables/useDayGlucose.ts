import type { BalancedDay } from '#shared/balance'
import { dayCurve, latenessFor } from '#shared/simulate'

// Today's day as glucose curves (shared/simulate.ts): the balanced day and the same fixed meal with usual
// plates around it. Shared by What if → Whole day and the spike bar under the header.
export function useDayGlucose(personId: string) {
  const { t } = useI18n()
  const { graph, today, usual, person, eaten } = useDay(personId)
  const hasWalk = computed(() => graph.value.standards.items.some(s => s.kind === 'walk_after_dinner_min'))

  // Meal times on the person's own clock: breakfast an hour after waking, lunch five hours later,
  // dinner four hours before sleep. Night shift lands where it should with no special case.
  const frame = computed(() => {
    const wake = toMinutes(person.value.schedule.sleep_end)
    const sleep = toMinutes(person.value.schedule.sleep_start)
    const awake = (sleep - wake + 1440) % 1440 || 1440
    return { from: wake, to: wake + awake + 120, at: { breakfast: wake + 60, lunch: wake + 360, dinner: wake + awake - 240 } }
  })

  const mealsOf = (day: BalancedDay) => day.plates.map(p => ({
    at: frame.value.at[p.slot],
    n: p.n,
    dinner: p.slot === 'dinner',
    late: latenessFor(toHHMM(frame.value.at[p.slot] % 1440), person.value.schedule.sleep_start),
    walk_min: p.slot === 'dinner' && hasWalk.value ? 10 : 0,
    label: t(`day.slots.${p.slot}`),
    slot: p.slot,
    fixed: p.fixed,
  }))

  const curves = computed(() => {
    const g = person.value.blood_sugar_group
    const b = dayCurve(mealsOf(today.value), g, frame.value.from, frame.value.to)
    const u = dayCurve(mealsOf(usual.value), g, frame.value.from, frame.value.to)
    return { b, u, peakB: Math.max(...b.points.map(p => p.mg_dl)), peakU: Math.max(...u.points.map(p => p.mg_dl)) }
  })

  return { today, usual, person, eaten, frame, mealsOf, curves }
}

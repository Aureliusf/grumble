import type { Schedule, Standard } from './data'

export const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
export const fromMin = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// Minutes from `time` until sleep_start. Up to 6 h after sleep_start counts as negative (eating past bedtime).
export const minutesBeforeSleep = (time: string, sleepStart: string) => {
  const m = (((toMin(sleepStart) - toMin(time)) % 1440) + 1440) % 1440
  return m > 1440 - 360 ? m - 1440 : m
}

// Late = after 20:00 or before 04:00 for day sleepers who sleep at 23:00 or later; otherwise less than 3.5 h before sleep.
// The boundary itself is on time, so "dinner by 8" at 8 is not a late dinner.
export function resolveLate(time: string, schedule: Schedule) {
  if (schedule.type !== 'night shift' && toMin(schedule.sleep_start) >= 23 * 60) {
    const t = toMin(time)
    return t > 20 * 60 || t < 4 * 60
  }
  return minutesBeforeSleep(time, schedule.sleep_start) < 210
}

// Tonight's dinner time: the person's own last_meal_by standard (Marisol 20:00), else sleep_start - 4.5 h on the half hour.
export function dinnerTime(g: { person: { schedule: Schedule }; standards: { items: Standard[] } }) {
  const std = g.standards.items.find(s => s.kind === 'last_meal_by')
  return std ? resolveTarget(std, g.person.schedule) : fromMin(Math.round((toMin(g.person.schedule.sleep_start) - 270) / 30) * 30)
}

export function resolveTarget(standard: Standard, schedule: Schedule) {
  const v = String(standard.value)
  return standard.relative_to_sleep ? fromMin(toMin(schedule.sleep_start) - parseFloat(v) * 60) : v
}

export const onTime = (lastAte: string, target: string, schedule: Schedule) =>
  minutesBeforeSleep(lastAte, schedule.sleep_start) >= minutesBeforeSleep(target, schedule.sleep_start)

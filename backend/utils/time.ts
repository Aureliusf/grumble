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

// Late as fitted (>= 20:00 or < 04:00) for day sleepers who sleep at 23:00 or later; otherwise within 3.5 h of sleep.
export function resolveLate(time: string, schedule: Schedule) {
  if (schedule.type !== 'night shift' && toMin(schedule.sleep_start) >= 23 * 60) {
    const t = toMin(time)
    return t >= 20 * 60 || t < 4 * 60
  }
  return minutesBeforeSleep(time, schedule.sleep_start) <= 210
}

// The move's dinner time: sleep_start - 4.5 h, rounded to the half hour (Marisol 23:30 -> 19:00, Jean 09:00 -> 04:30).
export const grumbleTime = (schedule: Schedule) => fromMin(Math.round((toMin(schedule.sleep_start) - 270) / 30) * 30)

export function resolveTarget(standard: Standard, schedule: Schedule) {
  const v = String(standard.value)
  return standard.relative_to_sleep ? fromMin(toMin(schedule.sleep_start) - parseFloat(v) * 60) : v
}

export const onTime = (lastAte: string, target: string, schedule: Schedule) =>
  minutesBeforeSleep(lastAte, schedule.sleep_start) >= minutesBeforeSleep(target, schedule.sleep_start)

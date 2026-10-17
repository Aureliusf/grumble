// 04 §Tests: the simulator hand check, Marisol (prediabetes), vaca frita.
import { describe, expect, it } from 'vitest'
import dishes from '../data/dishes.json'
import { dayCurve, latenessFor, peakDelta } from '../shared/simulate'
import { scale } from '../shared/nutrition'

const vaca = dishes.dishes.find(d => d.id === 'vaca-frita-with-rice-and-black-beans')!
const group = 'prediabetes' as const

describe('simulator hand check (04)', () => {
  it('21:30 no walk vs 19:00 with a 10-min walk: 85.8 vs 38.8 mg/dL', () => {
    const late = peakDelta(vaca, { group, dinner: true, late: latenessFor('21:30', '23:30'), walk_min: 0 })
    const early = peakDelta(vaca, { group, dinner: true, late: latenessFor('19:00', '23:30'), walk_min: 10 })
    expect(late).toBeCloseTo(85.8, 0)
    expect(early).toBeCloseTo(38.8, 0)
  })

  it('one cup of rice (carbs × 0.65) on top: 21.6 mg/dL', () => {
    const oneCup = { ...vaca, carbs_g: vaca.carbs_g * 0.65 }
    expect(peakDelta(oneCup, { group, dinner: true, late: false, walk_min: 10 })).toBeCloseTo(21.6, 0)
  })

  it('walk 20 shows the same as walk 10', () => {
    const at = (w: number) => peakDelta(vaca, { group, dinner: true, late: false, walk_min: w })
    expect(at(20)).toBe(at(10))
    expect(at(30)).toBe(at(10))
  })

  it('night shift: 02:00 is not late for someone who sleeps at 09:00; 06:00 is', () => {
    expect(latenessFor('02:00', '09:00')).toBe(false)
    expect(latenessFor('06:00', '09:00')).toBe(true)
  })

  it('exactly 3.5 h before sleep is on time, so a dinner on the standard is never late', () => {
    expect(latenessFor('20:00', '23:30')).toBe(false)
    expect(latenessFor('20:30', '23:30')).toBe(true)
    expect(latenessFor('05:30', '09:00')).toBe(false)
  })

  it('a day returns to baseline and has positive exposure', () => {
    const day = dayCurve([{ at: 19 * 60, n: scale(vaca, 1), dinner: true, late: false, walk_min: 10, label: 'dinner' }], group)
    expect(day.exposure).toBeGreaterThan(0)
    expect(day.points.at(-1)!.mg_dl).toBeCloseTo(day.baseline, 5)
  })
})

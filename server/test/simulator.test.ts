import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { N_DINNERS, dishById, graphs } from '../utils/data'
import { movesFor } from '../utils/moves'
import { simulate } from '../utils/sim'
import { peakDelta } from '../../shared/simulate'
import { resolveLate } from '../utils/time'
import type { SimulateRequest } from '../shared/types'

const marisol = graphs.N0771, jean = graphs.N1904
const vaca = dishById.get('vaca-frita-with-rice-and-black-beans')!
const plate = { carbs_g: 85.6, fiber_g: 11.7, protein_g: 38.9, fat_g: 25.3, calories: 739 }
const sim = (r: Partial<SimulateRequest>) =>
  simulate({ person_id: 'N0771', dish_id: vaca.id, time: '21:30', walk_min: 0, move: false, ...r }, vaca, marisol, 'en')

describe('04 hand check, Marisol, vaca frita', () => {
  it('regression peak delta: 85.8 late no walk, 38.8 at 19:00 + walk 10, 21.6 with one cup', () => {
    expect(peakDelta(plate, { group: 'prediabetes', dinner: true, late: true, walk_min: 0 })).toBeCloseTo(85.8, 0)
    expect(peakDelta(plate, { group: 'prediabetes', dinner: true, late: false, walk_min: 10 })).toBeCloseTo(38.8, 0)
    expect(peakDelta({ ...plate, carbs_g: plate.carbs_g * 0.65 }, { group: 'prediabetes', dinner: true, late: false, walk_min: 10 })).toBeCloseTo(21.6, 0)
  })

  it('moves for vaca frita are one cup + beans first', () => {
    expect(movesFor(vaca).ids).toEqual(['one-cup', 'beans-first'])
  })

  it('drawn curves: 188 vs 135 mg/dL, -80% over two hours; walk alone is -55%', () => {
    const r = sim({})
    expect(Math.abs(r.current.peak_mg_dl - 187.7)).toBeLessThanOrEqual(1)
    expect(Math.abs(r.current.iauc_2h - 5716)).toBeLessThanOrEqual(5)
    expect(Math.abs(r.grumble.peak_mg_dl - 134.5)).toBeLessThanOrEqual(1)
    expect(r.grumble.applied_moves).toEqual(['one-cup', 'beans-first', 'walk10', 'earlier'])
    expect(r.delta.iauc_pct).toBe(-80)
    const walkOnly = sim({ time: '19:00', walk_min: 10 })
    expect(Math.round((walkOnly.current.iauc_2h / r.current.iauc_2h - 1) * 100)).toBe(-55)
  })

  it('n is prediabetes dinners only', () => {
    expect(sim({}).n_dinners).toBe(1585)
  })
})

it('shape gives a positive iAUC and comes back down by the end of the window', () => {
  const c = sim({ time: '19:00', walk_min: 10, move: true }).current
  expect(c.iauc_2h).toBeGreaterThan(0)
  expect(c.points.at(-1)!.mg_dl - 121).toBeLessThan(3)
})

it('walk 20 shows the same numbers as walk 10', () => {
  const ten = sim({ walk_min: 10 }), twenty = sim({ walk_min: 20 })
  expect(twenty.current.points).toEqual(ten.current.points)
  expect(twenty.same_as_ten).toBe(true)
  expect(ten.same_as_ten).toBe(false)
})

it("the move runs at her own standard (dinner by 8), and 8 itself isn't late", () => {
  const r = sim({})
  expect(r.grumble.label.startsWith('8:00 pm')).toBe(true)
  expect(r.grumble.late).toBe(false)
  expect(resolveLate('20:00', marisol.person.schedule)).toBe(false)
  expect(resolveLate('20:30', marisol.person.schedule)).toBe(true)
})

it('Jean (night shift, sleeps 09:00): 02:00 is not late, 06:00 is', () => {
  expect(resolveLate('02:00', jean.person.schedule)).toBe(false)
  expect(resolveLate('06:00', jean.person.schedule)).toBe(true)
})

it('n_dinners matches meal_responses.csv', () => {
  const rows = readFileSync(new URL('../../analysis/meal_responses.csv', import.meta.url), 'utf8').trim().split('\n')
  const head = rows[0].split(','), mt = head.indexOf('meal_type'), g = head.indexOf('blood_sugar_group')
  const n: Record<string, number> = {}
  for (const r of rows.slice(1)) { const c = r.split(','); if (c[mt] === 'dinner') n[c[g]] = (n[c[g]] ?? 0) + 1 }
  expect(n).toEqual({ normal: N_DINNERS.normal, prediabetes: N_DINNERS.prediabetes, 'type 2 diabetes': N_DINNERS['type 2 diabetes'] })
})

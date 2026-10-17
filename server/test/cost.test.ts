import { afterEach, describe, expect, it } from 'vitest'
import componentsFile from '../../data/components.json'
import en from '../i18n/en.json'
import es from '../i18n/es.json'
import { dishById, graphs, logs, type Graph } from '../utils/data'
import { dishCost, perMealUsd } from '../utils/cost'
import { menu, moveText } from '../utils/menu'
import { today } from '../utils/rules'
import { checkins, skipped } from '../utils/state'
import type { Checkin } from '../shared/types'

const tony = graphs.N0170, marisol = graphs.N0771
const withRisks = (g: Graph, money: object, extra: Partial<Graph['risks']> = {}): Graph =>
  ({ ...g, risks: { ...g.risks, money: { ...g.risks.money, ...money }, ...extra } })

afterEach(() => { checkins.clear(); skipped.clear() })

describe('prices', () => {
  it('every priced component cites the ERS source, its food code and the CPI month', () => {
    const src = componentsFile.price_source
    expect(src.url).toBe('https://www.ers.usda.gov/data-products/purchase-to-plate')
    expect(src.adjusted_with.series).toBe('CUUR0000SAF11')
    for (const c of componentsFile.components.filter(c => c.usd_per_100g != null)) {
      expect(c.price.source).toBe('pp-nap-2017-18')
      expect(c.price.month).toBe(src.month)
      expect(c.price.food_code).toBeGreaterThan(10000000)
      expect(c.usd_per_100g).toBeCloseTo(c.price.usd_per_100g_2017_18 * src.adjusted_with.factor, 2)
    }
  })

  it('dish costs are estimates from the portion table', () => {
    expect(dishCost('vaca-frita-with-rice-and-black-beans')).toEqual({ usd: 2.87, basis: 'estimated' })
    expect(dishCost('smothered-pork-chops-with-rice')?.usd).toBe(1.58)
    expect(dishCost('shrimp-and-grits')).toBeUndefined()   // grits have no component price
  })
})

describe('per-meal amount: (weekly budget - meals out x $20) / meals at home', () => {
  it('Marisol $90, 2 out: 50 / 19; Tony $60, 1 out: 40 / 20; Jean has no budget', () => {
    expect(perMealUsd(marisol)).toBe(2.63)
    expect(perMealUsd(tony)).toBe(2)
    expect(perMealUsd(graphs.N1904)).toBeUndefined()
    expect(perMealUsd(withRisks(tony, {}, { convenience: { meals_out_per_week: 0 } }))).toBe(2.86)
  })
})

describe('Tony, $60 a week', () => {
  const perMeal = perMealUsd(tony)!
  const variants: (Checkin | undefined)[] = [undefined, { company: 'alone' }, { company: 'someone' }, { company: 'out' }, { company: 'table' }, { company: 'alone', energy: 1 }, { company: 'unknown', hunger: 2 }]

  it('is never shown a dish over his per-meal amount on any Today card, and every dish carries a cost', () => {
    for (const v of variants) {
      checkins.clear(); skipped.clear()
      if (v) checkins.set('N0170', v)
      for (let i = 0; i < 12; i++) {
        const { card, per_meal_usd } = today(tony, 'en')
        expect(per_meal_usd).toBe(perMeal)
        if (card.dish_id && card.kind !== 'table') {
          expect(card.cost_usd).toBeDefined()
          expect(dishCost(card.dish_id)!.usd).toBeLessThanOrEqual(perMeal)
          expect(card.dish_id).not.toMatch(/salmon/)
        }
        if (card.id === 'p10-default') break
        skipped.set('N0170', (skipped.get('N0170') ?? new Set()).add(card.id))
      }
    }
  })

  it('p8 fires on demo day: budget under $70 and two restaurant meals in the trailing week', () => {
    const { card } = today(tony, 'en')
    expect(card.id).toBe('p8-money')
    expect(card.dish_id).toBe('smothered-pork-chops-with-rice')
    expect(card.cost_usd).toBe(1.58)
    expect(card.body.startsWith('Smothered pork chops, about $2. Beans first.')).toBe(true)
    expect(today(tony, 'es').card.body.startsWith('Smothered pork chops, unos $2. Primero los frijoles.')).toBe(true)
  })

  it('p8 stays quiet at $70 or with fewer than two meals out', () => {
    expect(today(withRisks(tony, { weekly_food_budget_usd: 70 }), 'en').card.id).toBe('p10-default')
    const seeded = logs.N0170
    logs.N0170 = seeded.map(({ meals_out: _, ...d }) => d)
    try { expect(today(tony, 'en').card.id).toBe('p10-default') }
    finally { logs.N0170 = seeded }
  })

  it('cost-saving moves come first when the budget is tight', () => {
    const chops = dishById.get('smothered-pork-chops-with-rice')!
    expect(moveText(chops, 'en', true).startsWith('Add a side of black beans.')).toBe(true)
    expect(moveText(chops, 'en').startsWith('Add a side')).toBe(false)
    expect(menu('en').every(m => m.cost?.basis === 'estimated')).toBe(true)
  })
})

describe('Marisol', () => {
  it('a tight week hears the table plate is covered, about $20; her own week does not', () => {
    expect(today(withRisks(marisol, { weekly_food_budget_usd: 60 }), 'en').card.body).toContain("The plate's covered, about $20.")
    expect(today(marisol, 'en').card.body).not.toContain('$')
  })

  it('with SNAP, going out still gets a home dinner with its cost', () => {
    checkins.set('N0771', { company: 'out' })
    const away = withRisks(marisol, {}, { company: { open_to_table: false } })
    expect(today(away, 'en').card.kind).toBe('place')
    const card = today(withRisks(away, { snap: true }), 'en').card
    expect(card.kind).toBe('dinner')
    expect(card.cost_usd).toBeLessThanOrEqual(perMealUsd(marisol)!)
  })
})

it('new money copy never names the person or the budget', () => {
  const lines = [en.cards['p8-money'].body, en.cards['p2-table'].body_covered, es.cards['p8-money'].body, es.cards['p2-table'].body_covered]
  for (const l of lines) expect(l).not.toMatch(/budget|cheap|afford|poor|income|presupuesto|barat|pobre|ingreso/i)
})

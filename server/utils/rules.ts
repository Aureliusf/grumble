import type { Card, Checkin, Lang, TodayResponse, Week } from '../shared/types'
import { clock, dishById, type Graph, type LogDay } from './data'
import { MENU_IDS, moveText } from './menu'
import { checkins, fundView, skipped, tableView, tables, weekDays, yesterday } from './state'
import { dayStatus, weekStatus } from './status'
import { dinnerTime, resolveTarget } from './time'
import { cap, shortDish, spellTime, t, shortClock } from './copy'
import { cheapestDinner, dishCost, fits, perMealUsd, tightBudget } from './cost'

interface Ctx {
  graph: Graph; lang: Lang; today: string; weekday: string; checkin?: Checkin; week: Week; days: LogDay[]; yesterday?: LogDay; yesterdayLateMissed: boolean
  perMeal?: number; tight: boolean
}
type Rule = { id: string; when: (c: Ctx) => boolean; card: (c: Ctx) => Card }

const lastMealStd = (g: Graph) => g.standards.items.find(s => s.kind === 'last_meal_by')
const actions = (lang: Lang) => [{ id: 'seat', label: t(lang, 'actions.seat') }, { id: 'skip', label: t(lang, 'actions.skip') }]
const moveLine = (dishId: string, c: Ctx) => {
  const d = dishById.get(dishId)
  return d ? moveText(d, c.lang, c.tight) : ''
}
type Item = Graph['dishes']['rotation'][number]
const company = (c: Ctx) => c.checkin?.company ?? 'unknown'

// The home dinner to suggest: `preferred` first, then the starred dinner, other dinners, other starred dishes, the rest
// (breakfasts last). With a weekly budget only dishes estimated at or under the per-meal amount qualify (01 criterion 4);
// if none in the rotation does, the cheapest priced lunch or dinner in dishes.json.
function homeDinner(c: Ctx, preferred: Item[] = []): string {
  const rot = c.graph.dishes.rotation
  const order = [...preferred, ...rot.filter(r => r.star && r.slot === 'dinner'), ...rot.filter(r => r.slot === 'dinner'),
    ...rot.filter(r => r.star && r.slot !== 'breakfast'), ...rot.filter(r => r.slot !== 'breakfast'), ...rot]
  return order.find(r => fits(r.dish_id, c.perMeal))?.dish_id ?? cheapestDinner().id
}

// A dinner card: dish, the move, the person's dinner time, a ten-minute walk, and a person when there is one.
// With a weekly budget the card carries the plate's estimated home cost.
interface DinnerOpts { vars?: Record<string, string>; dishId?: string; evidence?: Card['evidence']; person?: string }
function dinner(c: Ctx, id: string, { vars = {}, dishId = homeDinner(c), evidence = 'rule based', person }: DinnerOpts = {}): Card {
  const time = dinnerTime(c.graph), move = moveLine(dishId, c), name = dishById.get(dishId)?.name ?? dishId
  const cost = c.perMeal == null ? undefined : dishCost(dishId)?.usd
  return {
    id, kind: 'dinner', title: name,
    body: t(c.lang, `cards.${id}.body`, { time: cap(spellTime(time, c.lang)), move, walk: t(c.lang, 'moves.walk10'),
      dish: shortDish(name), cost: cost == null ? '' : Math.max(1, Math.round(cost)), ...vars }),
    dish_id: dishId, move, time, walk_min: 10, ...(person ? { person } : {}), evidence, actions: [], ...(cost == null ? {} : { cost_usd: cost }),
  }
}

const todaysTable = (c: Ctx) => tables.find(tb => tb.date === c.today && tb.host)

// 05 §The one suggestion: ordered, first match wins.
const RULES: Rule[] = [
  { id: 'p1-red', when: c => c.week.red, card: c => {
    const target = dinnerTime(c.graph)
    const coach = c.graph.accountable.coach.name
    return { id: 'p1-red', kind: 'red', title: t(c.lang, 'cards.p1-red.title', { coach }), body: t(c.lang, 'cards.p1-red.body', { target: spellTime(target, c.lang) }),
      time: target, walk_min: 10, person: coach, evidence: 'coach reviewed', actions: [] }
  } },
  { id: 'p2-table', when: c => !!c.graph.risks.company.open_to_table && c.weekday.startsWith(c.graph.accountable.table?.usual_night ?? 'Tue') && !!todaysTable(c), card: c => {
    const tb = todaysTable(c)!, menuDish = dishById.get(MENU_IDS[0])!
    const dish = shortDish(menuDish.name)
    // A tight week hears that the plate is covered (06: the table answers money and company with the same $20).
    return { id: 'p2-table', kind: 'table', title: t(c.lang, 'cards.p2-table.title', { time: spellTime('18:30', c.lang) }),
      body: t(c.lang, `cards.p2-table.${c.tight ? 'body_covered' : 'body'}`, { host: tb.host!.name, dish, dish_lc: dish.toLowerCase(), cost: fundView(c.lang).seat_usd }),
      dish_id: menuDish.id, time: '18:30', walk_min: 10, person: tb.host!.name, evidence: 'observed pattern',
      actions: tableView(tb, c.graph.person.id).mine === 'none' ? actions(c.lang) : [] }
  } },
  { id: 'p3-buddy', when: c => company(c) === 'alone' && !!c.graph.accountable.buddy, card: c => {
    const buddy = c.graph.accountable.buddy!.name
    return dinner(c, 'p3-buddy', { vars: { buddy }, evidence: 'observed pattern', person: buddy })
  } },
  { id: 'p4-dog', when: c => company(c) === 'alone' && !!c.graph.accountable.dog, card: c => {
    const dog = c.graph.accountable.dog!
    return dinner(c, 'p4-dog', { vars: { dog }, evidence: 'observed pattern', person: dog })
  } },
  { id: 'p5-alone', when: c => company(c) === 'alone', card: c => dinner(c, 'p5-alone', { evidence: 'observed pattern' }) },
  // SNAP users get the home dinner ranked above a place: the next rule that fires is a home card with its cost.
  { id: 'p6-place', when: c => company(c) === 'out' && !!c.graph.dishes.places?.length && !c.graph.risks.money?.snap, card: c => {
    const venue = c.graph.dishes.places![0].venue
    // A place has no published plate price, so the card carries no cost.
    const { cost_usd: _, ...card } = dinner(c, 'p6-place', { vars: { venue } })
    return { ...card, kind: 'place', title: venue }
  } },
  { id: 'p7-light', when: c => (c.checkin?.energy ?? 5) <= 2 || (c.checkin?.hunger ?? 5) <= 2, card: c => {
    const light = c.graph.dishes.rotation.filter(r => r.flags?.includes('low_appetite_ok'))
    const meal = light.filter(r => r.slot !== 'breakfast' && dishById.get(r.dish_id)?.typical_meal_type !== 'drink')
    return dinner(c, 'p7-light', { dishId: homeDinner(c, [...meal, ...light]) })
  } },
  // 05 p8: a weekly budget under $70 and two or more restaurant meals logged in the trailing week.
  { id: 'p8-money', when: c => c.tight && c.days.reduce((n, d) => n + (d.meals_out ?? 0), 0) >= 2, card: c => dinner(c, 'p8-money') },
  { id: 'p9-earlier', when: c => c.yesterdayLateMissed, card: c => dinner(c, 'p9-earlier') },
  { id: 'p10-default', when: () => true, card: c => dinner(c, 'p10-default') },
]

export function today(graph: Graph, lang: Lang): TodayResponse {
  const id = graph.person.id, { today, weekday } = clock()
  const y = yesterday(id), lm = lastMealStd(graph)
  const statusY = y ? dayStatus(graph, y) : { status: 'green' as const, reasons: [] }
  const yesterdayLateMissed = !!lm && statusY.reasons.includes(`${lm.id} missed`)
  const days = weekDays(id), perMeal = perMealUsd(graph)
  const ctx: Ctx = { graph, lang, today, weekday, checkin: checkins.get(id), week: weekStatus(graph, days), days, yesterday: y, yesterdayLateMissed, perMeal, tight: tightBudget(graph) }
  const skip = skipped.get(id) ?? new Set()
  const rule = RULES.find(r => !skip.has(r.id) && r.when(ctx))!
  const nudge = yesterdayLateMissed && y?.last_ate
    // Tonight's time is their own last_meal_by standard (the plan says the same), not a fixed offset from sleep.
    ? t(lang, 'nudge', { last: shortClock(y.last_ate), target: shortClock(resolveTarget(lm!, graph.person.schedule)) })
    : null
  return { date: today, weekday, nudge, status_yesterday: statusY.status, card: rule.card(ctx), week: ctx.week, ...(perMeal == null ? {} : { per_meal_usd: perMeal }) }
}

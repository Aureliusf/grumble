import type { Card, Checkin, Lang, TodayResponse, Week } from '../shared/types'
import { clock, dishById, type Graph, type LogDay } from './data'
import { movesFor } from './moves'
import { MENU_IDS } from './menu'
import { checkins, skipped, tableView, tables, weekDays, yesterday } from './state'
import { dayStatus, weekStatus } from './status'
import { grumbleTime, resolveTarget } from './time'
import { cap, shortDish, spellTime, t } from './copy'

interface Ctx { graph: Graph; lang: Lang; today: string; weekday: string; checkin?: Checkin; week: Week; yesterday?: LogDay; yesterdayLateMissed: boolean }
type Rule = { id: string; when: (c: Ctx) => boolean; card: (c: Ctx) => Card }

const lastMealStd = (g: Graph) => g.standards.items.find(s => s.kind === 'last_meal_by')
const actions = (lang: Lang) => [{ id: 'seat', label: t(lang, 'actions.seat') }, { id: 'skip', label: t(lang, 'actions.skip') }]
const moveLine = (dishId: string, lang: Lang) => {
  const d = dishById.get(dishId)
  return d ? t(lang, `moves.${movesFor(d).ids[0] ?? 'as-is'}`, { dish: shortDish(d.name).toLowerCase() }) : ''
}
const pick = (g: Graph, pred: (r: Graph['dishes']['rotation'][number]) => boolean) => g.dishes.rotation.find(pred)
const starredDinner = (g: Graph) => pick(g, r => !!r.star && r.slot === 'dinner') ?? pick(g, r => !!r.star) ?? g.dishes.rotation[0]
const company = (c: Ctx) => c.checkin?.company ?? 'unknown'

// A dinner card: dish, the move, the move's time (sleep_start - 4.5 h), a ten-minute walk, and a person when there is one.
interface DinnerOpts { vars?: Record<string, string>; dishId?: string; evidence?: Card['evidence']; person?: string }
function dinner(c: Ctx, id: string, { vars = {}, dishId = starredDinner(c.graph).dish_id, evidence = 'rule based', person }: DinnerOpts = {}): Card {
  const time = grumbleTime(c.graph.person.schedule), move = moveLine(dishId, c.lang)
  return {
    id, kind: 'dinner', title: dishById.get(dishId)?.name ?? dishId,
    body: t(c.lang, `cards.${id}.body`, { time: cap(spellTime(time, c.lang)), move, walk: t(c.lang, 'moves.walk10'), ...vars }),
    dish_id: dishId, move, time, walk_min: 10, ...(person ? { person } : {}), evidence, actions: [],
  }
}

const todaysTable = (c: Ctx) => tables.find(tb => tb.date === c.today && tb.host)

// 05 §The one suggestion: ordered, first match wins.
const RULES: Rule[] = [
  { id: 'p1-red', when: c => c.week.red, card: c => {
    const std = lastMealStd(c.graph), target = std ? resolveTarget(std, c.graph.person.schedule) : grumbleTime(c.graph.person.schedule)
    const coach = c.graph.accountable.coach.name
    return { id: 'p1-red', kind: 'red', title: t(c.lang, 'cards.p1-red.title', { coach }), body: t(c.lang, 'cards.p1-red.body', { target: spellTime(target, c.lang) }),
      time: target, walk_min: 10, person: coach, evidence: 'coach reviewed', actions: [] }
  } },
  { id: 'p2-table', when: c => !!c.graph.risks.company.open_to_table && c.weekday.startsWith(c.graph.accountable.table?.usual_night ?? 'Tue') && !!todaysTable(c), card: c => {
    const tb = todaysTable(c)!, menuDish = dishById.get(MENU_IDS[0])!
    const dish = shortDish(menuDish.name)
    return { id: 'p2-table', kind: 'table', title: t(c.lang, 'cards.p2-table.title', { time: spellTime('18:30', c.lang) }),
      body: t(c.lang, 'cards.p2-table.body', { host: tb.host!.name, dish, dish_lc: dish.toLowerCase() }),
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
  { id: 'p6-place', when: c => company(c) === 'out' && !!c.graph.dishes.places?.length, card: c => {
    const p = c.graph.dishes.places![0], time = grumbleTime(c.graph.person.schedule)
    return { id: 'p6-place', kind: 'place', title: p.venue, body: t(c.lang, 'cards.p6-place.body', { order: p.order.replace(/\.$/, ''), avoid: p.avoid ?? '' }),
      time, walk_min: 10, evidence: 'rule based', actions: [] }
  } },
  { id: 'p7-light', when: c => (c.checkin?.energy ?? 5) <= 2 || (c.checkin?.hunger ?? 5) <= 2, card: c => {
    const light = pick(c.graph, r => !!r.flags?.includes('low_appetite_ok') && r.slot !== 'breakfast' && dishById.get(r.dish_id)?.typical_meal_type !== 'drink')
      ?? pick(c.graph, r => !!r.flags?.includes('low_appetite_ok')) ?? starredDinner(c.graph)
    return dinner(c, 'p7-light', { dishId: light.dish_id })
  } },
  { id: 'p9-earlier', when: c => c.yesterdayLateMissed, card: c => dinner(c, 'p9-earlier') },
  { id: 'p10-default', when: () => true, card: c => dinner(c, 'p10-default') },
]

export function today(graph: Graph, lang: Lang): TodayResponse {
  const id = graph.person.id, { today, weekday } = clock()
  const y = yesterday(id), lm = lastMealStd(graph)
  const statusY = y ? dayStatus(graph, y) : { status: 'green' as const, reasons: [] }
  const yesterdayLateMissed = !!lm && statusY.reasons.includes(`${lm.id} missed`)
  const ctx: Ctx = { graph, lang, today, weekday, checkin: checkins.get(id), week: weekStatus(graph, weekDays(id)), yesterday: y, yesterdayLateMissed }
  const skip = skipped.get(id) ?? new Set()
  const rule = RULES.find(r => !skip.has(r.id) && r.when(ctx))!
  const nudge = yesterdayLateMissed && y?.last_ate
    ? cap(t(lang, 'nudge', { last: spellTime(y.last_ate, lang), target: spellTime(grumbleTime(graph.person.schedule), lang) }))
    : null
  return { date: today, weekday, nudge, status_yesterday: statusY.status, card: rule.card(ctx), week: ctx.week }
}

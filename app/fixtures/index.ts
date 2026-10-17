// Fixture responses from 16-api-contract.md. The graph and dishes come straight from data/.
import type { Clock, Dish, FoodGraph, Fund, Lang, MenuItem, SimulateResponse, Table, TodayResponse } from '#shared/types'
import graph from '~~/data/example-food-graph.marisol.json'
import dishesFile from '~~/data/dishes.json'
import simulate from './simulate.json'
import todayEn from './today.en.json'
import todayEs from './today.es.json'
import tables from './tables.json'
import menu from './menu.json'
import fund from './fund.json'
import clock from './clock.json'

// funded_by arrives localized from the API; the fixture only has the English.
const fundedByEs: Record<string, string> = { 'the García family': 'la familia García' }

export const fixtures = {
  graph: () => graph as unknown as FoodGraph & typeof graph,
  dishes: () => dishesFile.dishes as Dish[],
  simulate: () => simulate as SimulateResponse,
  today: (lang: Lang) => (lang === 'es' ? todayEs : todayEn) as TodayResponse,
  tables: (lang: Lang) => (tables as Table[]).map(t => ({
    ...t,
    funded_by: t.funded_by && lang === 'es' ? fundedByEs[t.funded_by] ?? t.funded_by : t.funded_by,
  })),
  menu: () => menu as MenuItem[],
  fund: () => fund as Fund,
  clock: () => clock as Clock,
}

import type { Dish, SugarGroup } from '../shared/types'
import dishesFile from '../../data/dishes.json'
import params from '../../data/simulator-params.json'
import personasFile from '../../data/personas.json'
import marisol from '../../data/example-food-graph.marisol.json'
import jean from '../seed/graph.N1904.json'
import logMarisol from '../seed/log.N0771.json'
import logJean from '../seed/log.N1904.json'
import clockSeed from '../seed/clock.json'
import tablesSeed from '../seed/tables.json'
import fundSeed from '../seed/fund.json'
import nDinners from '../seed/n-dinners.json'

export interface Schedule { type: string; sleep_start: string; sleep_end: string }
export interface Standard { id: string; kind: string; statement: string; value?: number | string | boolean; relative_to_sleep?: boolean }
export interface RotationItem { dish_id: string; slot: string; star?: boolean; move?: string; flags?: string[]; cost_usd?: number }
export interface Graph {
  person: { id: string; display_name: string; language: string; blood_sugar_group: SugarGroup; years_since_treatment?: number; has_dog?: boolean; schedule: Schedule }
  risks: { company: { open_to_table?: boolean }; taste?: { loves?: string[] } }
  standards: { items: Standard[] }
  thresholds: { daily: { amber_if?: string[]; red_if?: string[] }; weekly: { amber_if?: string[]; red_if?: string[] } }
  accountable: { coach: { name: string }; buddy?: { name: string } | null; table?: { usual_night?: string }; dog?: string | null }
  dishes: { rotation: RotationItem[]; places?: { venue: string; order: string; avoid?: string }[] }
}
export interface LogDay { date: string; food_logged?: boolean; last_ate?: string; walked_after_dinner_min?: number; mood_1_to_5?: number; energy_1_to_5?: number; hunger_1_to_5?: number }

export const P = params
export const N_DINNERS = nDinners as unknown as Record<SugarGroup, number>
export const dishes = dishesFile.dishes as Dish[]
export const dishById = new Map(dishes.map(d => [d.id, d]))
export const personas = personasFile as unknown as Record<string, { participant_id: string; profile: { years_since_treatment: number } }>
export const graphs: Record<string, Graph> = { N0771: marisol as unknown as Graph, N1904: jean as unknown as Graph }
export const logs: Record<string, LogDay[]> = { N0771: logMarisol.days, N1904: logJean.days }
export const seeds = { clock: clockSeed, tables: tablesSeed, fund: fundSeed }

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const weekday = (date: string) => WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]
export const clock = () => ({ today: seeds.clock.today, weekday: weekday(seeds.clock.today), week: seeds.clock.week })

import type { Fund, Table } from '#shared/types'

// What the fixture fallbacks remember between screens when the API isn't up yet,
// so a seat taken on /today shows on /table. When the routes are real, the server holds this.
export const useDemoState = () => useState('demo', () => ({
  seated: [] as string[],
  hosted: {} as Record<string, Table>,
  fund: null as Fund | null,
  fundedName: null as string | null,
}))

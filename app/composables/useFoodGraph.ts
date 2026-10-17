import type { FoodGraph } from '#shared/types'
import { fixtures } from '~/fixtures'

const KEY = 'grumble.graph'

// The graph intake wrote, if any. It is the only state (CLAUDE.md rule 8); kept across reloads.
export function useFoodGraph() {
  const own = useState<FoodGraph | null>('foodGraph', () => {
    try {
      const s = localStorage.getItem(KEY)
      return s ? JSON.parse(s) as FoodGraph : null
    }
    catch { return null }
  })
  function save(g: FoodGraph) {
    own.value = g
    try { localStorage.setItem(KEY, JSON.stringify(g)) } catch {}
  }
  function clear() {
    own.value = null
    try { localStorage.removeItem(KEY) } catch {}
  }
  return { own, save, clear }
}

// The graph a screen should render: the one from intake, else the demo person's from the API.
export function useGraph(personId: string) {
  const { own } = useFoodGraph()
  const { data } = useApi<FoodGraph>(`/api/graph/${personId}`, fixtures.graph)
  return computed(() => own.value ?? data.value)
}

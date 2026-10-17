import type { SimulateRequest, SimulateResponse } from '#shared/types'
import { fixtures } from '~/fixtures'

const DEFAULTS = { dish_id: 'vaca-frita-with-rice-and-black-beans', time: '21:30', walk_min: 0, move: false }
const WALKS = [0, 10, 20, 30] as const

// What-if state; POST /api/simulate on every change, debounced 150 ms (14 §whatif).
export function useWhatIf(personId: string) {
  const route = useRoute()
  const router = useRouter()
  const q = route.query

  const walk = Number(q.walk)
  const state = reactive({
    dish_id: typeof q.dish === 'string' ? q.dish : DEFAULTS.dish_id,
    time: typeof q.time === 'string' && /^\d{2}:\d{2}$/.test(q.time) ? q.time : DEFAULTS.time,
    walk_min: (WALKS as readonly number[]).includes(walk) ? walk as SimulateRequest['walk_min'] : DEFAULTS.walk_min as SimulateRequest['walk_min'],
    move: q.move === '1',
  })

  const result = ref<SimulateResponse>(fixtures.simulate())
  const loading = ref(false)
  let seq = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  async function run() {
    const mine = ++seq
    loading.value = true
    const body: SimulateRequest = { person_id: personId, ...state }
    const res = await apiCall<SimulateResponse>('/api/simulate', fixtures.simulate, { method: 'POST', body: { ...body } })
    if (mine !== seq) return
    result.value = res
    loading.value = false
  }

  watch(state, () => {
    clearTimeout(timer)
    timer = setTimeout(run, 150)
    router.replace({ query: { dish: state.dish_id, time: state.time, walk: String(state.walk_min), move: state.move ? '1' : '0' } })
  }, { deep: true })

  onMounted(run)
  onBeforeUnmount(() => clearTimeout(timer))

  return { state, result, loading }
}

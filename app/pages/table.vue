<script setup lang="ts">
import type { FoodGraph, Fund, Lang, MenuItem, Table } from '#shared/types'
import { fixtures } from '~/fixtures'

type FundKind = 'seat' | 'table' | 'month'

const PERSON = 'N0771'
const { t, locale } = useI18n()
const toast = useToast()
const grumble = useGrumble()
const demo = useDemoState()

const { data: rawTables, refresh: refreshTables } = useApi<Table[]>('/api/tables', fixtures.tables)
const { data: menu } = useApi<MenuItem[]>('/api/tables/menu', fixtures.menu)
const { data: rawFund } = useApi<Fund>('/api/fund', fixtures.fund)
const { data: graph } = useApi<FoodGraph>(`/api/graph/${PERSON}`, fixtures.graph)

// Fixture mode keeps seats, hosting and funding in useDemoState; with the real API those stay empty.
const tables = computed(() => {
  let named = false
  return rawTables.value.map((tbl) => {
    let x = demo.value.hosted[tbl.id] ?? tbl
    if (demo.value.seated.includes(x.id) && x.mine === 'none')
      x = { ...x, seats_left: Math.max(0, x.seats_left - 1), mine: 'guest' }
    if (!x.funded_by && demo.value.fundedName && !named) {
      named = true
      x = { ...x, funded_by: demo.value.fundedName }
    }
    return x
  })
})
const fund = computed(() => demo.value.fund ?? rawFund.value)

const tab = ref('table')
const tabs = computed(() => [
  { label: t('table.tabs.table'), value: 'table', slot: 'table' as const, icon: 'i-lucide-utensils' },
  { label: t('table.tabs.menu'), value: 'menu', slot: 'menu' as const, icon: 'i-lucide-book-open' },
  { label: t('table.tabs.fund'), value: 'fund', slot: 'fund' as const, icon: 'i-lucide-heart-handshake' },
])

// Mesa
const seating = ref<string | null>(null)
async function seat(tbl: Table) {
  seating.value = tbl.id
  await apiCall<Table>(`/api/tables/${tbl.id}/seat`, () => {
    if (!demo.value.seated.includes(tbl.id)) demo.value.seated.push(tbl.id)
    return { ...tbl, seats_left: tbl.seats_left - 1, mine: 'guest' }
  }, { method: 'POST', body: { person_id: PERSON } })
  await refreshTables()
  seating.value = null
  grumble.value = 'fed'
}

const hostOpen = ref(false)
const hostTable = ref<Table | null>(null)
const hosting = ref(false)
function openHost(tbl: Table) {
  hostTable.value = tbl
  hostOpen.value = true
}
async function host(p: { date: string; seats: number; language: Table['language'] }) {
  const tbl = hostTable.value
  if (!tbl) return
  hosting.value = true
  const person = graph.value.person as FoodGraph['person'] & { years_since_treatment?: number }
  await apiCall<Table>('/api/tables', () => {
    const hosted: Table = {
      ...tbl,
      host: { name: person.display_name, years_out: Math.round(person.years_since_treatment ?? 0) },
      language: p.language,
      seats_total: p.seats,
      seats_left: p.seats,
      mine: 'host',
    }
    demo.value.hosted[tbl.id] = hosted
    return hosted
  }, { method: 'POST', body: { person_id: PERSON, ...p } })
  await refreshTables()
  hosting.value = false
  hostOpen.value = false
  grumble.value = 'fed'
}

// Fondear
const donorName = ref('')
const funding = ref<FundKind | null>(null)
const LEDGER_STEP: Record<FundKind, { tables: number; seats: number }> = {
  seat: { tables: 0, seats: 1 },
  table: { tables: 1, seats: 8 },
  month: { tables: 4, seats: 32 },
}
async function give(kind: FundKind) {
  funding.value = kind
  const name = donorName.value.trim() || undefined
  const res = await apiCall<Fund>('/api/fund', (_lang: Lang) => {
    const cur = fund.value
    const step = LEDGER_STEP[kind]
    const next: Fund = { ...cur, ledger: { ...cur.ledger, tables_funded: cur.ledger.tables_funded + step.tables, seats: cur.ledger.seats + step.seats } }
    demo.value.fund = next
    if (name) demo.value.fundedName = name
    return next
  }, { method: 'POST', body: { kind, name } })
  if (!demo.value.fund) {
    rawFund.value = res
    if (name) await refreshTables()
  }
  funding.value = null
  donorName.value = ''
  toast.add({ title: t('table.fund.thanks'), color: 'primary', icon: 'i-lucide-heart-handshake' })
}

const ledgerMonth = computed(() => {
  const d = new Date(`${fund.value.ledger.month} 1, 2025`)
  return Number.isNaN(d.getTime())
    ? fund.value.ledger.month
    : capitalize(new Intl.DateTimeFormat(locale.value === 'es' ? 'es-US' : 'en-US', { month: 'long' }).format(d))
})
</script>

<template>
  <UTabs v-model="tab" :items="tabs" color="primary" size="lg" class="w-full" :ui="{ list: 'rounded-full', indicator: 'rounded-full', trigger: 'font-display font-semibold' }">
    <template #table>
      <div class="flex flex-col gap-4 pt-2">
        <p class="font-display font-semibold text-[20px] leading-snug">{{ t('table.intro') }}</p>
        <TableCard
          v-for="tbl in tables"
          :key="tbl.id"
          :table="tbl"
          :busy="seating === tbl.id"
          @seat="seat(tbl)"
          @host="openHost(tbl)"
        />
      </div>
    </template>

    <template #menu>
      <div class="flex flex-col gap-3 pt-2">
        <MenuRow v-for="m in menu" :key="m.dish_id" :item="m" />
        <UCard :ui="{ body: 'p-4 sm:p-4' }">
          <p class="font-display font-semibold text-[17px] flex items-center gap-2">
            <UIcon name="i-lucide-cake-slice" class="size-5 text-grumble-500" /> {{ t('table.menu.flan') }}
          </p>
        </UCard>
      </div>
    </template>

    <template #fund>
      <div class="flex flex-col gap-4 pt-2">
        <p class="font-display font-semibold text-[26px] leading-tight">
          {{ t('table.fund.headline', { amount: `$${fund.table_usd}` }) }}
        </p>
        <UInput v-model="donorName" :placeholder="t('table.fund.name')" size="xl" class="w-full" :ui="{ base: 'rounded-full' }" />
        <FundButtons :fund="fund" :busy="funding" @fund="give" />

        <UCard>
          <p class="text-[15px] text-crema-800/70 mb-2">{{ ledgerMonth }}</p>
          <div class="grid grid-cols-3 text-center">
            <div>
              <div class="font-display font-bold text-[34px] text-grumble-500 tabular">{{ fund.ledger.tables_funded }}</div>
              <div class="text-[15px]">{{ t('table.fund.tables') }}</div>
            </div>
            <div>
              <div class="font-display font-bold text-[34px] text-cafecito-500 tabular">{{ fund.ledger.seats }}</div>
              <div class="text-[15px]">{{ t('table.fund.seats') }}</div>
            </div>
            <div>
              <div class="font-display font-bold text-[34px] text-cafecito-700 tabular">{{ fund.ledger.seats_taken }}</div>
              <div class="text-[15px]">{{ t('table.fund.taken') }}</div>
            </div>
          </div>
        </UCard>
        <p class="text-xs text-crema-800/60">{{ t('table.fund.via') }}</p>
      </div>
    </template>
  </UTabs>

  <HostModal v-model:open="hostOpen" :table="hostTable" :busy="hosting" @submit="host" />
</template>

<script setup lang="ts">
import type { Dish, FoodGraph } from '#shared/types'
import { unslug } from '#shared/meals'
import { fixtures } from '~/fixtures'

const PERSON = 'N0771'
const { t } = useI18n()

const graph = useGraph(PERSON)
const { own, clear } = useFoodGraph()
const { plan } = useDay(PERSON)
const { data: dishes } = useApi<Dish[]>(`/api/dishes?person_id=${PERSON}`, fixtures.dishes)
const dishName = (id: string) => dishes.value.find(d => d.id === id)?.name ?? unslug(id)

// The graph carries more than the FoodGraph subset; read the extras defensively.
const person = computed(() => graph.value.person as FoodGraph['person'] & { age?: number })
const risks = computed(() => (graph.value as { risks?: { taste?: { grew_up_on?: string } } }).risks)
const heroLine = computed(() => [risks.value?.taste?.grew_up_on ?? (person.value as { food_background?: string }).food_background, person.value.age].filter(Boolean).join(' · '))

const acc = computed(() => graph.value.accountable as FoodGraph['accountable'] & { buddy?: { walks?: boolean } | null })
</script>

<template>
  <!-- whose plan this is -->
  <div v-if="own" class="flex items-center gap-2 text-[15px] text-crema-800/70">
    <span class="flex-1">{{ t('intake.ui.yours') }}</span>
    <UButton size="sm" color="neutral" variant="outline" @click="clear">{{ t('intake.ui.marisol') }}</UButton>
  </div>

  <!-- hero -->
  <UCard>
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <h1 class="font-display font-bold text-[34px] leading-tight">{{ person.display_name ?? t('plan.you') }}</h1>
        <p class="text-[17px] text-crema-800/70 dark:text-crema-200/70">{{ heroLine }}</p>
      </div>
      <Grumble :size="72" />
    </div>
  </UCard>

  <!-- the day, balanced around the meal they love -->
  <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('day.title') }}</h2>
  <DayPlan :day="plan" :fixed-label="t('day.loved')" />

  <!-- a good day -->
  <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('plan.good_day') }}</h2>
  <StandardCard v-for="s in graph.standards.items" :key="s.id" :standard="s" />

  <!-- what you eat -->
  <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('plan.what_you_eat') }}</h2>
  <div class="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
    <DishCard v-for="r in graph.dishes.rotation" :key="r.dish_id" :item="r" :name="dishName(r.dish_id)" />
  </div>

  <!-- where you eat -->
  <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('plan.where_you_eat') }}</h2>
  <PlaceRow v-for="p in graph.dishes.places" :key="p.venue" :place="p" :skip-label="t('plan.skip')" />

  <!-- who shows up -->
  <h2 class="font-display font-semibold text-[26px] mt-2">{{ t('plan.who_shows_up') }}</h2>
  <div class="flex flex-wrap gap-2">
    <UBadge size="xl" color="primary" variant="soft" icon="i-lucide-phone" class="rounded-full">
      {{ acc.coach.name }} · {{ t('plan.coach') }}
    </UBadge>
    <UBadge v-if="acc.buddy" size="xl" color="secondary" variant="soft" icon="i-lucide-footprints" class="rounded-full">
      {{ [acc.buddy.name, [acc.buddy.relationship, acc.buddy.walks ? t('plan.walks') : ''].filter(Boolean).join(', ')].filter(Boolean).join(' · ') }}
    </UBadge>
    <UBadge v-if="acc.table.role !== 'none'" size="xl" color="primary" variant="soft" icon="i-lucide-utensils" class="rounded-full">
      {{ t('plan.table') }} · {{ t(`plan.nights.${acc.table.usual_night}`) }}
    </UBadge>
  </div>
</template>

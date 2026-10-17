<script setup lang="ts">
import type { GrumbleState } from '~/composables/useGrumble'

const props = withDefaults(defineProps<{ state?: GrumbleState; size?: number }>(), { state: 'grumbling', size: 48 })
const { t } = useI18n()
// Base art is 460×560; states are CSS for today (14 §Layout). Real art is Phase 2.
const height = computed(() => Math.round(props.size * 560 / 460))
</script>

<template>
  <img
    src="/grumble.png"
    :alt="t('character.alt')"
    :width="size"
    :height="height"
    draggable="false"
    class="grumble select-none mix-blend-multiply"
    :class="`grumble--${state}`"
  >
</template>

<style scoped>
.grumble { transition: transform 300ms ease, filter 300ms ease; }
.grumble--fed { transform: rotate(5deg); filter: brightness(1.05); }
.grumble--listening { transform: rotate(-6deg); }
@media (prefers-reduced-motion: reduce) { .grumble { transition: none; } }
</style>

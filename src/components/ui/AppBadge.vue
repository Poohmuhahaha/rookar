<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'info'

const props = withDefaults(
  defineProps<{
    tone?: Tone
  }>(),
  { tone: 'neutral' },
)

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-800 text-white',
  brand: 'bg-black text-white',
  success: 'bg-neutral-900 text-white',
  warning: 'bg-amber-700 text-white',
  danger: 'bg-rose-700 text-white',
  accent: 'bg-orange-700 text-white',
  info: 'bg-blue-700 text-white',
}

const classes = computed(() =>
  cn(
    'inline-flex h-[22px] w-28 items-center justify-center rounded-full px-2.5 text-center text-[11px] font-semibold',
    tones[props.tone],
  ),
)
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

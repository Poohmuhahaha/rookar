<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'info'

const props = withDefaults(
  defineProps<{
    tone?: Tone
    dot?: boolean
    size?: 'sm' | 'md'
  }>(),
  { tone: 'neutral', dot: false, size: 'sm' },
)

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-800 text-white font-semibold',
  brand: 'bg-black text-white font-semibold',
  success: 'bg-neutral-900 text-white font-semibold',
  warning: 'bg-amber-700 text-white font-semibold',
  danger: 'bg-rose-700 text-white font-semibold',
  accent: 'bg-orange-700 text-white font-semibold',
  info: 'bg-blue-700 text-white font-semibold',
}

const dotTones: Record<Tone, string> = {
  neutral: 'bg-neutral-300',
  brand: 'bg-white',
  success: 'bg-white',
  warning: 'bg-amber-300',
  danger: 'bg-rose-300',
  accent: 'bg-orange-300',
  info: 'bg-blue-300',
}

const classes = computed(() =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium',
    tones[props.tone],
    props.size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]',
  ),
)
</script>

<template>
  <span :class="classes">
    <span
      v-if="dot"
      :class="cn('h-1.5 w-1.5 rounded-full', dotTones[tone])"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>

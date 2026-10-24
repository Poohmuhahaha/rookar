<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from '@lucide/vue'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    loading?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    block: false,
    type: 'button',
    disabled: false,
  },
)

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:translate-y-px'

const variants: Record<Variant, string> = {
  primary: 'bg-black text-white hover:bg-neutral-800 focus-visible:bg-black',
  secondary:
    'bg-[#f4f5f7] text-ink hover:bg-[#eceef1] focus-visible:bg-[#eceef1]',
  ghost: 'text-ink-soft hover:bg-[#f4f5f7] hover:text-ink focus-visible:bg-[#f4f5f7] focus-visible:text-ink',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:bg-red-800',
  accent: 'bg-accent-100 text-accent-900 hover:bg-accent-200 focus-visible:bg-accent-200',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 px-3.5 text-[13px]',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-11 w-11 p-0',
}

const classes = computed(() =>
  cn(base, variants[props.variant], sizes[props.size], props.block && 'w-full'),
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
    <slot v-else name="left" />
    <slot />
    <slot name="right" />
  </button>
</template>

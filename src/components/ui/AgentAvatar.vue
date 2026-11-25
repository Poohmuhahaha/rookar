<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string | null
    color?: string
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { name: 'AI', color: '#18181b', size: 'sm' },
)

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'h-6 w-6'
  if (props.size === 'md') return 'h-9 w-9'
  return 'h-7 w-7'
})

const iconClass = computed(() => {
  if (props.size === 'xs') return 'h-[17px] w-[17px]'
  if (props.size === 'md') return 'h-[25px] w-[25px]'
  return 'h-[20px] w-[20px]'
})

function shade(hex: string, amount: number) {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const value = Number.parseInt(normalized, 16)
  const r = Math.max(0, Math.min(255, ((value >> 16) & 255) - amount))
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) - amount))
  const b = Math.max(0, Math.min(255, (value & 255) - amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const background = computed(() => {
  const color = props.color || '#18181b'
  return `linear-gradient(145deg, ${color} 0%, ${shade(color, 28)} 100%)`
})
</script>

<template>
  <span
    :class="[
      'flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-white',
      sizeClass,
    ]"
    :style="{ background }"
    :title="name ?? 'AI'"
    :aria-label="name ?? 'AI'"
  >
    <svg
      :class="iconClass"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="translate-y-[3px] text-white/95"
      aria-hidden="true"
    >
      <circle cx="12" cy="7.5" r="4.2" />
      <path d="M3.8 20.5c0-4.4 3.7-7 8.2-7s8.2 2.6 8.2 7v.5H3.8v-.5Z" />
    </svg>
  </span>
</template>

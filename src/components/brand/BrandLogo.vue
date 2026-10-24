<script setup lang="ts">
import LogoMark from './LogoMark.vue'

withDefaults(
  defineProps<{
    variant?: 'dark' | 'light'
    markSize?: number
    compact?: boolean
  }>(),
  { variant: 'dark', markSize: 34, compact: false },
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <LogoMark :size="markSize" class="shrink-0" />
    <div v-if="!compact" class="leading-none">
      <span
        :class="[
          'text-[17px] font-semibold tracking-[0.16em]',
          variant === 'light' ? 'text-white' : 'text-ink',
        ]"
      >
        ROOKAR
      </span>
    </div>
  </div>
</template>

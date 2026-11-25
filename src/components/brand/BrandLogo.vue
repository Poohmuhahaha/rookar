<script setup lang="ts">
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
  <img
    :src="variant === 'light' ? '/brand/rookar-logo-white.png' : '/brand/rookar-logo-dark.png'"
    alt="ROOKAR"
    :style="{ height: `${markSize}px` }"
    class="w-auto shrink-0 select-none"
    draggable="false"
  />
</template>

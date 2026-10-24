<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-7">
    <div class="min-w-0">
      <h1 class="text-[24px] font-semibold tracking-[-0.02em] text-ink">{{ title }}</h1>
      <p v-if="description" class="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu } from '@lucide/vue'
import { mobileNavOpen } from '@/lib/shell'
</script>

<template>
  <button
    type="button"
    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-ink-100"
    aria-label="เปิดเมนู"
    @click="mobileNavOpen = true"
  >
    <Menu class="h-5 w-5" aria-hidden="true" />
  </button>
</template>

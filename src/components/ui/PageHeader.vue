<script setup lang="ts">
import { Link } from '@tanstack/vue-router'
import { ArrowLeft, ChevronRight } from '@lucide/vue'
import InfoTip from './InfoTip.vue'
import MobileNavButton from '@/components/layout/MobileNavButton.vue'

defineProps<{
  title: string
  description?: string
  breadcrumb?: { label: string; to: string }
  back?: boolean
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <header
    class="sticky -top-4 z-20 -mx-4 flex flex-col gap-4 bg-white/95 px-4 py-4 backdrop-blur-md sm:-top-6 sm:-mx-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5 lg:-top-5 lg:-mx-8 lg:px-8 lg:py-5"
  >
    <div class="min-w-0">
      <div class="flex items-center gap-1.5">
        <button
          v-if="back"
          type="button"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-ink-100"
          aria-label="ย้อนกลับ"
          @click="emit('back')"
        >
          <ArrowLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <MobileNavButton v-else class="lg:hidden" />
        <slot name="leading" />
        <h1 class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[24px] font-semibold tracking-[-0.02em] text-ink">
          <template v-if="breadcrumb">
            <Link :to="breadcrumb.to" class="text-muted transition hover:text-ink">{{ breadcrumb.label }}</Link>
            <ChevronRight class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          </template>
          <span>{{ title }}</span>
        </h1>
        <InfoTip v-if="description" :text="description" side="bottom" />
      </div>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

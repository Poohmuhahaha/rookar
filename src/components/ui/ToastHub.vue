<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, X } from '@lucide/vue'
import { toasts, removeToast } from '@/lib/toast'
import { cn } from '@/lib/cn'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-lg bg-surface p-3.5 shadow-float"
          role="status"
        >
          <component
            :is="icons[toast.tone]"
            :class="cn('mt-0.5 h-4.5 w-4.5 shrink-0', tones[toast.tone])"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-medium text-ink">{{ toast.title }}</p>
            <p v-if="toast.description" class="mt-0.5 text-xs leading-relaxed text-muted">
              {{ toast.description }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-ink-50 hover:text-ink"
            aria-label="ปิดการแจ้งเตือน"
            @click="removeToast(toast.id)"
          >
            <X class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

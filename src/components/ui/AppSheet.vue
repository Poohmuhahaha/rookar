<script setup lang="ts">
import { computed } from 'vue'
import { X } from '@lucide/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    side?: 'left' | 'right'
    hideHeader?: boolean
    padded?: boolean
    width?: string
  }>(),
  {
    side: 'right',
    hideHeader: false,
    padded: true,
    width: 'w-[min(380px,92vw)]',
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const sideClass = computed(() => (props.side === 'right' ? 'right-0' : 'left-0'))
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="sheet-overlay fixed inset-0 z-[60] bg-black/50 backdrop-blur-[1px]"
      />
      <DialogContent
        :data-side="side"
        :class="
          cn(
            'sheet-panel fixed inset-y-0 z-[61] flex flex-col bg-surface shadow-float focus:outline-none',
            sideClass,
            width,
          )
        "
      >
        <header v-if="!hideHeader" class="flex items-start justify-between gap-4 p-4 sm:p-5">
          <div class="min-w-0">
            <DialogTitle class="text-[15px] font-semibold text-ink">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-[12px] leading-relaxed text-muted">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose as-child>
            <button
              type="button"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-ink-50 hover:text-ink"
              aria-label="ปิด"
            >
              <X class="h-4 w-4" aria-hidden="true" />
            </button>
          </DialogClose>
        </header>

        <DialogTitle v-else class="sr-only">{{ title }}</DialogTitle>

        <div :class="cn('no-scrollbar min-h-0 flex-1 overflow-y-auto', padded && 'px-4 pb-5 sm:px-5')">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex justify-end gap-2 p-4 sm:p-5">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

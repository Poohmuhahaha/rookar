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
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}
const contentClass = computed(() => sizes[props.size])
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="modal-fade-overlay fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]"
      />
      <div
        class="fixed inset-0 z-[61] flex min-h-full items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none"
      >
        <DialogContent
          :class="
            cn(
              'modal-zoom-in pointer-events-auto relative w-full max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-2xl bg-surface p-5 focus:outline-none sm:p-6',
              contentClass,
            )
          "
        >
          <div class="pr-10">
            <DialogTitle class="text-h3 font-semibold text-ink">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-[13px] leading-relaxed text-muted">
              {{ description }}
            </DialogDescription>
          </div>

          <DialogClose as-child>
            <button
              type="button"
              class="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-ink-50 hover:text-ink focus-visible:bg-ink-50 focus-visible:text-ink focus-visible:outline-none"
              aria-label="ปิด"
            >
              <X class="h-4 w-4" aria-hidden="true" />
            </button>
          </DialogClose>

          <div class="mt-5">
            <slot />
          </div>

          <div v-if="$slots.footer" class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <slot name="footer" />
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>

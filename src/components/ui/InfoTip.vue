<script setup lang="ts">
import { Info } from '@lucide/vue'
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

withDefaults(
  defineProps<{
    text: string
    side?: 'top' | 'right' | 'bottom' | 'left'
  }>(),
  { side: 'top' },
)
</script>

<template>
  <TooltipProvider :delay-duration="120">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-brand-50 hover:text-brand-600 focus-visible:bg-brand-50 focus-visible:text-brand-600 focus-visible:outline-none"
          aria-label="ข้อมูลเพิ่มเติม"
        >
          <Info class="info-tip-icon h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side"
          :side-offset="7"
          class="info-tip-content z-[70] max-w-[260px] rounded-lg border border-ink-100 bg-white px-3 py-2 text-xs leading-relaxed text-ink shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {{ text }}
          <TooltipArrow class="fill-white" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

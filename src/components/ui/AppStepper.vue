<script setup lang="ts">
import { Check } from '@lucide/vue'
import { cn } from '@/lib/cn'

withDefaults(
  defineProps<{
    current: number
    steps: { label: string; hint?: string }[]
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <nav :aria-label="`ขั้นตอนที่ ${current + 1} จาก ${steps.length}`">
    <ol class="flex items-start justify-between gap-1 sm:gap-3">
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        class="relative flex min-w-0 flex-1 flex-col items-center"
      >
        <div
          :class="
            cn(
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
              index < current
                ? 'bg-black text-white'
                : index === current
                  ? 'bg-ink text-white font-bold'
                  : 'bg-neutral-200 text-muted',
            )
          "
          :aria-current="index === current ? 'step' : undefined"
        >
          <Check v-if="index < current" class="h-4 w-4" aria-hidden="true" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="mt-2 min-w-0 text-center">
          <p
            :class="
              cn(
                'truncate text-[11px] font-medium sm:text-xs',
                index <= current ? 'text-ink-soft' : 'text-muted',
              )
            "
          >
            {{ step.label }}
          </p>
          <p v-if="step.hint && !compact" class="mt-0.5 hidden text-[11px] text-faint sm:block">
            {{ step.hint }}
          </p>
        </div>
      </li>
    </ol>
  </nav>
</template>

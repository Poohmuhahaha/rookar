<script setup lang="ts">
import { Check } from '@lucide/vue'
import { cn } from '@/lib/cn'

withDefaults(
  defineProps<{
    current: number
    steps: { label: string; hint?: string }[]
    compact?: boolean
    variant?: 'default' | 'minimal' | 'segmented' | 'connected'
  }>(),
  { compact: false, variant: 'default' },
)
</script>

<template>
  <nav v-if="variant === 'minimal'" :aria-label="`ขั้นตอนที่ ${current + 1} จาก ${steps.length}`">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold text-brand-700">ขั้นที่ {{ current + 1 }} จาก {{ steps.length }}</p>
        <p class="mt-1 truncate text-lg font-bold tracking-tight text-ink">{{ steps[current]?.label }}</p>
        <p v-if="steps[current]?.hint" class="mt-0.5 text-[12px] text-muted">{{ steps[current]?.hint }}</p>
      </div>
      <ol class="flex shrink-0 items-center gap-2">
        <li
          v-for="(step, index) in steps"
          :key="step.label"
          :aria-current="index === current ? 'step' : undefined"
        >
          <span
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                index < current
                  ? 'bg-black text-white'
                  : index === current
                    ? 'bg-black text-white font-bold'
                    : 'bg-ink-100 text-muted',
              )
            "
          >
            <Check v-if="index < current" class="h-4 w-4" aria-hidden="true" />
            <span v-else>{{ index + 1 }}</span>
          </span>
        </li>
      </ol>
    </div>
  </nav>

  <nav v-else-if="variant === 'segmented'" :aria-label="`ขั้นตอนที่ ${current + 1} จาก ${steps.length}`">
    <ol class="grid grid-cols-3 gap-1.5">
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        :aria-current="index === current ? 'step' : undefined"
      >
        <div
          :class="
            cn(
              'flex h-full items-center gap-2 rounded-xl px-2.5 py-2 transition-colors sm:gap-2.5 sm:px-3.5 sm:py-3',
              index < current
                ? 'bg-neutral-900 text-white'
                : index === current
                  ? 'bg-black text-white'
                  : 'bg-white/80 text-muted',
            )
          "
        >
          <span
            :class="
              cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold sm:h-7 sm:w-7 sm:text-[11px]',
                index <= current ? 'bg-white/15 text-white' : 'bg-ink-100 text-muted',
              )
            "
          >
            <Check v-if="index < current" class="h-3.5 w-3.5" aria-hidden="true" />
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="min-w-0">
            <span
              :class="
                cn(
                  'block truncate text-[10.5px] font-semibold sm:text-[12.5px]',
                  index <= current ? 'text-white' : 'text-ink-soft',
                )
              "
            >
              {{ step.label }}
            </span>
            <span
              v-if="step.hint"
              :class="
                cn(
                  'mt-0.5 hidden truncate text-[10.5px] sm:block',
                  index <= current ? 'text-white/60' : 'text-muted',
                )
              "
            >
              {{ step.hint }}
            </span>
          </span>
        </div>
      </li>
    </ol>
  </nav>

  <nav v-else-if="variant === 'connected'" :aria-label="`ขั้นตอนที่ ${current + 1} จาก ${steps.length}`">
    <ol
      class="relative grid"
      :style="{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }"
    >
      <span
        v-for="(step, index) in steps.slice(0, -1)"
        :key="`line-${step.label}`"
        class="pointer-events-none absolute top-6 h-px"
        :class="index < current ? 'bg-neutral-500' : 'bg-neutral-200'"
        :style="{ left: `${((index + 0.5) / steps.length) * 100}%`, width: `${100 / steps.length}%` }"
        aria-hidden="true"
      />
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        :aria-current="index === current ? 'step' : undefined"
        class="relative z-10 flex flex-col items-center rounded-2xl px-1 py-2 text-center transition-colors sm:px-3 sm:py-3"
      >
        <span
          :class="
            cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
              index < current
                ? 'bg-black text-white'
                : index === current
                  ? 'bg-white text-ink outline outline-2 outline-black'
                  : 'bg-white text-muted outline outline-1 outline-neutral-300',
            )
          "
        >
          <Check v-if="index < current" class="h-4 w-4" aria-hidden="true" />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <p
          :class="
            cn(
              'mt-2 text-[11px] font-semibold sm:text-xs',
              index === current ? 'text-ink' : index < current ? 'text-ink-soft' : 'text-muted',
            )
          "
        >
          {{ step.label }}
        </p>
        <p
          v-if="step.hint && !compact"
          :class="
            cn(
              'mt-0.5 hidden text-[10.5px] sm:block',
              index === current ? 'text-muted' : 'text-faint',
            )
          "
        >
          {{ step.hint }}
        </p>
      </li>
    </ol>
  </nav>

  <nav v-else :aria-label="`ขั้นตอนที่ ${current + 1} จาก ${steps.length}`">
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

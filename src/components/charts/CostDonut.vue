<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatCompact, formatCurrency } from '@/lib/format'
import type { CostSlice } from '@/types'

const props = defineProps<{
  slices: CostSlice[]
  total: number
}>()

const animKey = ref(0)
watch(
  () => props.slices,
  () => {
    animKey.value += 1
  },
  { deep: true },
)

const radius = 54
const circumference = 2 * Math.PI * radius
const center = 70

const segments = computed(() => {
  let offset = 0
  return props.slices.map((slice) => {
    const length = (slice.share / 100) * circumference
    const segment = {
      ...slice,
      dashArray: `${Math.max(length - 3, 0)} ${circumference}`,
      dashOffset: -offset,
    }
    offset += length
    return segment
  })
})
</script>

<template>
  <figure class="flex items-center gap-4 sm:gap-5">
    <figcaption class="sr-only">สัดส่วนต้นทุนรวม</figcaption>
    <div class="relative shrink-0">
      <svg
        viewBox="0 0 140 140"
        class="h-[152px] w-[152px] sm:h-[168px] sm:w-[168px] xl:h-[156px] xl:w-[156px] 2xl:h-[184px] 2xl:w-[184px] min-[1800px]:h-[200px] min-[1800px]:w-[200px]"
        aria-hidden="true"
      >
        <circle :cx="center" :cy="center" :r="radius" fill="none" stroke="var(--color-ink-100)" stroke-width="16" />
        <g :key="animKey" class="donut-segments-anim" :transform="`rotate(-90 ${center} ${center})`">
          <circle
            v-for="segment in segments"
            :key="segment.key"
            :cx="center"
            :cy="center"
            :r="radius"
            fill="none"
            :stroke="segment.color"
            stroke-width="16"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            stroke-linecap="round"
            class="donut-segment"
          />
        </g>
        <g class="donut-center-text">
          <text
            :x="center"
            :y="center - 4"
            text-anchor="middle"
            fill="var(--color-muted)"
            font-size="10"
            font-family="Inter, Prompt, sans-serif"
            class="donut-center-label"
          >
            ต้นทุนรวม
          </text>
          <text
            :x="center"
            :y="center + 14"
            text-anchor="middle"
            fill="var(--color-ink)"
            font-size="14"
            font-weight="600"
            font-family="Inter, Prompt, sans-serif"
            class="donut-center-value"
          >
            {{ formatCompact(total) }}
          </text>
        </g>
      </svg>
    </div>

    <ul class="min-w-0 flex-1 space-y-3.5">
      <li v-for="slice in slices" :key="slice.key" class="flex items-start gap-2.5">
        <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-[3px]" :style="{ backgroundColor: slice.color }" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-xs font-medium leading-snug text-ink-soft">{{ slice.label }}</span>
            <span class="tabular shrink-0 text-xs font-semibold text-ink">{{ slice.share }}%</span>
          </div>
          <p class="tabular mt-0.5 text-[11.5px] text-muted">{{ formatCurrency(slice.value) }}</p>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]" aria-hidden="true">
            <div
              class="h-full rounded-full transition-[width] duration-700"
              :style="{ width: `${slice.share}%`, backgroundColor: slice.color }"
            />
          </div>
        </div>
      </li>
    </ul>
  </figure>
</template>

<style scoped>
.donut-segments-anim {
  animation: rotateDonut 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: 70px 70px;
}

.donut-segment {
  animation: drawSegment 1.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes rotateDonut {
  from {
    transform: rotate(-180deg);
  }
  to {
    transform: rotate(-90deg);
  }
}

@keyframes drawSegment {
  from {
    stroke-dashoffset: 340;
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.donut-center-text {
  animation: scaleText 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
  transform-origin: 70px 70px;
}

@keyframes scaleText {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

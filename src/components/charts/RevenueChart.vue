<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { formatCompact, formatCurrency } from '@/lib/format'
import type { KpiPoint } from '@/types'

const props = defineProps<{
  series: KpiPoint[]
}>()

const animKey = ref(0)
watch(
  () => props.series,
  () => {
    animKey.value += 1
  },
  { deep: true },
)

const width = ref(760)
const height = ref(292)
const compact = ref(false)
const pad = computed(() =>
  compact.value
    ? { top: 16, right: 10, bottom: 30, left: 38 }
    : { top: 18, right: 14, bottom: 34, left: 48 },
)
const plotWidth = computed(() => width.value - pad.value.left - pad.value.right)
const plotHeight = computed(() => height.value - pad.value.top - pad.value.bottom)

const rawId = useId()
const gradientId = computed(() => `revenue-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`)
const wrapper = ref<HTMLElement | null>(null)
const activeIndex = ref<number | null>(null)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!wrapper.value) return
  resizeObserver = new ResizeObserver((entries) => {
    const available = entries[0]?.contentRect.width ?? 760
    compact.value = available < 520
    width.value = compact.value ? 400 : 760
    height.value = compact.value ? 252 : 292
  })
  resizeObserver.observe(wrapper.value)
})

onUnmounted(() => resizeObserver?.disconnect())

const maxValue = computed(() => {
  const max = Math.max(...props.series.map((point) => Math.max(point.revenue, point.profit)), 1)
  return Math.ceil((max * 1.14) / 100_000) * 100_000
})

function xFor(index: number) {
  return pad.value.left + (index / Math.max(props.series.length - 1, 1)) * plotWidth.value
}

function yFor(value: number) {
  return pad.value.top + plotHeight.value - (value / maxValue.value) * plotHeight.value
}

function smoothPath(values: number[]) {
  const points = values.map((value, index) => ({ x: xFor(index), y: yFor(value) }))
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`
  let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const after = points[index + 2] ?? next
    const cp1x = current.x + (next.x - previous.x) / 6
    const cp1y = current.y + (next.y - previous.y) / 6
    const cp2x = next.x - (after.x - current.x) / 6
    const cp2y = next.y - (after.y - current.y) / 6
    path += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
  }
  return path
}

const revenueLine = computed(() => smoothPath(props.series.map((point) => point.revenue)))
const profitLine = computed(() => smoothPath(props.series.map((point) => point.profit)))
const areaPath = computed(() => {
  if (!revenueLine.value) return ''
  return `${revenueLine.value} L${xFor(props.series.length - 1)} ${pad.value.top + plotHeight.value} L${xFor(0)} ${pad.value.top + plotHeight.value} Z`
})

const yTicks = computed(() => {
  const count = compact.value ? 3 : 5
  return Array.from({ length: count }, (_, index) => {
    const value = (maxValue.value / (count - 1)) * index
    return { value, y: yFor(value) }
  })
})

const xLabels = computed(() => {
  const step = Math.max(1, Math.ceil(props.series.length / (compact.value ? 4 : 6)))
  const last = props.series.length - 1
  return props.series
    .map((point, index) => ({ ...point, index }))
    .filter((point) => point.index % step === 0 || (point.index === last && last % step !== 0))
})

const activePoint = computed(() => {
  if (activeIndex.value === null) return null
  return props.series[activeIndex.value] ?? null
})

const tooltipStyle = computed(() => {
  if (activeIndex.value === null) return {}
  const percent = (xFor(activeIndex.value) / width.value) * 100
  return { left: `${Math.min(82, Math.max(18, percent))}%` }
})

function updateHover(event: PointerEvent) {
  if (!wrapper.value) return
  const rect = wrapper.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * width.value
  const ratio = Math.min(1, Math.max(0, (x - pad.value.left) / plotWidth.value))
  activeIndex.value = Math.round(ratio * Math.max(props.series.length - 1, 0))
}

function clearHover() {
  activeIndex.value = null
}

function setActive(index: number) {
  activeIndex.value = Math.max(0, Math.min(props.series.length - 1, index))
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.series.length) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    setActive((activeIndex.value ?? -1) + 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    setActive((activeIndex.value ?? props.series.length) - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    setActive(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    setActive(props.series.length - 1)
  }
}

function handleFocus() {
  if (activeIndex.value === null && props.series.length) setActive(0)
}
</script>

<template>
  <div
    ref="wrapper"
    class="relative rounded-lg focus-visible:bg-ink-50/40 focus-visible:outline-none"
    role="group"
    tabindex="0"
    aria-label="กราฟเปรียบเทียบรายได้และกำไร ใช้ลูกศรซ้ายขวาเพื่อดูแต่ละเดือน"
    @pointermove="updateHover"
    @pointerleave="clearHover"
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="clearHover"
  >
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="h-auto w-full touch-pan-y"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="var(--color-brand-400)" stop-opacity=".22" />
          <stop offset="1" stop-color="var(--color-brand-400)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g>
        <line
          v-for="tick in yTicks"
          :key="`grid-${tick.value}`"
          :x1="pad.left"
          :x2="width - pad.right"
          :y1="tick.y"
          :y2="tick.y"
          stroke="var(--color-ink-100)"
          stroke-width="1"
          stroke-dasharray="3 5"
        />
        <text
          v-for="tick in yTicks"
          :key="`label-${tick.value}`"
          :x="pad.left - 7"
          :y="tick.y + 3.5"
          text-anchor="end"
          fill="var(--color-muted)"
          :font-size="compact ? 10 : 11"
          font-family="Inter, Prompt, sans-serif"
        >
          {{ formatCompact(tick.value) }}
        </text>
      </g>

      <!-- Animated Chart Lines and Area -->
      <g :key="animKey" class="chart-animated-group">
        <path :d="areaPath" :fill="`url(#${gradientId})`" class="revenue-area-anim" />
        <path
          :d="revenueLine"
          fill="none"
          stroke="var(--color-brand-400)"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="profitLine"
          fill="none"
          stroke="var(--color-accent-500)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="5 4"
        />
      </g>

      <g>
        <text
          v-for="point in xLabels"
          :key="`x-${point.label}-${point.index}`"
          :x="xFor(point.index)"
          :y="height - 9"
          text-anchor="middle"
          fill="var(--color-muted)"
          :font-size="compact ? 10 : 11"
          font-family="Inter, Prompt, sans-serif"
        >
          {{ point.label }}
        </text>
      </g>

      <g v-if="activeIndex !== null && activePoint">
        <line
          :x1="xFor(activeIndex)"
          :x2="xFor(activeIndex)"
          :y1="pad.top"
          :y2="pad.top + plotHeight"
          stroke="var(--color-muted)"
          stroke-width="1"
          stroke-dasharray="3 4"
        />
        <circle :cx="xFor(activeIndex)" :cy="yFor(activePoint.revenue)" r="5" fill="var(--color-surface)" stroke="var(--color-brand-400)" stroke-width="2.5" />
        <circle :cx="xFor(activeIndex)" :cy="yFor(activePoint.profit)" r="4.5" fill="var(--color-surface)" stroke="var(--color-accent-500)" stroke-width="2.5" />
      </g>
    </svg>

    <div
      v-if="activePoint"
      class="pointer-events-none absolute top-0 z-10 w-[176px] -translate-x-1/2 rounded-lg bg-surface px-3 py-2.5 shadow-float"
      aria-hidden="true"
      :style="tooltipStyle"
    >
      <p class="text-[11px] font-medium text-ink">{{ activePoint.label }}</p>
      <div class="mt-1.5 space-y-1">
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="flex items-center gap-1.5 text-muted">
            <span class="h-1.5 w-1.5 rounded-full bg-brand-400" />
            รายได้
          </span>
          <span class="tabular font-medium text-ink">{{ formatCurrency(activePoint.revenue) }}</span>
        </div>
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="flex items-center gap-1.5 text-muted">
            <span class="h-1.5 w-1.5 rounded-full bg-accent-500" />
            กำไร
          </span>
          <span class="tabular font-medium text-ink">{{ formatCurrency(activePoint.profit) }}</span>
        </div>
      </div>
    </div>
    <table class="sr-only">
      <caption>รายได้และกำไรตามเดือน</caption>
      <thead>
        <tr><th scope="col">เดือน</th><th scope="col">รายได้</th><th scope="col">กำไร</th></tr>
      </thead>
      <tbody>
        <tr v-for="point in series" :key="point.label">
          <th scope="row">{{ point.label }}</th>
          <td>{{ formatCurrency(point.revenue) }}</td>
          <td>{{ formatCurrency(point.profit) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="sr-only" aria-live="polite">
      <template v-if="activePoint">{{ activePoint.label }} รายได้ {{ formatCurrency(activePoint.revenue) }} กำไร {{ formatCurrency(activePoint.profit) }}</template>
    </p>
  </div>
</template>

<style scoped>
.chart-animated-group {
  animation: revealChart 1.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes revealChart {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0% 0 0);
  }
}

.revenue-area-anim {
  animation: fadeInArea 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInArea {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.35;
  }
  100% {
    opacity: 1;
  }
}
</style>

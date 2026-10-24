<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    color?: string
    strokeWidth?: number
  }>(),
  { color: 'var(--color-brand-900)', strokeWidth: 1.8 },
)

const animKey = ref(0)
watch(
  () => props.values,
  () => {
    animKey.value += 1
  },
  { deep: true },
)

const rawId = useId()
const gradientId = computed(() => `spark-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`)

function getSmoothPath(points: { x: number; y: number }[]) {
  if (points.length <= 1) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    // Tangent vectors scaled by 1/6 for smooth Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6

    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return d
}

const geometry = computed(() => {
  const width = 100
  const height = 36
  const padY = 4
  const values = props.values.length ? props.values : [0, 0]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((sum, v) => sum + v, 0) / (values.length || 1)

  // Dampen tiny fluctuations (like margin 26.6% -> 27.1%) so it doesn't zigzag violently
  const minSpan = Math.abs(avg) * 0.14
  const span = Math.max(max - min, minSpan, 1)
  const mid = (max + min) / 2
  const effectiveMin = mid - span / 2

  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width
    const y = height - padY - ((value - effectiveMin) / span) * (height - padY * 2)
    return { x: Math.max(0, Math.min(width, x)), y: Math.max(padY, Math.min(height - padY, y)) }
  })

  const line = getSmoothPath(points)
  const area = `${line} L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`
  return { line, area, last: points[points.length - 1] }
})
</script>

<template>
  <svg
    viewBox="0 0 100 36"
    fill="none"
    preserveAspectRatio="none"
    class="h-9 w-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop :stop-color="color" stop-opacity=".18" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g :key="animKey" class="sparkline-reveal">
      <path :d="geometry.area" :fill="`url(#${gradientId})`" class="sparkline-area" />
      <path
        :d="geometry.line"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        :cx="geometry.last.x - 1"
        :cy="geometry.last.y"
        r="2"
        :fill="color"
        vector-effect="non-scaling-stroke"
        class="sparkline-dot"
      />
    </g>
  </svg>
</template>

<style scoped>
.sparkline-reveal {
  animation: revealSpark 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes revealSpark {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 0);
  }
}

.sparkline-area {
  animation: fadeInSparkArea 1.1s ease-out forwards;
}

@keyframes fadeInSparkArea {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sparkline-dot {
  animation: popInDot 0.4s 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes popInDot {
  from {
    opacity: 0;
    transform: scale(0);
    transform-origin: center;
  }
  to {
    opacity: 1;
    transform: scale(1);
    transform-origin: center;
  }
}
</style>

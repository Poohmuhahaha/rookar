<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Minus } from '@lucide/vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import { useCountUp } from '@/composables/useCountUp'
import { cn } from '@/lib/cn'

type Tone = 'positive' | 'negative' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    change: string
    tone?: Tone
    note?: string
    info?: string
    direction?: 'up' | 'down' | 'flat'
    spark?: number[]
    sparkColor?: string
  }>(),
  {
    tone: 'positive',
    note: 'เทียบช่วงก่อน',
    sparkColor: '#18181b',
    spark: () => [],
  },
)

const displayValue = useCountUp(() => props.value, { duration: 950 })

const toneClass = computed(() => {
  if (props.tone === 'positive') return 'bg-black text-white font-semibold'
  if (props.tone === 'negative') return 'bg-rose-700 text-white font-semibold'
  return 'bg-black text-white font-semibold'
})

const direction = computed(() => {
  if (props.direction) return props.direction
  if (props.tone === 'positive') return 'up'
  if (props.tone === 'negative') return 'down'
  return 'flat'
})

const trendIcon = computed(() => {
  if (direction.value === 'up') return ArrowUpRight
  if (direction.value === 'down') return ArrowDownRight
  return Minus
})
</script>

<template>
  <article class="card-fade group flex h-full flex-col justify-between p-4 sm:p-5">
    <div class="relative z-10">
      <!-- Header row: Label + Trend Pill -->
      <div class="kpi-header flex items-center justify-between gap-2">
        <h3 class="flex items-center gap-1 text-[12.5px] font-medium text-ink-soft">
          {{ label }}
          <InfoTip v-if="info" :text="info" />
        </h3>
        <span :class="cn('kpi-trend inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight', toneClass)">
          <component :is="trendIcon" class="h-3 w-3" aria-hidden="true" />
          {{ change }}
        </span>
      </div>

      <!-- Value row: Metric + Subtitle with smooth CountUp Animation -->
      <div class="kpi-value-row mt-2.5 flex items-baseline justify-between gap-2">
        <p class="tabular text-[25px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[27px]">
          {{ displayValue }}
        </p>
        <p class="kpi-note truncate text-[11px] font-medium text-muted">{{ note }}</p>
      </div>
    </div>

    <!-- Full-width smooth bezier sparkline spanning across card base -->
    <div v-if="spark.length > 1" class="relative -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 mt-3.5 overflow-hidden rounded-b-[24px]">
      <Sparkline :values="spark" :color="sparkColor" class="h-9 w-full" />
    </div>
  </article>
</template>

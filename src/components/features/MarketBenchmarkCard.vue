<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
  Building2,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from '@lucide/vue'
import type { MacroIndicatorKey, SectorBenchmark } from '@/types'
import InfoTip from '@/components/ui/InfoTip.vue'
import { formatDateThai, formatDelta, formatPercent } from '@/lib/format'
import { toThaiYear } from '@/lib/macroApi'

const props = defineProps<{
  benchmark?: SectorBenchmark
  loading?: boolean
  refreshing?: boolean
  error?: boolean
  showBusinessActions?: boolean
}>()

const emit = defineEmits<{
  'open-scenario': []
  retry: []
}>()

const router = useRouter()

const indicatorOrder: MacroIndicatorKey[] = [
  'gdpGrowth',
  'householdConsumptionGrowth',
  'cpiInflation',
  'unemploymentRate',
]

const indicatorMeta: Record<MacroIndicatorKey, { label: string; note: string }> = {
  gdpGrowth: {
    label: 'GDP ประเทศไทย',
    note: 'การเติบโตทางเศรษฐกิจ',
  },
  householdConsumptionGrowth: {
    label: 'การบริโภคภาคครัวเรือน',
    note: 'กำลังซื้อในประเทศ',
  },
  cpiInflation: {
    label: 'เงินเฟ้อ CPI',
    note: 'ต้นทุนค่าครองชีพ',
  },
  unemploymentRate: {
    label: 'อัตราการว่างงาน',
    note: 'ตลาดแรงงาน',
  },
}

function formatIndicator(key: MacroIndicatorKey, value: number): string {
  return key === 'unemploymentRate' ? formatPercent(value) : formatDelta(value)
}

const cards = computed(() => {
  if (!props.benchmark) return []
  return indicatorOrder.map((key) => {
    const indicator = props.benchmark!.indicators[key]
    return {
      key,
      ...indicatorMeta[key],
      display: formatIndicator(key, indicator.value),
      yearLabel: `ปี ${toThaiYear(indicator.year)}`,
    }
  })
})

const latestYearLabel = computed(() => {
  const year = props.benchmark?.indicators.gdpGrowth.year
  return year ? `ปี ${toThaiYear(year)}` : 'ปีล่าสุด'
})

const assessment = computed(() => {
  const indicators = props.benchmark?.indicators
  if (!indicators) return ''
  const gdp = indicators.gdpGrowth.value
  const consumption = indicators.householdConsumptionGrowth.value
  const gdpWord = gdp >= 0 ? 'ขยายตัว' : 'หดตัว'
  const consumptionWord = consumption >= 0 ? 'ขยายตัว' : 'หดตัว'
  return `${latestYearLabel.value} เศรษฐกิจไทย${gdpWord} ${formatPercent(Math.abs(gdp))} การบริโภคภาคครัวเรือน${consumptionWord} ${formatPercent(Math.abs(consumption))} เงินเฟ้อ ${formatPercent(indicators.cpiInflation.value)} และอัตราการว่างงาน ${formatPercent(indicators.unemploymentRate.value)}`
})

function askAiMarket() {
  router.navigate({
    to: '/app/assistant',
    search: { prompt: 'วิเคราะห์ยอดขายเทียบกับ GDP และตลาด' },
  })
}

function goToImport() {
  router.navigate({ to: '/app/import' })
}
</script>

<template>
  <article
    v-if="loading && !benchmark"
    class="card-fade-static p-6 sm:p-7"
    aria-label="กำลังโหลดข้อมูลเศรษฐกิจมหภาค"
  >
    <div class="flex items-center gap-2.5">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
        <Building2 class="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <h2 class="text-base font-bold text-ink sm:text-lg">บริบทเศรษฐกิจมหภาค (Macro Benchmark)</h2>
        <p class="mt-0.5 text-xs font-medium text-muted">กำลังดึงข้อมูลจริงจาก World Bank…</p>
      </div>
    </div>
    <div class="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <div v-for="index in 4" :key="index" class="skeleton h-[118px] rounded-2xl" />
    </div>
  </article>

  <article v-else-if="error && !benchmark" class="card-fade-static p-6 sm:p-7">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-2.5">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <Database class="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 class="text-base font-bold text-ink sm:text-lg">บริบทเศรษฐกิจมหภาค (Macro Benchmark)</h2>
          <p class="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
            โหลดข้อมูลจาก World Bank ไม่สำเร็จ จึงยังไม่แสดงตัวเลขใด ๆ เพื่อไม่ให้ใช้ข้อมูลที่ไม่ได้มาจากแหล่งจริง
          </p>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
        @click="emit('retry')"
      >
        <RefreshCw class="h-3.5 w-3.5" />
        ลองอีกครั้ง
      </button>
    </div>
  </article>

  <article v-else-if="benchmark" class="card-fade-static p-6 sm:p-7">
    <div class="relative z-10">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
            <Building2 class="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 class="flex items-center gap-1.5 text-base font-bold text-ink sm:text-lg">
              บริบทเศรษฐกิจมหภาค (Macro Benchmark)
              <InfoTip text="ตัวเลขเศรษฐกิจมหภาคของประเทศไทย ดึงสดจาก World Bank Open Data เป็นข้อมูลรายปี ไม่ใช่ข้อมูลธุรกิจของคุณ" />
            </h2>
            <p class="mt-0.5 text-xs font-medium text-muted">
              {{ benchmark.countryName }} · {{ benchmark.periodLabel }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <span
            v-if="benchmark.stale"
            class="inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
          >
            ข้อมูลแคชล่าสุด
          </span>
          <span
            v-else
            class="inline-flex items-center justify-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white"
          >
            ข้อมูลจริงจาก World Bank
          </span>
          <span v-if="refreshing" class="inline-flex items-center gap-1 text-xs text-muted">
            <Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            กำลังอัปเดต
          </span>
          <a
            :href="benchmark.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-neutral-200 hover:text-ink focus-visible:bg-neutral-200 focus-visible:text-ink focus-visible:outline-none"
            :aria-label="`เปิดแหล่งข้อมูล ${benchmark.source}`"
            :title="benchmark.source"
          >
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.key"
          class="flex flex-col justify-between rounded-2xl bg-white/80 p-4 sm:p-5"
        >
          <p class="text-xs font-semibold text-neutral-600 sm:text-[13px]">{{ card.label }}</p>
          <p class="tabular mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {{ card.display }}
          </p>
          <p class="mt-1.5 text-xs font-medium text-muted">
            {{ card.yearLabel }} · {{ card.note }}
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div class="flex items-start gap-3.5">
          <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Sparkles class="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <p class="text-sm font-bold text-ink">ภาพรวมเศรษฐกิจจริง {{ latestYearLabel }}</p>
            <p class="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
              {{ assessment }}
            </p>
            <p class="mt-1.5 text-[11.5px] leading-relaxed text-muted">
              อัปเดตข้อมูลเมื่อ {{ formatDateThai(benchmark.lastUpdated) }} · ยังไม่มีการเปรียบเทียบกับยอดขายร้าน
              ตัวเลขนี้เป็นบริบทมหภาคเท่านั้น
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
          <button
            v-if="showBusinessActions !== false"
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-4 text-xs font-semibold text-ink transition hover:bg-neutral-200"
            @click="goToImport"
          >
            นำเข้าข้อมูลร้าน
          </button>
          <button
            v-if="showBusinessActions !== false"
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
            @click="emit('open-scenario')"
          >
            <SlidersHorizontal class="h-3.5 w-3.5" />
            จำลองเศรษฐกิจ
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-4 text-xs font-semibold text-ink transition hover:bg-neutral-200"
            @click="askAiMarket"
          >
            <Sparkles class="h-3.5 w-3.5" />
            ปรึกษา AI
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

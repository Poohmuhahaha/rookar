<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
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
import { locale } from '@/lib/i18n'
import { formatMacroPeriod } from '@/lib/macroFormat'

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
  'governmentDebt',
  'currentAccountBalance',
]

const indicatorMeta: Record<MacroIndicatorKey, { label: string; note: string; labelEn: string; noteEn: string }> = {
  gdpGrowth: { label: 'GDP ประเทศไทย', note: 'การเติบโตทางเศรษฐกิจ', labelEn: 'Thailand GDP', noteEn: 'Economic growth' },
  householdConsumptionGrowth: { label: 'การบริโภคภาคครัวเรือน', note: 'กำลังซื้อในประเทศ', labelEn: 'Household consumption', noteEn: 'Domestic purchasing power' },
  cpiInflation: { label: 'เงินเฟ้อ CPI', note: 'ต้นทุนค่าครองชีพ', labelEn: 'Inflation (CPI)', noteEn: 'Cost of living' },
  unemploymentRate: { label: 'อัตราการว่างงาน', note: 'ตลาดแรงงาน', labelEn: 'Unemployment rate', noteEn: 'Labor market' },
  governmentDebt: { label: 'หนี้ภาครัฐ', note: 'ต่อ GDP', labelEn: 'Government debt', noteEn: 'of GDP' },
  currentAccountBalance: { label: 'บัญชีเดินสะพัด', note: 'ต่อ GDP', labelEn: 'Current account', noteEn: 'of GDP' },
}

function localizePeriod(value?: string, year?: string) {
  return formatMacroPeriod(value, year, locale.value)
}

function formatIndicator(key: MacroIndicatorKey, value: number): string {
  if (key === 'unemploymentRate' || key === 'governmentDebt') return formatPercent(value)
  return formatDelta(value)
}

const cards = computed(() => {
  if (!props.benchmark) return []
  return indicatorOrder.map((key) => {
    const indicator = props.benchmark!.indicators[key]
    const meta = indicatorMeta[key]
    return {
      key,
      label: locale.value === 'en' ? meta.labelEn : meta.label,
      note: locale.value === 'en' ? meta.noteEn : meta.note,
      display: formatIndicator(key, indicator.value),
      periodLabel: localizePeriod(indicator.periodLabel, indicator.year),
      source: indicator.source ?? props.benchmark!.source,
      projected: Boolean(indicator.projected),
    }
  })
})

const assessment = computed(() => {
  const indicators = props.benchmark?.indicators
  if (!indicators) return ''
  const gdp = indicators.gdpGrowth.value
  const consumption = indicators.householdConsumptionGrowth.value
  if (locale.value === 'en') {
    const gdpWord = gdp >= 0 ? 'expanded' : 'contracted'
    const consumptionWord = consumption >= 0 ? 'expanded' : 'contracted'
    return `Thailand's economy ${gdpWord} ${formatPercent(Math.abs(gdp))}; household consumption ${consumptionWord} ${formatPercent(Math.abs(consumption))}; inflation ${formatPercent(indicators.cpiInflation.value)}; unemployment ${formatPercent(indicators.unemploymentRate.value)}; government debt ${formatPercent(indicators.governmentDebt.value)} of GDP; current account ${formatDelta(indicators.currentAccountBalance.value)} of GDP.`
  }
  const gdpWord = gdp >= 0 ? 'ขยายตัว' : 'หดตัว'
  const consumptionWord = consumption >= 0 ? 'ขยายตัว' : 'หดตัว'
  return `เศรษฐกิจไทย${gdpWord} ${formatPercent(Math.abs(gdp))} การบริโภคภาคครัวเรือน${consumptionWord} ${formatPercent(Math.abs(consumption))} เงินเฟ้อ ${formatPercent(indicators.cpiInflation.value)} อัตราการว่างงาน ${formatPercent(indicators.unemploymentRate.value)} หนี้ภาครัฐ ${formatPercent(indicators.governmentDebt.value)} ของ GDP และบัญชีเดินสะพัด ${formatDelta(indicators.currentAccountBalance.value)} ของ GDP`
})

const updatedLabel = computed(() => {
  const value = props.benchmark?.lastUpdated
  if (!value) return ''
  if (locale.value !== 'en') return formatDateThai(value)
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
})

function goToImport() {
  router.navigate({ to: '/app/import' })
}
</script>

<template>
  <article
    v-if="loading && !benchmark"
    class="card-fade-static mt-5 p-6 sm:p-7"
    aria-label="กำลังโหลดข้อมูลเศรษฐกิจมหภาค"
  >
    <div>
      <h2 class="text-base font-bold text-ink sm:text-lg">บริบทเศรษฐกิจมหภาค (Macro Benchmark)</h2>
      <p class="mt-0.5 text-xs font-medium text-muted">กำลังดึงข้อมูลจริงจาก IMF / World Bank / NSO…</p>
    </div>
    <div class="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 6" :key="index" class="skeleton h-[118px] rounded-2xl" />
    </div>
  </article>

  <article v-else-if="error && !benchmark" class="card-fade-static mt-5 p-6 sm:p-7">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-bold text-ink sm:text-lg">บริบทเศรษฐกิจมหภาค (Macro Benchmark)</h2>
        <p class="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
          โหลดข้อมูลจาก IMF / World Bank / NSO ไม่สำเร็จ จึงยังไม่แสดงตัวเลขใด ๆ เพื่อไม่ให้ใช้ข้อมูลที่ไม่ได้มาจากแหล่งจริง
        </p>
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

  <article v-else-if="benchmark" class="card-fade-static mt-5 p-6 sm:p-7">
    <div class="relative z-10">
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="flex items-center gap-1.5 text-base font-bold text-ink sm:text-lg">
            บริบทเศรษฐกิจมหภาค (Macro Benchmark)
            <InfoTip text="ตัวเลขเศรษฐกิจมหภาคของประเทศไทย ดึงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน เป็นข้อมูลจริงรายปี/รายไตรมาส ไม่ใช่ข้อมูลธุรกิจของคุณ" />
          </h2>
          <p class="mt-0.5 text-xs font-medium text-muted">
            {{ benchmark.countryName }} · {{ benchmark.periodLabel }}
          </p>
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
            ข้อมูลจริงจาก {{ benchmark.source }}
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

      <div class="mt-5 grid gap-3.5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
        <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="card in cards"
            :key="card.key"
            class="flex flex-col justify-between rounded-2xl bg-white/80 p-4 sm:p-5"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-xs font-semibold text-neutral-600 sm:text-[13px]">{{ card.label }}</p>
              <span class="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                {{ card.source }}
              </span>
            </div>
            <p class="tabular mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {{ card.display }}
            </p>
            <p class="mt-1.5 text-xs font-medium text-muted">
              {{ card.periodLabel }} · {{ card.note }}<span v-if="card.projected"> · ประมาณการ</span>
            </p>
          </div>
        </div>

        <div class="flex h-full flex-col justify-center gap-4 rounded-2xl bg-white p-4 sm:p-5">
          <div class="flex items-start gap-3.5">
            <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Sparkles class="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <p class="text-sm font-bold text-ink">{{ locale === 'en' ? 'Macro overview from the latest data' : 'ภาพรวมเศรษฐกิจจริงจากข้อมูลล่าสุด' }}</p>
              <p class="mt-1 text-xs leading-relaxed text-muted sm:text-[13px]">
                {{ assessment }}
              </p>
              <p class="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                {{ locale === 'en' ? 'Data updated' : 'อัปเดตข้อมูลเมื่อ' }} {{ updatedLabel }} · {{ locale === 'en' ? 'no comparison with store sales; figures are macro context only' : 'ยังไม่มีการเปรียบเทียบกับยอดขายร้าน ตัวเลขนี้เป็นบริบทมหภาคเท่านั้น' }}
              </p>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap items-center gap-2">
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
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

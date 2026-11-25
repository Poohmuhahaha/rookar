<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, ChevronDown, CircleAlert, Coffee, Database, FileSpreadsheet, Fuel, HeartPulse, Layers, Loader2, Plus, ShieldCheck, Sparkles, Truck, Upload, Zap } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import CostDonut from '@/components/charts/CostDonut.vue'
import ScenarioBuilderModal from '@/components/features/ScenarioBuilderModal.vue'
import { getDashboard, getSession, listSources } from '@/lib/mockApi'
import { getMacroBenchmark } from '@/lib/macroApi'
import { FOCUS_INDUSTRIES, getIndustryProfile, type IndustryId } from '@/lib/industries'
import { industryFocus, setIndustryFocus } from '@/lib/industryFocus'
import { locale } from '@/lib/i18n'
import { formatMacroPeriod } from '@/lib/macroFormat'
import { formatCurrency, formatDelta, formatNumber, formatPercent, timeAgo } from '@/lib/format'

type Range = '3m' | '6m' | '12m'

const router = useRouter()
const queryClient = useQueryClient()
const session = getSession()
const range = ref<Range>('6m')
const selectedIndustry = ref<IndustryId | 'all'>(industryFocus.value)
const segmentMode = ref<'revenue' | 'cost'>('revenue')
const showScenarioModal = ref(false)

const rangeOptions: { value: Range; label: string }[] = [
  { value: '3m', label: '3 เดือน' },
  { value: '6m', label: '6 เดือน' },
  { value: '12m', label: '12 เดือน' },
]

const allScope = computed(() => selectedIndustry.value === 'all')
const selectedIndustryProfile = computed(() => getIndustryProfile(industryFocus.value))
const scopeShortLabel = computed(() => (allScope.value ? 'ทุกอุตสาหกรรม' : selectedIndustryProfile.value.shortLabel))
const scopeLabel = computed(() => (allScope.value ? 'ทุกอุตสาหกรรม' : selectedIndustryProfile.value.label))
const scopeIcon = computed(() => (allScope.value ? Layers : industryIcons[selectedIndustry.value as IndustryId]))

const industryIcons: Record<IndustryId, Component> = {
  logistics: Truck,
  'energy-fuel': Fuel,
  ev: Zap,
  healthcare: HeartPulse,
  'quantum-security': ShieldCheck,
  fnb: Coffee,
}

const { data, isPending, isFetching } = useQuery({
  queryKey: computed(() => ['dashboard', range.value, selectedIndustry.value, locale.value] as const),
  queryFn: () => getDashboard(range.value, selectedIndustry.value, locale.value),
  placeholderData: (previous) => previous,
})

const { data: sources } = useQuery({
  queryKey: ['sources'],
  queryFn: listSources,
})

const { data: macroBenchmark } = useQuery({
  queryKey: ['macro-benchmark'],
  queryFn: () => getMacroBenchmark(),
  staleTime: 6 * 60 * 60 * 1000,
  retry: 1,
})

const gdpComparison = computed(() => {
  const macro = macroBenchmark.value
  const summary = data.value
  if (!macro || !summary || !summary.hasSales) return null
  const diff = Number((summary.revenueDelta - macro.indicators.gdpGrowth.value).toFixed(1))
  return { diff }
})

const businessName = computed(() => session?.business?.name ?? 'ธุรกิจของคุณ')
const activeSources = computed(() =>
  (sources.value ?? []).filter(
    (source) => allScope.value || source.industryId === selectedIndustry.value,
  ),
)
const totalRows = computed(() => activeSources.value.reduce((sum, source) => sum + source.rowCount, 0))

function selectIndustry(industryId: IndustryId | 'all') {
  if (selectedIndustry.value === industryId) return
  selectedIndustry.value = industryId
  if (industryId !== 'all') setIndustryFocus(industryId)
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  void queryClient.invalidateQueries({ queryKey: ['sources'] })
}

const displayedSegments = computed(() =>
  segmentMode.value === 'revenue'
    ? data.value?.segments ?? []
    : data.value?.costSegments ?? [],
)

const topCost = computed(() => {
  const slices = data.value?.costBreakdown ?? []
  return slices.length ? slices.reduce((top, slice) => (slice.share > top.share ? slice : top)) : null
})
const costToRevenue = computed(() => {
  const summary = data.value
  if (!summary || summary.revenue === 0) return 0
  return Number(((summary.cost / summary.revenue) * 100).toFixed(1))
})
const qualityMeta = {
  complete: { label: 'ครบถ้วน', tone: 'success' as const },
  partial: { label: 'ควรตรวจสอบ', tone: 'warning' as const },
  duplicate: { label: 'มีข้อมูลซ้ำ', tone: 'danger' as const },
}

function openAssistant() {
  router.navigate({ to: '/app/assistant' })
}

function openInsight() {
  if (data.value && (!data.value.hasSales || !data.value.hasCost)) {
    router.navigate({ to: '/app/import' })
    return
  }
  showScenarioModal.value = true
}

</script>

<template>
  <PageHeader :title="`ภาพรวมธุรกิจของ ${businessName}`">
    <template #actions>
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4f5f7] px-4 text-[12px] font-semibold text-ink transition hover:bg-[#eceef1] focus-visible:bg-[#eceef1] focus-visible:outline-none"
          >
            <component :is="scopeIcon" class="h-4 w-4 text-muted" aria-hidden="true" />
            {{ scopeShortLabel }}
            <ChevronDown class="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            :side-offset="8"
            class="z-[70] min-w-[280px] rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] focus:outline-none"
          >
            <DropdownMenuLabel class="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              เลือกอุตสาหกรรม
            </DropdownMenuLabel>
            <DropdownMenuItem
              :class="[
                'flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-100',
                selectedIndustry === 'all' && 'bg-surface',
              ]"
              @select="selectIndustry('all')"
            >
              <Layers class="h-4 w-4 text-muted" aria-hidden="true" />
              <span class="flex-1">รวมทุกอุตสาหกรรม</span>
              <span v-if="selectedIndustry === 'all'" class="text-[10px] font-semibold text-muted">กำลังดู</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              v-for="industry in FOCUS_INDUSTRIES"
              :key="industry.id"
              :class="[
                'flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-100',
                industry.id === selectedIndustry && 'bg-surface',
              ]"
              @select="selectIndustry(industry.id)"
            >
              <component :is="industryIcons[industry.id]" class="h-4 w-4 text-muted" aria-hidden="true" />
              <span class="flex-1">{{ industry.label }}</span>
              <span v-if="industry.id === selectedIndustry" class="text-[10px] font-semibold text-muted">
                กำลังดู
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
      <AppButton variant="secondary" @click="router.navigate({ to: '/app/import' })">
        <template #left>
          <Upload class="h-4 w-4" aria-hidden="true" />
        </template>
        นำเข้าข้อมูล
      </AppButton>
      <AppButton @click="openAssistant">
        <template #left>
          <Sparkles class="h-4 w-4" aria-hidden="true" />
        </template>
        ถาม AI
      </AppButton>
    </template>
  </PageHeader>

  <div
    v-if="data?.industry"
    class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-ink-100/70 bg-white px-4 py-3"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        :style="{ backgroundColor: data.industry.accent, color: '#fff' }"
      >
        <component :is="scopeIcon" class="h-4 w-4" aria-hidden="true" />
      </span>
      <div class="min-w-0">
        <p class="text-[12.5px] font-semibold text-ink">{{ data.industry.label }}</p>
        <p class="mt-0.5 text-[11px] text-muted">
          ข้อมูลจริง {{ data.industry.realSourceCount }} ไฟล์ · ครอบคลุม
          {{ data.industry.coverageMonths }}/{{ data.industry.totalMonths }} เดือน
        </p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span
        v-if="data.industry.confidence > 0"
        class="rounded-full bg-surface px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft"
      >
        ความมั่นใจ {{ data.industry.confidence }}%
      </span>
      <button
        v-if="data.industry.unmatchedSources > 0"
        type="button"
        class="rounded-full bg-warning-soft/80 px-2.5 py-1 text-[10.5px] font-semibold text-warning transition hover:bg-warning-soft"
        @click="router.navigate({ to: '/app/data-sources' })"
      >
        {{ data.industry.unmatchedSources }} ไฟล์ยังไม่ระบุ industry
      </button>
      <button
        type="button"
        class="text-[11.5px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
        @click="router.navigate({ to: '/app/data-sources' })"
      >
        จัดการแหล่งข้อมูล
      </button>
    </div>
  </div>

  <div
    v-if="data && (!data.hasSales || !data.hasCost)"
    class="mb-5 flex flex-col gap-2.5 rounded-[20px] bg-warning-soft/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    role="status"
  >
    <div class="flex items-start gap-2.5">
      <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <div>
        <p class="text-[12px] font-semibold text-warning">ข้อมูลยังไม่ครบสำหรับการวิเคราะห์กำไร</p>
        <p class="mt-0.5 text-[11px] leading-relaxed text-warning/80">
          ยังขาด{{ !data.hasSales ? 'ไฟล์ยอดขาย' : 'ไฟล์ต้นทุน' }} — นำเข้าเพิ่มเพื่อให้ ROOKAR คำนวณกำไรและอัตรากำไรได้ครบถ้วน
        </p>
      </div>
    </div>
    <button
      type="button"
      class="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-ink px-3.5 text-[11px] font-semibold text-white transition hover:bg-black"
      @click="router.navigate({ to: '/app/import' })"
    >
      นำเข้าไฟล์ที่ขาด
    </button>
  </div>

  <div v-if="isPending" aria-label="กำลังโหลดข้อมูล">
    <div class="grid grid-cols-2 gap-5 xl:grid-cols-4">
      <div v-for="index in 4" :key="index" class="skeleton h-[142px] rounded-[24px]" />
    </div>
    <div class="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <div class="skeleton h-[386px] rounded-[24px]" />
      <div class="skeleton h-[386px] rounded-[24px]" />
    </div>
  </div>

  <section v-else-if="!data" class="relative overflow-hidden rounded-lg bg-surface px-5 py-12 text-center shadow-card sm:px-10 sm:py-16">
    <div class="relative mx-auto max-w-md">
      <Database class="mx-auto h-8 w-8 text-brand-400" aria-hidden="true" />
      <h2 class="mt-5 text-h2 font-semibold tracking-tight text-ink">
        เริ่มเห็นภาพรวมของ {{ scopeShortLabel }}
      </h2>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        นำเข้าไฟล์ยอดขายและต้นทุนของ {{ scopeLabel }} เพื่อให้ ROOKAR สรุปภาพรวมและหาโอกาสทางธุรกิจให้คุณทันที
      </p>
      <div class="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <AppButton size="lg" @click="router.navigate({ to: '/app/import' })">
          <template #left>
            <Plus class="h-4 w-4" aria-hidden="true" />
          </template>
          นำเข้าข้อมูลแรก
        </AppButton>
      </div>
    </div>
  </section>

  <template v-else>
    <div class="grid grid-cols-2 gap-5 xl:grid-cols-4">
      <KpiCard
        label="รายได้รวม"
        :value="data.hasSales ? formatCurrency(data.revenue) : '—'"
        :change="data.hasSales ? formatDelta(data.revenueDelta) : '—'"
        :tone="data.hasSales ? (data.revenueDelta >= 0 ? 'positive' : 'negative') : 'neutral'"
        :spark="data.hasSales ? data.revenueSpark : []"
        spark-color="#18181b"
        :info="`รายได้รวมจากทุกช่องทางในช่วง ${data.rangeLabel}`"
      />
      <KpiCard
        label="กำไรสุทธิ"
        :value="data.hasSales && data.hasCost ? formatCurrency(data.profit) : '—'"
        :change="data.hasSales && data.hasCost ? formatDelta(data.profitDelta) : '—'"
        :tone="data.hasSales && data.hasCost ? (data.profitDelta >= 0 ? 'positive' : 'negative') : 'neutral'"
        :spark="data.hasSales && data.hasCost ? data.profitSpark : []"
        spark-color="#ea580c"
        :info="'รายได้หักต้นทุนและค่าใช้จ่ายทั้งหมดแล้ว'"
      />
      <KpiCard
        label="ต้นทุนรวม"
        :value="data.hasCost ? formatCurrency(data.cost) : '—'"
        :change="data.hasCost ? formatDelta(data.costDelta) : '—'"
        :tone="data.hasCost ? (data.costDelta > 0 ? 'negative' : 'positive') : 'neutral'"
        :spark="data.hasCost ? data.costSpark : []"
        spark-color="#18181b"
        :info="'ต้นทุนวัตถุดิบ ค่าแรง และค่าใช้จ่ายดำเนินงาน'"
      />
      <KpiCard
        label="อัตรากำไร"
        :value="data.hasSales && data.hasCost ? formatPercent(data.margin) : '—'"
        :change="data.hasSales && data.hasCost ? `${formatDelta(data.marginDelta)} จุด` : '—'"
        :tone="data.hasSales && data.hasCost ? (data.marginDelta >= 0 ? 'positive' : 'negative') : 'neutral'"
        :spark="data.hasSales && data.hasCost ? data.marginSpark : []"
        spark-color="#18181b"
        info="กำไรสุทธิหารด้วยรายได้รวม คิดเป็นเปอร์เซ็นต์"
      />
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <article class="card-fade-static p-4 sm:p-5">
        <div class="relative z-10">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="flex items-center gap-1 text-[15px] font-semibold text-ink">
                รายได้และกำไร
                <InfoTip text="รายได้คือเงินที่เข้ามาทั้งหมด ส่วนกำไรคือสิ่งที่เหลือหลังหักต้นทุนและค่าใช้จ่าย" />
              </h2>
              <p class="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                {{ data.rangeLabel }}
                <span class="text-ink-200">·</span>
                <span>อัปเดต {{ timeAgo(data.lastUpdated) }}</span>
                <Loader2 v-if="isFetching" class="h-3 w-3 animate-spin text-brand-600" aria-label="กำลังอัปเดต" />
              </p>
            </div>
            <div class="inline-flex w-fit bg-white/80 p-0.5 rounded-full" role="group" aria-label="ช่วงเวลา">
              <button
                v-for="option in rangeOptions"
                :key="option.value"
                type="button"
                :class="[
                  'rounded-full px-3 py-1.5 text-[12px] font-medium transition',
                  range === option.value ? 'bg-ink text-white' : 'text-muted hover:text-ink',
                ]"
                :aria-pressed="range === option.value"
                @click="range = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-4">
            <span class="flex items-center gap-1.5 text-[12px] text-muted">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
              รายได้
            </span>
            <span class="flex items-center gap-1.5 text-[12px] text-muted">
              <span class="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              กำไร
            </span>
          </div>

          <div v-if="!data.hasSales" class="mt-2 flex h-[280px] flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 text-center">
            <Database class="h-6 w-6 text-brand-400" aria-hidden="true" />
            <p class="text-[12px] font-medium text-ink">ยังไม่มีข้อมูลยอดขาย</p>
            <button
              type="button"
              class="text-[11px] font-medium text-brand-700 underline-offset-4 hover:underline"
              @click="router.navigate({ to: '/app/import' })"
            >
              นำเข้าข้อมูลยอดขาย →
            </button>
          </div>
          <div v-else class="mt-2 pt-2">
            <RevenueChart :series="data.series" />
            <p v-if="!data.hasCost" class="mt-2 text-[11px] text-muted">
              ยังไม่มีข้อมูลต้นทุน จึงยังไม่แสดงเส้นกำไร
            </p>
          </div>
        </div>
      </article>

      <article class="card-fade-static h-full p-4 sm:p-5">
        <div class="relative z-10 flex h-full flex-col">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="flex items-center gap-1 text-[15px] font-semibold text-ink">
                โครงสร้างต้นทุน
                <InfoTip text="สัดส่วนต้นทุนแต่ละหมวดจากต้นทุนรวมในช่วงเวลาที่เลือก" />
              </h2>
              <p class="mt-0.5 text-[12px] text-muted">สัดส่วนของต้นทุนรวม</p>
            </div>
            <span
              v-if="data.hasCost"
              :class="[
                'mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold text-white',
                data.costDelta > 0 ? 'bg-rose-700' : 'bg-neutral-900',
              ]"
            >
              {{ formatDelta(data.costDelta) }}
            </span>
          </div>

          <div v-if="!data.hasCost" class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <Database class="h-6 w-6 text-brand-400" aria-hidden="true" />
            <p class="text-[12px] font-medium text-ink">ยังไม่มีข้อมูลต้นทุน</p>
            <button
              type="button"
              class="text-[11px] font-medium text-brand-700 underline-offset-4 hover:underline"
              @click="router.navigate({ to: '/app/import' })"
            >
              นำเข้าข้อมูลต้นทุน →
            </button>
          </div>

          <template v-else>
          <div class="mt-4 flex flex-1 items-center">
            <CostDonut :slices="data.costBreakdown" :total="data.cost" />
          </div>

          <div class="mt-4 rounded-2xl bg-white px-4 py-3.5">
            <div class="flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] text-muted">ต้นทุนรวม</p>
                <p class="tabular mt-0.5 text-[17px] font-semibold leading-none text-ink">{{ formatCurrency(data.cost) }}</p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-[11px] text-muted">ต้นทุนต่อรายได้</p>
                <p class="tabular mt-0.5 text-[13px] font-semibold leading-none text-ink">{{ formatPercent(costToRevenue) }}</p>
              </div>
            </div>
            <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]" aria-hidden="true">
              <div
                class="h-full rounded-full bg-ink transition-[width] duration-700"
                :style="{ width: `${Math.min(costToRevenue, 100)}%` }"
              />
            </div>
            <p class="mt-2 text-[11px] leading-relaxed text-muted">
              <span class="font-medium text-ink-soft">{{ topCost?.label ?? 'หมวดหลัก' }}</span>
              เป็นต้นทุนก้อนใหญ่สุดที่ {{ topCost?.share ?? 0 }}% ·
              ต้นทุนรวม{{ data.costDelta > 0 ? 'เพิ่มขึ้น' : data.costDelta < 0 ? 'ลดลง' : 'ทรงตัว' }}
              <span v-if="data.costDelta !== 0" class="font-medium text-ink-soft">{{ formatDelta(Math.abs(data.costDelta)) }}</span>
              จากช่วงก่อน
            </p>
          </div>
          </template>
        </div>
      </article>
    </div>

    <article
      v-if="data.segments?.length || data.costSegments?.length"
      class="card-fade-static mt-5 p-4 sm:p-5"
    >
      <div class="relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex items-center gap-1 text-[15px] font-semibold text-ink">
            {{ segmentMode === 'revenue' ? 'รายได้ตาม Segment' : 'ต้นทุนตามหมวด' }}
            <InfoTip text="แยกตามช่องทางขายหรือหมวดค่าใช้จ่ายที่ระบุไว้ในไฟล์ของอุตสาหกรรมนี้" />
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex rounded-full bg-white/80 p-0.5" role="group" aria-label="ประเภทข้อมูล">
              <button
                type="button"
                :class="[
                  'rounded-full px-3 py-1 text-[11px] font-medium transition',
                  segmentMode === 'revenue' ? 'bg-ink text-white' : 'text-muted hover:text-ink',
                ]"
                :aria-pressed="segmentMode === 'revenue'"
                @click="segmentMode = 'revenue'"
              >
                รายได้
              </button>
              <button
                type="button"
                :class="[
                  'rounded-full px-3 py-1 text-[11px] font-medium transition',
                  segmentMode === 'cost' ? 'bg-ink text-white' : 'text-muted hover:text-ink',
                ]"
                :aria-pressed="segmentMode === 'cost'"
                @click="segmentMode = 'cost'"
              >
                ต้นทุน
              </button>
            </div>
            <span class="text-[11px] text-muted">{{ scopeShortLabel }} · {{ data.rangeLabel }}</span>
          </div>
        </div>
        <div v-if="displayedSegments.length" class="mt-4 space-y-3">
          <div v-for="segment in displayedSegments" :key="segment.key">
            <div class="flex items-center justify-between gap-3 text-[12px]">
              <span class="truncate font-medium text-ink-soft">{{ segment.label }}</span>
              <span class="shrink-0 tabular text-ink">
                {{ formatCurrency(segment.value) }} · {{ segment.share }}%
              </span>
            </div>
            <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]" aria-hidden="true">
              <div class="h-full rounded-full bg-ink transition-[width] duration-700" :style="{ width: `${segment.share}%` }" />
            </div>
          </div>
        </div>
        <p v-else class="mt-4 text-[12px] text-muted">
          ยังไม่มีข้อมูล{{ segmentMode === 'revenue' ? 'ช่องทางขาย' : 'หมวดต้นทุน' }}สำหรับขอบเขตนี้
        </p>
      </div>
    </article>

    <article v-if="macroBenchmark" class="card-fade-static mt-5 p-4 sm:p-5">
      <div class="relative z-10">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-1 text-[15px] font-semibold text-ink">
            เทียบกับเศรษฐกิจไทย
            <InfoTip text="ตัวเลขมหภาคล่าสุดจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน" />
          </h2>
          <button
            type="button"
            class="text-[11.5px] font-medium text-brand-700 underline-offset-4 hover:underline"
            @click="router.navigate({ to: '/app/industry' })"
          >
            ดูภาพรวมเศรษฐกิจ →
          </button>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl bg-white/80 p-3.5">
            <p class="text-[11px] text-muted">GDP ประเทศไทย</p>
            <p class="tabular mt-1 text-xl font-bold text-ink">{{ formatPercent(macroBenchmark.indicators.gdpGrowth.value) }}</p>
            <p class="mt-0.5 text-[10.5px] text-muted">{{ formatMacroPeriod(macroBenchmark.indicators.gdpGrowth.periodLabel, macroBenchmark.indicators.gdpGrowth.year, locale) }}</p>
            <p
              v-if="gdpComparison && data"
              class="mt-2 text-[10.5px] font-medium"
              :class="gdpComparison.diff >= 0 ? 'text-ink' : 'text-warning'"
            >
              รายได้ธุรกิจ {{ formatDelta(data.revenueDelta) }} ·
              {{ gdpComparison.diff >= 0 ? 'สูงกว่า' : 'ต่ำกว่า' }} GDP
              {{ Math.abs(gdpComparison.diff).toFixed(1) }} จุด
            </p>
          </div>
          <div class="rounded-2xl bg-white/80 p-3.5">
            <p class="text-[11px] text-muted">เงินเฟ้อ (CPI)</p>
            <p class="tabular mt-1 text-xl font-bold text-ink">{{ formatPercent(macroBenchmark.indicators.cpiInflation.value) }}</p>
            <p class="mt-0.5 text-[10.5px] text-muted">{{ formatMacroPeriod(macroBenchmark.indicators.cpiInflation.periodLabel, macroBenchmark.indicators.cpiInflation.year, locale) }}</p>
          </div>
          <div class="rounded-2xl bg-white/80 p-3.5">
            <p class="text-[11px] text-muted">อัตราการว่างงาน</p>
            <p class="tabular mt-1 text-xl font-bold text-ink">{{ formatPercent(macroBenchmark.indicators.unemploymentRate.value) }}</p>
            <p class="mt-0.5 text-[10.5px] text-muted">{{ formatMacroPeriod(macroBenchmark.indicators.unemploymentRate.periodLabel, macroBenchmark.indicators.unemploymentRate.year, locale) }}</p>
          </div>
        </div>
      </div>
    </article>

    <div class="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10 flex w-full flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between gap-3">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-black text-white font-semibold px-3 py-1 text-xs">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                  <img src="/ai-avatar.png" alt="AI" class="h-full w-full object-cover" />
                </span>
                AI วิเคราะห์
              </span>
              <span class="text-xs text-muted font-medium">อ้างอิง {{ formatNumber(totalRows) }} แถว</span>
            </div>
            <h2 class="mt-4 max-w-lg text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">
              {{ data.insight.title }}
            </h2>
            <p class="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
              {{ data.insight.body }}
            </p>
            <button
              type="button"
              class="mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold text-white transition hover:bg-black focus-visible:bg-black focus-visible:outline-none"
              @click="openInsight"
            >
              {{ data.insight.action }}
              <ArrowRight class="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </button>
          </div>

          <div class="mt-7 grid grid-cols-3 gap-3 rounded-2xl bg-white/80 p-4">
            <div>
              <p class="text-xs font-semibold text-muted">รายได้</p>
              <p class="mt-1 text-base sm:text-lg font-bold text-ink">{{ formatDelta(data.revenueDelta) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-muted">กำไร</p>
              <p class="mt-1 text-base sm:text-lg font-bold text-ink">{{ formatDelta(data.profitDelta) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-muted">ต้นทุน</p>
              <p class="mt-1 text-base sm:text-lg font-bold text-rose-700">{{ formatDelta(data.costDelta) }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="card-fade-static p-6 sm:p-7 flex flex-col justify-between">
        <div class="relative z-10">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base sm:text-lg font-bold text-ink">แหล่งข้อมูล {{ scopeShortLabel }}</h2>
            <button
              type="button"
              class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
              @click="router.navigate({ to: '/app/data-sources' })"
            >
              ดูทั้งหมด
            </button>
          </div>

          <ul class="mt-4 space-y-2">
            <li v-for="source in activeSources.slice(0, 3)" :key="source.id">
              <button
                type="button"
                class="group flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition-colors hover:bg-white/80"
                @click="router.navigate({ to: `/app/data-sources/${source.id}` })"
              >
                <FileSpreadsheet class="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                    {{ source.name }}
                  </span>
                  <span class="mt-0.5 block text-xs text-muted">
                    {{ formatNumber(source.rowCount) }} แถว · {{ timeAgo(source.updatedAt) }}
                  </span>
                </span>
                <AppBadge
                  :tone="qualityMeta[source.quality].tone"
                >
                  {{ qualityMeta[source.quality].label }}
                </AppBadge>
              </button>
            </li>
          </ul>

          <p v-if="activeSources.length === 0" class="mt-4 rounded-2xl bg-white/80 px-4 py-5 text-center text-[12px] leading-relaxed text-muted">
            ยังไม่มีไฟล์ในอุตสาหกรรมนี้ — นำเข้าไฟล์จริงเพื่อเริ่มวิเคราะห์
          </p>
        </div>

        <button
          type="button"
          class="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink text-xs font-semibold text-white transition hover:bg-black"
          @click="router.navigate({ to: '/app/import' })"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          เพิ่มแหล่งข้อมูล
        </button>
      </article>
    </div>

    <p class="mt-5 px-4 py-3 text-center text-[11px] leading-relaxed text-muted">
      ROOKAR วิเคราะห์จากข้อมูลที่คุณนำเข้า · ตัวเลขสรุปอาจแตกต่างจากการปิดบัญชีจริง
    </p>

    <!-- Interactive What-If Scenario Builder Modal -->
    <ScenarioBuilderModal
      v-if="data"
      :open="showScenarioModal"
      :base-revenue="data.revenue"
      :base-materials="data.costBreakdown[0]?.value ?? 2374684"
      :base-labor="data.costBreakdown[1]?.value ?? 1278676"
      :base-expenses="data.costBreakdown[2]?.value ?? 913340"
      @update:open="showScenarioModal = $event"
    />
  </template>
</template>

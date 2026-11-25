<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Coffee, Fuel, HeartPulse, Minus, ShieldCheck, Sparkles, Target, Truck, Zap } from '@lucide/vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MarketBenchmarkCard from '@/components/features/MarketBenchmarkCard.vue'
import { getIndustryEconomics, getMacroBenchmark } from '@/lib/macroApi'
import { locale } from '@/lib/i18n'
import { formatMacroPeriod } from '@/lib/macroFormat'
import {
  FOCUS_INDUSTRIES,
  getIndustryProfile,
  type IndustryId,
} from '@/lib/industries'
import { industryFocus, setIndustryFocus } from '@/lib/industryFocus'
import { useToast } from '@/lib/toast'

const router = useRouter()
const queryClient = useQueryClient()
const toast = useToast()

const selectedProfile = computed(() => getIndustryProfile(industryFocus.value))


const industryIcons: Record<IndustryId, Component> = {
  logistics: Truck,
  'energy-fuel': Fuel,
  ev: Zap,
  healthcare: HeartPulse,
  'quantum-security': ShieldCheck,
  fnb: Coffee,
}

const {
  data: macroBenchmark,
  isPending: macroPending,
  isFetching: macroFetching,
  isError: macroError,
  refetch: refetchMacro,
} = useQuery({
  queryKey: ['macro-benchmark'],
  queryFn: () => getMacroBenchmark(),
  staleTime: 6 * 60 * 60 * 1000,
  retry: 2,
})

const { data: industryEconomics, isPending: econPending } = useQuery({
  queryKey: computed(() => ['industry-economics', industryFocus.value] as const),
  queryFn: () => getIndustryEconomics(industryFocus.value),
  staleTime: 6 * 60 * 60 * 1000,
  retry: 1,
})

type EconUnit = 'percent' | 'years' | 'score' | 'per_1000' | 'per_million' | 'kg_oe'

function formatUnitValue(value: number, unit: EconUnit, signed = false) {
  const sign = signed && value > 0 ? '+' : ''
  const en = locale.value === 'en'
  if (unit === 'percent') return `${sign}${value.toFixed(1)}${signed ? ' pts' : '%'}`
  if (unit === 'years') return `${sign}${value.toFixed(1)} ${en ? 'yrs' : 'ปี'}`
  if (unit === 'score') return `${sign}${value.toFixed(1)}${signed ? ' pts' : '/5'}`
  if (unit === 'per_1000') return `${sign}${value.toFixed(2)} / 1k`
  if (unit === 'per_million') return `${sign}${Math.round(value).toLocaleString('en-US')} / 1M`
  return `${sign}${Math.round(value).toLocaleString('en-US')} kg OE`
}

function formatEconValue(indicator: { value: number; unit: EconUnit }) {
  return formatUnitValue(indicator.value, indicator.unit)
}

function indicatorDeltaText(indicator: {
  delta: number | null
  unit: EconUnit
  history: { year: string; value: number }[]
}) {
  if (indicator.delta === null || indicator.history.length < 2) {
    return locale.value === 'en' ? 'No prior data' : 'ไม่มีข้อมูลปีก่อน'
  }
  const previous = indicator.history[indicator.history.length - 2]
  const suffix = locale.value === 'en' ? `vs ${previous.year}` : `เทียบ ${previous.year}`
  return `${formatUnitValue(indicator.delta, indicator.unit, true)} ${suffix}`
}

function deltaDirection(indicator: { delta: number | null }) {
  if (indicator.delta === null || indicator.delta === 0) return 'flat'
  return indicator.delta > 0 ? 'up' : 'down'
}

function sparklinePoints(history: { value: number }[]) {
  const values = history.map((point) => point.value)
  if (values.length < 2) return ''
  const width = 92
  const height = 28
  const pad = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * (width - pad * 2)
      const y = height - pad - ((value - min) / span) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function askIndicator(indicator: {
  key: string
  label: string
  labelEn: string
  value: number
  unit: EconUnit
  year: string
  periodLabel: string
}) {
  const en = locale.value === 'en'
  const label = en ? indicator.labelEn : indicator.label
  const period = formatMacroPeriod(indicator.periodLabel, indicator.year, locale.value)
  const value = formatEconValue(indicator)
  const industry = en ? selectedProfile.value.labelEn : selectedProfile.value.label
  const prompt = en
    ? `Analyze the "${label}" indicator for the ${industry} sector: ${value} (${period}). What does this signal mean for the business, what risks or opportunities does it create, and what should we do next?`
    : `วิเคราะห์ตัวชี้วัด "${label}" ของอุตสาหกรรม ${industry} ค่า ${value} (${period}) ว่าหมายถึงอะไรต่อธุรกิจ มีความเสี่ยงหรือโอกาสอะไร และควรทำอะไรต่อ`
  askPrompt(prompt)
}

async function selectIndustry(industryId: IndustryId) {
  if (industryFocus.value === industryId) return
  setIndustryFocus(industryId)
  await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  toast.success('เปลี่ยนโฟกัสอุตสาหกรรมแล้ว', `กำลังดูบริบทของ ${getIndustryProfile(industryId).label}`)
}

function askPrompt(prompt: string) {
  router.navigate({ to: '/app/assistant', search: { prompt } })
}

function askIndustry() {
  router.navigate({
    to: '/app/assistant',
    search: { prompt: `วิเคราะห์ภาพรวมและโอกาสของอุตสาหกรรม${selectedProfile.value.label}` },
  })
}
</script>

<template>
  <PageHeader
    title="เศรษฐกิจและอุตสาหกรรม"
    description="บริบทเศรษฐกิจมหภาคจริงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน พร้อมจุดโฟกัสของอุตสาหกรรมที่เลือก"
  >
    <template #actions>
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4f5f7] px-4 text-[12px] font-semibold text-ink transition hover:bg-[#eceef1] focus-visible:bg-[#eceef1] focus-visible:outline-none"
          >
            <component :is="industryIcons[selectedProfile.id]" class="h-4 w-4 text-muted" aria-hidden="true" />
            {{ selectedProfile.shortLabel }}
            <ChevronDown class="h-4 w-4 text-muted" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            align="start"
            :side-offset="8"
            class="z-[70] min-w-[320px] rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] focus:outline-none"
          >
            <DropdownMenuLabel class="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              เลือกอุตสาหกรรม
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="industry in FOCUS_INDUSTRIES"
              :key="industry.id"
              :class="[
                'flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-100',
                industry.parentId ? 'pl-8' : '',
              ]"
              @select="selectIndustry(industry.id)"
            >
              <span v-if="industry.parentId" class="text-[10px] text-muted" aria-hidden="true">↳</span>
              <component :is="industryIcons[industry.id]" class="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span class="flex-1">{{ industry.label }}</span>
              <span
                v-if="industry.priority"
                class="inline-flex items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800"
              >
                ขายก่อน
              </span>
              <Check v-if="industryFocus === industry.id" class="h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </template>
  </PageHeader>


  <article class="mt-5 rounded-3xl bg-[#e4e4e7] p-4 sm:p-5">
    <div class="relative z-10">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wide text-muted">
            {{ locale === 'en' ? 'INDUSTRY ECONOMICS' : 'เศรษฐกิจอุตสาหกรรม' }}
          </p>
          <h2 class="mt-0.5 text-lg font-bold tracking-tight text-ink">
            {{ locale === 'en' ? industryEconomics?.labelEn : industryEconomics?.label }}
          </h2>
          <p class="mt-0.5 text-[11.5px] leading-relaxed text-muted">
            {{ locale === 'en' ? 'Real signals for demand, cost and capacity — open a signal to ask AI what to do next.' : 'สัญญาณจริงด้านดีมานด์ ต้นทุน และกำลังการผลิต — กดสัญญาณเพื่อถาม AI ว่าควรทำอะไรต่อ' }}
          </p>
        </div>
        <span class="inline-flex shrink-0 items-center rounded-full bg-black px-2.5 py-0.5 text-[10px] font-semibold text-white">
          {{ locale === 'en' ? 'Real data from World Bank' : 'ข้อมูลจริงจาก World Bank' }}
        </span>
      </div>

      <div v-if="econPending" class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div v-for="index in 4" :key="index" class="skeleton h-[188px] rounded-2xl" />
      </div>
      <div v-else-if="industryEconomics?.indicators.length" class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div
          v-for="indicator in industryEconomics.indicators"
          :key="indicator.key"
          class="flex h-full flex-col rounded-2xl bg-white p-3.5"
        >
          <div class="flex items-start justify-between gap-2.5">
            <div class="min-w-0">
              <p class="text-[11.5px] font-semibold text-ink">
                {{ locale === 'en' ? indicator.labelEn : indicator.label }}
              </p>
              <p class="mt-0.5 text-[10px] leading-relaxed text-muted">
                {{ formatMacroPeriod(indicator.periodLabel, indicator.year, locale) }} ·
                {{ locale === 'en' ? indicator.noteEn : indicator.note }}
              </p>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-black/[0.07] px-1.5 py-0.5 text-[9px] font-semibold text-ink-soft"
            >
              <ArrowUpRight v-if="deltaDirection(indicator) === 'up'" class="h-2.5 w-2.5" aria-hidden="true" />
              <ArrowDownRight v-else-if="deltaDirection(indicator) === 'down'" class="h-2.5 w-2.5" aria-hidden="true" />
              <Minus v-else class="h-2.5 w-2.5" aria-hidden="true" />
              {{ indicatorDeltaText(indicator) }}
            </span>
          </div>

          <div class="mt-2.5 flex items-end justify-between gap-3">
            <p class="tabular text-[24px] font-bold leading-none tracking-tight text-ink">
              {{ formatEconValue(indicator) }}
            </p>
            <svg
              v-if="indicator.history.length > 1"
              viewBox="0 0 92 28"
              class="h-6 w-[80px] shrink-0 text-ink/45"
              aria-hidden="true"
            >
              <polyline
                :points="sparklinePoints(indicator.history)"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="mt-2.5 border-t border-black/[0.06] pt-2">
            <p class="text-[10.5px] leading-relaxed text-ink-soft">
              {{ locale === 'en' ? indicator.useCaseEn : indicator.useCase }}
            </p>
            <button
              type="button"
              class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 transition hover:text-brand-800"
              @click="askIndicator(indicator)"
            >
              {{ locale === 'en' ? 'Ask AI about this signal' : 'ถาม AI ต่อจากสัญญาณนี้' }}
              <ArrowRight class="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <p v-else class="mt-4 text-[12px] text-muted">
        {{ locale === 'en' ? 'No industry economic data available right now.' : 'ยังไม่มีข้อมูลเศรษฐกิจของอุตสาหกรรมนี้ในขณะนี้' }}
      </p>
    </div>
  </article>

  <MarketBenchmarkCard
    :benchmark="macroBenchmark"
    :loading="macroPending"
    :refreshing="macroFetching && !macroPending"
    :error="macroError"
    :show-business-actions="false"
    @retry="refetchMacro()"
  />

  <div class="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
    <article class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-[10.5px] font-semibold uppercase tracking-wide text-muted">ภาพรวมอุตสาหกรรม</p>
            <h2 class="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {{ selectedProfile.label }}
            </h2>
            <p class="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
              {{ selectedProfile.description }}
            </p>
          </div>
          <AppBadge v-if="selectedProfile.salesNote" tone="warning" class="!h-auto !w-auto shrink-0 whitespace-nowrap px-3 py-1">
            {{ selectedProfile.salesNote }}
          </AppBadge>
        </div>

        <div class="mt-5 border-t border-black/10 pt-4">
          <h3 class="text-[12px] font-semibold uppercase tracking-wide text-muted">จุดที่ควรจับตา</h3>
          <ul class="mt-3 space-y-3">
            <li
              v-for="point in selectedProfile.focusPoints"
              :key="point"
              class="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft"
            >
              <Target class="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>
      </div>
    </article>

    <article class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <div>
          <p class="text-[10.5px] font-semibold uppercase tracking-wide text-muted">ถาม AI เกี่ยวกับอุตสาหกรรม</p>
          <h2 class="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {{ selectedProfile.shortLabel }}
          </h2>
          <p class="mt-1.5 text-[13px] leading-relaxed text-muted">
            ใช้คำถามเหล่านี้เพื่อเจาะลึกโอกาสและความเสี่ยงของอุตสาหกรรมที่เลือก
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="prompt in selectedProfile.sample.quickPrompts"
              :key="prompt"
              type="button"
              class="rounded-full bg-neutral-100 px-3 py-[13px] text-left text-[12px] font-medium text-ink transition hover:bg-neutral-200"
              @click="askPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <AppButton class="mt-6 w-full" @click="askIndustry">
          <template #left>
            <Sparkles class="h-4 w-4" aria-hidden="true" />
          </template>
          วิเคราะห์อุตสาหกรรมนี้กับ AI
          <template #right>
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </div>
    </article>
  </div>

  <p class="mt-5 px-4 py-3 text-center text-[11px] leading-relaxed text-muted">
    ข้อมูลมหภาคเป็นข้อมูลจริงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน · ข้อมูลธุรกิจแยกตามอุตสาหกรรมที่เลือก
  </p>
</template>

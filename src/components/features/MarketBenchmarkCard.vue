<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { ArrowUpRight, TrendingUp, Sparkles, Building2, SlidersHorizontal } from '@lucide/vue'
import type { SectorBenchmark } from '@/types'
import InfoTip from '@/components/ui/InfoTip.vue'
import { useCountUp } from '@/composables/useCountUp'

const props = defineProps<{
  benchmark?: SectorBenchmark
}>()

const emit = defineEmits<{
  'open-scenario': []
}>()

const router = useRouter()

const data = computed(() => {
  return (
    props.benchmark ?? {
      sectorName: 'ภาคบริการ อาหารและเครื่องดื่ม',
      sectorGdpGrowth: 3.8,
      privateConsumptionGrowth: 2.1,
      inflationCpi: 1.4,
      businessGrowth: 12.4,
      outperformance: 8.6,
      status: 'outperforming' as const,
      assessment:
        'ยอดขายร้านคุณเติบโต +12.4% แข็งแกร่งกว่า GDP ภาคอาหาร (+3.8%) และดัชนีบริโภคเอกชน (+2.1%) สะท้อนว่าร้านโตจากการขยายฐานลูกค้าและส่วนแบ่งตลาด ไม่ใช่แค่ตลาดหนุน',
      period: 'ไตรมาส 3/2569',
      source: 'สภาพัฒน์ (สศช.) · ธนาคารแห่งประเทศไทย',
    }
  )
})

const sectorGdpDisplay = useCountUp(() => `+${data.value.sectorGdpGrowth}%`, { duration: 950 })
const pciDisplay = useCountUp(() => `+${data.value.privateConsumptionGrowth}%`, { duration: 950 })
const cpiDisplay = useCountUp(() => `+${data.value.inflationCpi}%`, { duration: 950 })
const businessGrowthDisplay = useCountUp(() => `+${data.value.businessGrowth}%`, { duration: 950 })

function askAiMarket() {
  router.navigate({
    to: '/app/assistant',
    search: { prompt: 'วิเคราะห์ยอดขายเทียบกับ GDP และตลาด' },
  })
}
</script>

<template>
  <article class="card-fade-static p-6 sm:p-7">
    <div class="relative z-10">
      <!-- Header row -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
            <Building2 class="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 class="flex items-center gap-1.5 text-base sm:text-lg font-bold text-ink">
              บริบทเศรษฐกิจและตลาด (Market Benchmark)
              <InfoTip text="เปรียบเทียบผลการดำเนินงานของธุรกิจกับ GDP หมวดธุรกิจเดียวกันและดัชนีเศรษฐกิจของประเทศ โดยสภาพัฒน์ (สศช.) และ ธปท." />
            </h2>
            <p class="text-xs font-medium text-muted mt-0.5">
              {{ data.sectorName }} · {{ data.period }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
            <ArrowUpRight class="h-3.5 w-3.5" />
            ชนะตลาด +{{ data.outperformance }}% จุด
          </span>
          <span class="hidden text-xs text-muted sm:inline-block">
            ที่มา: {{ data.source }}
          </span>
        </div>
      </div>

      <!-- 4 Metric Cards Comparison Grid -->
      <div class="mt-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div class="rounded-2xl bg-white/80 p-4 sm:p-5 flex flex-col justify-between">
          <p class="text-xs sm:text-[13px] font-semibold text-neutral-600">GDP ภาคอาหารและบริการ</p>
          <p class="tabular mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {{ sectorGdpDisplay }}
          </p>
          <p class="mt-1.5 text-xs text-muted font-medium">YoY · สภาพัฒน์ (สศช.)</p>
        </div>

        <div class="rounded-2xl bg-white/80 p-4 sm:p-5 flex flex-col justify-between">
          <p class="text-xs sm:text-[13px] font-semibold text-neutral-600">ดัชนีการบริโภคเอกชน (PCI)</p>
          <p class="tabular mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {{ pciDisplay }}
          </p>
          <p class="mt-1.5 text-xs text-muted font-medium">กำลังซื้อในประเทศ · ธปท.</p>
        </div>

        <div class="rounded-2xl bg-white/80 p-4 sm:p-5 flex flex-col justify-between">
          <p class="text-xs sm:text-[13px] font-semibold text-neutral-600">อัตราเงินเฟ้อทั่วไป (CPI)</p>
          <p class="tabular mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {{ cpiDisplay }}
          </p>
          <p class="mt-1.5 text-xs text-muted font-medium">ต้นทุนครองชีพ · กระทรวงพาณิชย์</p>
        </div>

        <div class="rounded-2xl bg-black text-white p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <p class="text-xs sm:text-[13px] font-semibold text-neutral-300">ยอดขายร้านคุณ (บลูมมิ่ง)</p>
          <p class="tabular mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {{ businessGrowthDisplay }}
          </p>
          <p class="mt-1.5 text-xs text-neutral-300 font-medium">เอาต์เพอร์ฟอร์มตลาด</p>
        </div>
      </div>

      <!-- Diagnostic Insight Box -->
      <div class="mt-5 flex flex-col gap-3 rounded-2xl bg-[#f4f5f7] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3.5">
          <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <Sparkles class="h-4 w-4 text-amber-300" />
          </div>
          <div>
            <p class="text-sm font-bold text-ink">
              บทวินิจฉัยตลาด: ยอดขายเติบโตจากความแข็งแกร่งของร้านเอง
            </p>
            <p class="mt-1 text-xs sm:text-[13px] leading-relaxed text-muted">
              {{ data.assessment }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-ink transition hover:bg-neutral-200"
            @click="emit('open-scenario')"
          >
            <SlidersHorizontal class="h-3.5 w-3.5" />
            จำลองเศรษฐกิจ (What-If)
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
            @click="askAiMarket"
          >
            <Sparkles class="h-3.5 w-3.5" />
            ปรึกษา AI ทิศทางตลาด
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, Database, FileSpreadsheet, Loader2, Plus, Sparkles, Upload } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import KpiCard from '@/components/charts/KpiCard.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import CostDonut from '@/components/charts/CostDonut.vue'
import ScenarioBuilderModal from '@/components/features/ScenarioBuilderModal.vue'
import { getDashboard, getSession, listSources, seedSampleSources } from '@/lib/mockApi'
import { getIndustryProfile } from '@/lib/industries'
import { industryFocus } from '@/lib/industryFocus'
import { formatCurrency, formatDelta, formatNumber, formatPercent, timeAgo } from '@/lib/format'
import { useToast } from '@/lib/toast'

type Range = '3m' | '6m' | '12m'

const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()
const session = getSession()
const range = ref<Range>('6m')
const selectedIndustry = industryFocus
const seedLoading = ref(false)
const showScenarioModal = ref(false)

const rangeOptions: { value: Range; label: string }[] = [
  { value: '3m', label: '3 เดือน' },
  { value: '6m', label: '6 เดือน' },
  { value: '12m', label: '12 เดือน' },
]

const selectedIndustryProfile = computed(() => getIndustryProfile(selectedIndustry.value))

const { data, isPending, isFetching } = useQuery({
  queryKey: computed(() => ['dashboard', range.value, selectedIndustry.value] as const),
  queryFn: () => getDashboard(range.value, selectedIndustry.value),
  placeholderData: (previous) => previous,
})

const { data: sources } = useQuery({
  queryKey: ['sources'],
  queryFn: listSources,
})

const businessName = computed(() => session?.business?.name ?? 'ธุรกิจของคุณ')
const totalRows = computed(() => (sources.value ?? []).reduce((sum, source) => sum + source.rowCount, 0))
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
  showScenarioModal.value = true
}

async function loadSample() {
  if (seedLoading.value) return
  seedLoading.value = true
  try {
    await seedSampleSources(selectedIndustry.value)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
    ])
    toast.success('เพิ่มข้อมูลตัวอย่างแล้ว', 'ลองสำรวจภาพรวมและถาม AI ต่อได้เลย')
  } finally {
    seedLoading.value = false
  }
}
</script>

<template>
  <PageHeader :title="`ภาพรวมธุรกิจของ ${businessName}`">
    <template #actions>
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
      <h2 class="mt-5 text-h2 font-semibold tracking-tight text-ink">เริ่มเห็นภาพรวมด้วยข้อมูลชุดแรก</h2>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        นำเข้าไฟล์ยอดขายหรือต้นทุน 1 ไฟล์ แล้ว ROOKAR จะสรุปภาพรวมและหาโอกาสทางธุรกิจให้คุณทันที
      </p>
      <div class="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <AppButton size="lg" @click="router.navigate({ to: '/app/import' })">
          <template #left>
            <Plus class="h-4 w-4" aria-hidden="true" />
          </template>
          นำเข้าข้อมูลแรก
        </AppButton>
        <AppButton variant="secondary" size="lg" :loading="seedLoading" @click="loadSample">
          ลองใช้ข้อมูลตัวอย่าง
        </AppButton>
      </div>
      <p class="mt-4 text-[11px] text-faint">
        ข้อมูลตัวอย่างจะถูกสร้างตามอุตสาหกรรมที่เลือก ({{ selectedIndustryProfile.shortLabel }}) และไม่กระทบข้อมูลจริงของคุณ
      </p>
    </div>
  </section>

  <template v-else>
    <div class="grid grid-cols-2 gap-5 xl:grid-cols-4">
      <KpiCard
        label="รายได้รวม"
        :value="formatCurrency(data.revenue)"
        :change="formatDelta(data.revenueDelta)"
        :tone="data.revenueDelta >= 0 ? 'positive' : 'negative'"
        :spark="data.revenueSpark"
        spark-color="#18181b"
        :info="`รายได้รวมจากทุกช่องทางในช่วง ${data.rangeLabel}`"
      />
      <KpiCard
        label="กำไรสุทธิ"
        :value="formatCurrency(data.profit)"
        :change="formatDelta(data.profitDelta)"
        :tone="data.profitDelta >= 0 ? 'positive' : 'negative'"
        :spark="data.profitSpark"
        spark-color="#ea580c"
        :info="'รายได้หักต้นทุนและค่าใช้จ่ายทั้งหมดแล้ว'"
      />
      <KpiCard
        label="ต้นทุนรวม"
        :value="formatCurrency(data.cost)"
        :change="formatDelta(data.costDelta)"
        :tone="data.costDelta > 0 ? 'negative' : 'positive'"
        direction="up"
        :spark="data.costSpark"
        spark-color="#18181b"
        :info="'ต้นทุนวัตถุดิบ ค่าแรง และค่าใช้จ่ายดำเนินงาน'"
      />
      <KpiCard
        label="อัตรากำไร"
        :value="formatPercent(data.margin)"
        :change="`${formatDelta(data.marginDelta)} จุด`"
        :tone="data.marginDelta >= 0 ? 'positive' : 'negative'"
        :spark="data.marginSpark"
        spark-color="#18181b"
        :info="'กำไรสุทธิหารด้วยรายได้รวม คิดเป็นเปอร์เซ็นต์'"
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

          <div class="mt-2 pt-2">
            <RevenueChart :series="data.series" />
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
              :class="[
                'mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold text-white',
                data.costDelta > 0 ? 'bg-rose-700' : 'bg-neutral-900',
              ]"
            >
              {{ formatDelta(data.costDelta) }}
            </span>
          </div>

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
        </div>
      </article>
    </div>

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
            <h2 class="text-base sm:text-lg font-bold text-ink">ข้อมูลล่าสุด</h2>
            <button
              type="button"
              class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
              @click="router.navigate({ to: '/app/data-sources' })"
            >
              ดูทั้งหมด
            </button>
          </div>

          <ul class="mt-4 space-y-2">
            <li v-for="source in (sources ?? []).slice(0, 3)" :key="source.id">
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

    <p class="mt-5 rounded-[24px] bg-black px-4 py-3 text-center text-[11px] leading-relaxed text-white">
      ROOKAR วิเคราะห์จากข้อมูลที่คุณนำเข้า · ข้อมูลธุรกิจอาจเป็นข้อมูลตัวอย่างตามอุตสาหกรรม · ตัวเลขสรุปอาจแตกต่างจากการปิดบัญชีจริง
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

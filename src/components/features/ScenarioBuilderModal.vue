<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
  ArrowRight,
  Boxes,
  Percent,
  ReceiptText,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from '@lucide/vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { formatCurrency, formatDelta, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    open: boolean
    baseRevenue?: number
    baseMaterials?: number
    baseLabor?: number
    baseExpenses?: number
  }>(),
  {
    baseRevenue: 6248500,
    baseMaterials: 2374684,
    baseLabor: 1278676,
    baseExpenses: 913340,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const router = useRouter()

// Sliders percentage delta
const salesDelta = ref(0)
const materialsDelta = ref(-5) // Default to -5% as featured in insight
const laborDelta = ref(0)
const expensesDelta = ref(0)

function reset() {
  salesDelta.value = 0
  materialsDelta.value = 0
  laborDelta.value = 0
  expensesDelta.value = 0
}

function applyPreset(
  preset:
    | 'cut-materials'
    | 'raise-price'
    | 'expand'
    | 'cost-control'
    | 'gdp-slowdown'
    | 'tourism-boom'
    | 'inflation-shock',
) {
  if (preset === 'cut-materials') {
    salesDelta.value = 0
    materialsDelta.value = -8
    laborDelta.value = 0
    expensesDelta.value = 0
  } else if (preset === 'raise-price') {
    salesDelta.value = 10
    materialsDelta.value = 0
    laborDelta.value = 0
    expensesDelta.value = 0
  } else if (preset === 'expand') {
    salesDelta.value = 20
    materialsDelta.value = 15
    laborDelta.value = 10
    expensesDelta.value = 5
  } else if (preset === 'cost-control') {
    salesDelta.value = 0
    materialsDelta.value = -5
    laborDelta.value = -2
    expensesDelta.value = -10
  } else if (preset === 'gdp-slowdown') {
    salesDelta.value = -8
    materialsDelta.value = 0
    laborDelta.value = 0
    expensesDelta.value = 2
  } else if (preset === 'tourism-boom') {
    salesDelta.value = 18
    materialsDelta.value = 8
    laborDelta.value = 10
    expensesDelta.value = 4
  } else if (preset === 'inflation-shock') {
    salesDelta.value = 2
    materialsDelta.value = 12
    laborDelta.value = 5
    expensesDelta.value = 6
  }
}

// Calculations
const currentRevenue = computed(() => props.baseRevenue * (1 + salesDelta.value / 100))
const currentMaterials = computed(() => props.baseMaterials * (1 + materialsDelta.value / 100))
const currentLabor = computed(() => props.baseLabor * (1 + laborDelta.value / 100))
const currentExpenses = computed(() => props.baseExpenses * (1 + expensesDelta.value / 100))

const currentTotalCost = computed(
  () => currentMaterials.value + currentLabor.value + currentExpenses.value,
)
const baseTotalCost = computed(
  () => props.baseMaterials + props.baseLabor + props.baseExpenses,
)

const currentProfit = computed(() => currentRevenue.value - currentTotalCost.value)
const baseProfit = computed(() => props.baseRevenue - baseTotalCost.value)

const profitDelta = computed(() => currentProfit.value - baseProfit.value)
const profitDeltaPercent = computed(() =>
  baseProfit.value > 0 ? (profitDelta.value / baseProfit.value) * 100 : 0,
)

const currentMargin = computed(() =>
  currentRevenue.value > 0 ? (currentProfit.value / currentRevenue.value) * 100 : 0,
)
const baseMargin = computed(() =>
  props.baseRevenue > 0 ? (baseProfit.value / props.baseRevenue) * 100 : 0,
)
const marginDelta = computed(() => currentMargin.value - baseMargin.value)

function askAI() {
  emit('update:open', false)
  const prompt = `ถ้าเราปรับแผนธุรกิจ: ยอดขาย ${salesDelta.value >= 0 ? '+' : ''}${salesDelta.value}%, ต้นทุนวัตถุดิบ ${materialsDelta.value >= 0 ? '+' : ''}${materialsDelta.value}%, ค่าแรง ${laborDelta.value >= 0 ? '+' : ''}${laborDelta.value}%, ค่าใช้จ่ายอื่น ${expensesDelta.value >= 0 ? '+' : ''}${expensesDelta.value}% จะส่งผลให้กำไรสุทธิเปลี่ยนเป็น ${formatCurrency(currentProfit.value)} (${profitDelta.value >= 0 ? '+' : ''}${formatCurrency(profitDelta.value)}) ช่วยวิเคราะห์ความเป็นไปได้และขั้นตอนปฏิบัติจริงหน่อยครับ`
  router.navigate({
    to: '/app/assistant',
    search: { prompt },
  })
}
</script>

<template>
  <AppModal
    :open="open"
    title="จำลองฉากทัศน์ What-If"
    description="ปรับเปลี่ยนตัวแปรยอดขายและต้นทุน เพื่อดูผลกระทบต่อกำไรสุทธิและอัตรากำไรแบบ Real-time"
    size="xl"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-6 pt-2">
      <!-- Result Highlight Banner -->
      <div class="rounded-2xl bg-black p-5 sm:p-6 text-white">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-neutral-400">กำไรสุทธิคาดการณ์</span>
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                  profitDelta >= 0 ? 'bg-white text-black' : 'bg-rose-500 text-white',
                ]"
              >
                {{ profitDelta >= 0 ? '+' : '' }}{{ formatCurrency(profitDelta) }} ({{ profitDeltaPercent >= 0 ? '+' : '' }}{{ profitDeltaPercent.toFixed(1) }}%)
              </span>
            </div>
            <p class="tabular mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {{ formatCurrency(currentProfit) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6 border-t border-neutral-800 pt-3 sm:border-0 sm:pt-0">
            <div>
              <p class="text-[11px] text-neutral-400">อัตรากำไร (Margin)</p>
              <p class="tabular mt-0.5 text-base sm:text-lg font-bold text-white">
                {{ currentMargin.toFixed(1) }}%
                <span class="text-xs font-normal" :class="marginDelta >= 0 ? 'text-white' : 'text-neutral-400'">
                  ({{ marginDelta >= 0 ? '+' : '' }}{{ marginDelta.toFixed(1) }}% จุด)
                </span>
              </p>
            </div>
            <div>
              <p class="text-[11px] text-neutral-400">ต้นทุนรวมใหม่</p>
              <p class="tabular mt-0.5 text-base sm:text-lg font-bold text-white">
                {{ formatCurrency(currentTotalCost) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between">
            <p class="text-[12px] font-semibold text-ink">ฉากทัศน์กลยุทธ์ร้าน (Internal Strategy)</p>
            <button
              type="button"
              class="flex items-center gap-1 text-[11.5px] font-medium text-muted hover:text-black transition"
              @click="reset"
            >
              <RotateCcw class="h-3 w-3" />
              รีเซ็ตค่าเดิม
            </button>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-neutral-200"
              @click="applyPreset('cut-materials')"
            >
              ลดค่าวัตถุดิบ 8%
            </button>
            <button
              type="button"
              class="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-neutral-200"
              @click="applyPreset('raise-price')"
            >
              ปรับขึ้นราคา 10%
            </button>
            <button
              type="button"
              class="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-neutral-200"
              @click="applyPreset('cost-control')"
            >
              คุมต้นทุนทุกด้าน (-5% วัตถุดิบ, -10% น้ำไฟ)
            </button>
            <button
              type="button"
              class="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-neutral-200"
              @click="applyPreset('expand')"
            >
              ขยายสาขา (ยอดขาย +20%, ค่าแรง +10%)
            </button>
          </div>
        </div>

        <div>
          <p class="text-[12px] font-semibold text-ink flex items-center gap-1.5">
            <span>จำลองผลกระทบเศรษฐกิจมหภาค (Macro Stress Test)</span>
            <span class="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">GDP & ตลาด</span>
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-[12px] font-medium text-ink transition flex items-center gap-1"
              @click="applyPreset('gdp-slowdown')"
            >
              🏛️ กำลังซื้อชะลอตัว (GDP -1.5%)
            </button>
            <button
              type="button"
              class="rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-[12px] font-medium text-ink transition flex items-center gap-1"
              @click="applyPreset('tourism-boom')"
            >
              ✈️ ท่องเที่ยวบูม (GDP ท่องเที่ยว +6.5%)
            </button>
            <button
              type="button"
              class="rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-[12px] font-medium text-ink transition flex items-center gap-1"
              @click="applyPreset('inflation-shock')"
            >
              📈 เงินเฟ้อดันต้นทุน (CPI +4.0%)
            </button>
          </div>
        </div>
      </div>

      <!-- Sliders Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- 1. ยอดขาย -->
        <div class="rounded-2xl bg-[#f4f5f7] p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <TrendingUp class="h-4 w-4 text-black" />
              ยอดขายและราคา
            </span>
            <span class="tabular rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
              {{ salesDelta >= 0 ? '+' : '' }}{{ salesDelta }}%
            </span>
          </div>
          <input
            v-model.number="salesDelta"
            type="range"
            min="-30"
            max="30"
            step="1"
            class="w-full accent-black cursor-pointer"
            aria-label="ปรับเปอร์เซ็นต์ยอดขาย"
          />
          <div class="flex justify-between text-[11px] text-muted">
            <span>ฐาน: {{ formatCurrency(baseRevenue) }}</span>
            <span class="font-semibold text-ink">{{ formatCurrency(currentRevenue) }}</span>
          </div>
        </div>

        <!-- 2. ต้นทุนวัตถุดิบ -->
        <div class="rounded-2xl bg-[#f4f5f7] p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Boxes class="h-4 w-4 text-black" />
              ต้นทุนวัตถุดิบ & บรรจุภัณฑ์
            </span>
            <span class="tabular rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
              {{ materialsDelta >= 0 ? '+' : '' }}{{ materialsDelta }}%
            </span>
          </div>
          <input
            v-model.number="materialsDelta"
            type="range"
            min="-30"
            max="30"
            step="1"
            class="w-full accent-black cursor-pointer"
            aria-label="ปรับเปอร์เซ็นต์ต้นทุนวัตถุดิบ"
          />
          <div class="flex justify-between text-[11px] text-muted">
            <span>ฐาน: {{ formatCurrency(baseMaterials) }}</span>
            <span class="font-semibold text-ink">{{ formatCurrency(currentMaterials) }}</span>
          </div>
        </div>

        <!-- 3. ค่าแรงพนักงาน -->
        <div class="rounded-2xl bg-[#f4f5f7] p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Users class="h-4 w-4 text-black" />
              ค่าแรง & โอที
            </span>
            <span class="tabular rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
              {{ laborDelta >= 0 ? '+' : '' }}{{ laborDelta }}%
            </span>
          </div>
          <input
            v-model.number="laborDelta"
            type="range"
            min="-30"
            max="30"
            step="1"
            class="w-full accent-black cursor-pointer"
            aria-label="ปรับเปอร์เซ็นต์ค่าแรง"
          />
          <div class="flex justify-between text-[11px] text-muted">
            <span>ฐาน: {{ formatCurrency(baseLabor) }}</span>
            <span class="font-semibold text-ink">{{ formatCurrency(currentLabor) }}</span>
          </div>
        </div>

        <!-- 4. ค่าใช้จ่ายอื่นๆ -->
        <div class="rounded-2xl bg-[#f4f5f7] p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <ReceiptText class="h-4 w-4 text-black" />
              ค่าเช่า ค่าน้ำ ค่าไฟ อื่นๆ
            </span>
            <span class="tabular rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
              {{ expensesDelta >= 0 ? '+' : '' }}{{ expensesDelta }}%
            </span>
          </div>
          <input
            v-model.number="expensesDelta"
            type="range"
            min="-30"
            max="30"
            step="1"
            class="w-full accent-black cursor-pointer"
            aria-label="ปรับเปอร์เซ็นต์ค่าใช้จ่ายอื่นๆ"
          />
          <div class="flex justify-between text-[11px] text-muted">
            <span>ฐาน: {{ formatCurrency(baseExpenses) }}</span>
            <span class="font-semibold text-ink">{{ formatCurrency(currentExpenses) }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <AppButton variant="secondary" @click="emit('update:open', false)">
          ปิดหน้าต่าง
        </AppButton>

        <AppButton @click="askAI">
          <template #left>
            <Sparkles class="h-4 w-4" aria-hidden="true" />
          </template>
          ให้ AI วางแผนปฏิบัติการฉากทัศน์นี้
          <template #right>
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

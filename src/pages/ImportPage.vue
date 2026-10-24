<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  CloudUpload,
  Download,
  FileSpreadsheet,
  FileUp,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  X,
} from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStepper from '@/components/ui/AppStepper.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { commitImport, createImportPreview } from '@/lib/mockApi'
import { formatFileSize, formatNumber } from '@/lib/format'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/cn'
import type { DataSource, DataType, ImportPreview } from '@/types'

const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

const steps = [
  { label: 'อัปโหลด', hint: 'เลือกไฟล์' },
  { label: 'จับคู่คอลัมน์', hint: 'ตรวจหัวตาราง' },
  { label: 'ตรวจสอบ', hint: 'ยืนยันข้อมูล' },
  { label: 'เสร็จสิ้น', hint: 'พร้อมใช้งาน' },
]

const dataTypeMeta: Record<
  DataType,
  { label: string; description: string; icon: typeof TrendingUp }
> = {
  sales: {
    label: 'ยอดขาย',
    description: 'ยอดขายรายวันหรือรายการขาย',
    icon: TrendingUp,
  },
  materials: {
    label: 'ต้นทุนวัตถุดิบ',
    description: 'ค่าวัตถุดิบและบรรจุภัณฑ์',
    icon: Boxes,
  },
  labor: {
    label: 'ค่าแรง',
    description: 'เงินเดือน ค่าจ้าง และโอที',
    icon: Users,
  },
  expenses: {
    label: 'ค่าใช้จ่ายอื่น',
    description: 'ค่าเช่า ค่าน้ำ ค่าไฟ และอื่น ๆ',
    icon: ReceiptText,
  },
}

interface FieldDef {
  key: string
  label: string
  required: boolean
  keywords: string[]
}

const mappingDefs: Record<DataType, FieldDef[]> = {
  sales: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date', 'วัน'] },
    { key: 'amount', label: 'ยอดขาย', required: true, keywords: ['ยอดขาย', 'amount', 'total', 'รายได้'] },
    { key: 'orders', label: 'จำนวนออเดอร์', required: false, keywords: ['ออเดอร์', 'order', 'จำนวน'] },
    { key: 'channel', label: 'ช่องทางขาย', required: false, keywords: ['ช่องทาง', 'channel'] },
  ],
  materials: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date'] },
    { key: 'item', label: 'ชื่อวัตถุดิบ', required: true, keywords: ['วัตถุดิบ', 'item', 'name', 'สินค้า'] },
    { key: 'quantity', label: 'จำนวน', required: false, keywords: ['จำนวน', 'quantity', 'qty'] },
    { key: 'unitPrice', label: 'ราคาต่อหน่วย', required: false, keywords: ['ราคาต่อหน่วย', 'unit', 'price'] },
    { key: 'total', label: 'ยอดรวม', required: true, keywords: ['รวม', 'total', 'amount'] },
  ],
  labor: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date'] },
    { key: 'name', label: 'ชื่อพนักงาน', required: true, keywords: ['ชื่อพนักงาน', 'พนักงาน', 'name'] },
    { key: 'role', label: 'ตำแหน่ง', required: false, keywords: ['ตำแหน่ง', 'role'] },
    { key: 'hours', label: 'ชั่วโมงทำงาน', required: false, keywords: ['ชั่วโมง', 'hour'] },
    { key: 'amount', label: 'ค่าแรง', required: true, keywords: ['ค่าแรง', 'เงินเดือน', 'amount', 'salary'] },
  ],
  expenses: [
    { key: 'date', label: 'วันที่', required: true, keywords: ['วันที่', 'date'] },
    { key: 'category', label: 'หมวดหมู่', required: true, keywords: ['หมวดหมู่', 'category', 'ประเภท'] },
    { key: 'description', label: 'รายละเอียด', required: false, keywords: ['รายละเอียด', 'description', 'detail'] },
    { key: 'amount', label: 'จำนวนเงิน', required: true, keywords: ['จำนวนเงิน', 'amount', 'total', 'รวม'] },
  ],
}

const step = ref(0)
const selectedType = ref<DataType>('sales')
const file = ref<File | null>(null)
const preview = ref<ImportPreview | null>(null)
const createdSource = ref<DataSource | null>(null)
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const loadingPreview = ref(false)
const committing = ref(false)
const mapping = reactive<Record<string, string>>({})

const fieldDefs = computed(() => mappingDefs[selectedType.value])
const missingRequired = computed(() =>
  fieldDefs.value.filter((field) => field.required && !mapping[field.key]),
)
const mappedCount = computed(
  () => fieldDefs.value.filter((field) => Boolean(mapping[field.key])).length,
)
const columnOptions = computed(() => (preview.value?.columns ?? []).map((column) => ({ value: column, label: column })))
const importCount = computed(() => preview.value?.validRows ?? 0)
const totalRows = computed(() =>
  preview.value
    ? preview.value.validRows + preview.value.duplicateRows + preview.value.errorRows
    : 0,
)

function autoMap() {
  for (const key of Object.keys(mapping)) delete mapping[key]
  const columns = preview.value?.columns ?? []
  for (const field of fieldDefs.value) {
    const match = columns.find((column) =>
      field.keywords.some((keyword) => column.toLowerCase().includes(keyword.toLowerCase())),
    )
    mapping[field.key] = match ?? ''
  }
}

function resetAll() {
  step.value = 0
  file.value = null
  preview.value = null
  createdSource.value = null
  for (const key of Object.keys(mapping)) delete mapping[key]
  if (fileInput.value) fileInput.value.value = ''
}

function setFile(nextFile: File) {
  if (!/\.csv$/i.test(nextFile.name)) {
    toast.error('ไฟล์ไม่รองรับ', 'กรุณาใช้ไฟล์ CSV (.csv)')
    return
  }
  if (nextFile.size > 10 * 1024 * 1024) {
    toast.error('ไฟล์ใหญ่เกินไป', 'ขนาดไฟล์ต้องไม่เกิน 10 MB')
    return
  }
  file.value = nextFile
  preview.value = null
  createdSource.value = null
  step.value = 0
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const chosen = input.files?.[0]
  if (chosen) setFile(chosen)
}

function handleDrop(event: DragEvent) {
  dragActive.value = false
  const dropped = event.dataTransfer?.files?.[0]
  if (dropped) setFile(dropped)
}

function removeFile() {
  file.value = null
  preview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const sampleCsv: Record<DataType, string> = {
  sales: [
    'วันที่,ยอดขาย,จำนวนออเดอร์,ช่องทาง',
    '2026-10-18,42850,126,หน้าร้าน',
    '2026-10-19,38420,112,หน้าร้าน',
    '2026-10-20,45190,134,เดลิเวอรี',
    '2026-10-21,41760,121,หน้าร้าน',
    '2026-10-22,48920,142,เดลิเวอรี',
  ].join('\n'),
  materials: [
    'วันที่,วัตถุดิบ,จำนวน,ราคาต่อหน่วย,รวม',
    '2026-10-18,เมล็ดกาแฟคั่ว,12 กก.,680,8160',
    '2026-10-18,นมสด,48 ลิตร,52,2496',
    '2026-10-19,แก้วกระดาษ,1000 ใบ,2.8,2800',
    '2026-10-20,ไซรัป,24 ขวด,185,4440',
    '2026-10-21,ฝาแก้ว,1000 ใบ,1.1,1100',
  ].join('\n'),
  labor: [
    'วันที่,ชื่อพนักงาน,ตำแหน่ง,ชั่วโมงทำงาน,ค่าแรง',
    '2026-10-01,อนันต์,บาริสต้า,168,18500',
    '2026-10-01,มีน,บาริสต้า,160,17200',
    '2026-10-01,เจมส์,พนักงานเสิร์ฟ,152,15800',
    '2026-10-01,ใบเฟิร์น,แคชเชียร์,144,15200',
    '2026-10-01,ต้น,ผู้จัดการร้าน,176,26000',
  ].join('\n'),
  expenses: [
    'วันที่,หมวดหมู่,รายละเอียด,จำนวนเงิน',
    '2026-10-01,ค่าเช่า,ค่าเช่าพื้นที่,45000',
    '2026-10-03,ค่าน้ำค่าไฟ,ค่าไฟฟ้า,12480',
    '2026-10-05,การตลาด,โฆษณาออนไลน์,8500',
    '2026-10-08,ขนส่ง,ค่าส่งวัตถุดิบ,3200',
    '2026-10-12,ซ่อมบำรุง,ซ่อมเครื่องชงกาแฟ,4800',
  ].join('\n'),
}

function useSampleFile() {
  const label = dataTypeMeta[selectedType.value].label
  const sample = new File([`\uFEFF${sampleCsv[selectedType.value]}`], `sample-${selectedType.value}.csv`, {
    type: 'text/csv;charset=utf-8',
  })
  file.value = sample
  preview.value = null
  toast.info('เพิ่มไฟล์ตัวอย่างแล้ว', `ข้อมูลตัวอย่าง${label} 5 แถว`)
}

async function inspectFile() {
  if (!file.value || loadingPreview.value) return
  loadingPreview.value = true
  try {
    preview.value = await createImportPreview(file.value, selectedType.value)
    autoMap()
    step.value = 1
  } catch {
    toast.error('อ่านไฟล์ไม่สำเร็จ', 'ลองตรวจสอบรูปแบบไฟล์อีกครั้ง')
  } finally {
    loadingPreview.value = false
  }
}

function nextFromMapping() {
  if (missingRequired.value.length) {
    toast.error('จับคู่คอลัมน์ไม่ครบ', 'กรุณาเลือกคอลัมน์สำหรับช่องที่จำเป็น')
    return
  }
  step.value = 2
}

async function finishImport() {
  if (!preview.value || committing.value) return
  committing.value = true
  try {
    createdSource.value = await commitImport(preview.value)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    step.value = 3
    toast.success('นำเข้าข้อมูลสำเร็จ', `เพิ่ม ${formatNumber(createdSource.value.rowCount)} แถวเข้าสู่ระบบ`)
  } catch {
    toast.error('นำเข้าไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
  } finally {
    committing.value = false
  }
}

function back() {
  if (step.value === 2) step.value = 1
  else if (step.value === 1) step.value = 0
}

function downloadErrors() {
  if (!preview.value) return
  const content = [
    '\uFEFFแถว,คอลัมน์,ปัญหา',
    ...preview.value.errors.map((error) => `${error.row},${error.field},${error.message}`),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'rookar-import-errors.csv'
  anchor.click()
  URL.revokeObjectURL(url)
  toast.success('ดาวน์โหลดรายงานแล้ว')
}

watch(selectedType, () => {
  if (step.value > 0) {
    preview.value = null
    step.value = 0
  }
})
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="นำเข้าข้อมูล"
      description="นำเข้าไฟล์ CSV เพื่อให้ ROOKAR สรุปภาพรวมและหาโอกาสทางธุรกิจให้อัตโนมัติ"
    >
      <template #actions>
        <AppButton variant="secondary" @click="router.navigate({ to: '/app/data-sources' })">
          ดูแหล่งข้อมูลทั้งหมด
        </AppButton>
      </template>
    </PageHeader>

    <div class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10">
        <AppStepper :current="step" :steps="steps" compact />
      </div>
    </div>

    <section class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10">
      <Transition name="step" mode="out-in">
        <form v-if="step === 0" key="upload" @submit.prevent="inspectFile">
          <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 1 จาก 4</p>
          <h2 class="mt-2 text-h2 font-semibold tracking-tight text-ink">เลือกข้อมูลที่ต้องการนำเข้า</h2>
          <p class="mt-2 text-[13px] leading-relaxed text-muted">
            เริ่มจากประเภทข้อมูลที่ตรงกับไฟล์ของคุณ ระบบจะแนะนำการจับคู่คอลัมน์ให้อัตโนมัติ
          </p>

          <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              v-for="(meta, type) in dataTypeMeta"
              :key="type"
              type="button"
              :class="
                cn(
                  'flex items-start gap-3 rounded-2xl p-4 text-left transition-all duration-200 focus-visible:outline-none',
                  selectedType === type
                    ? 'bg-black text-white'
                    : 'bg-white/70 text-ink hover:bg-white',
                )
              "
              :aria-pressed="selectedType === type"
              @click="selectedType = type as DataType"
            >
              <component
                :is="meta.icon"
                :class="cn('mt-0.5 h-4 w-4 shrink-0 transition-colors', selectedType === type ? 'text-white' : 'text-neutral-500')"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1">
                <span :class="cn('block text-[13.5px] font-bold', selectedType === type ? 'text-white' : 'text-ink')">{{ meta.label }}</span>
                <span :class="cn('mt-1 block text-[11px] font-medium leading-relaxed', selectedType === type ? 'text-neutral-300' : 'text-muted')">{{ meta.description }}</span>
              </span>
              <CheckCircle2 v-if="selectedType === type" class="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            </button>
          </div>

          <div
            :class="
              cn(
                'mt-5 rounded-2xl p-8 text-center transition-colors',
                dragActive ? 'bg-brand-50' : 'bg-[#f4f5f7]',
              )
            "
            role="button"
            tabindex="0"
            aria-label="เลือกไฟล์หรือลากไฟล์มาวาง"
            @click="fileInput?.click()"
            @keydown.enter.prevent="fileInput?.click()"
            @keydown.space.prevent="fileInput?.click()"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop.prevent="handleDrop"
          >
            <input
              id="import-file"
              ref="fileInput"
              type="file"
              accept=".csv"
              class="sr-only"
              aria-label="เลือกไฟล์ CSV"
              @change="onFileChange"
              @click.stop
            />
            <template v-if="file">
              <div class="mx-auto flex max-w-md items-center gap-3 bg-surface p-3 text-left">
                <FileSpreadsheet class="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[13px] font-medium text-ink">{{ file.name }}</p>
                  <p class="mt-0.5 text-[11px] text-muted">{{ formatFileSize(file.size) }} · {{ dataTypeMeta[selectedType].label }}</p>
                </div>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
                  aria-label="เอาไฟล์ออก"
                  @click.stop="removeFile"
                  @keydown.stop
                >
                  <X class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                class="mt-3 text-[12px] font-medium text-brand-700 underline-offset-2 hover:underline"
                @click.stop="fileInput?.click()"
              >
                เลือกไฟล์อื่น
              </button>
            </template>
            <template v-else>
              <CloudUpload class="mx-auto h-7 w-7 text-brand-400" aria-hidden="true" />
              <p class="mt-3 text-[13px] font-medium text-ink">
                ลากไฟล์มาวาง หรือ <span class="text-brand-700 underline underline-offset-2">เลือกไฟล์</span>
              </p>
              <p class="mt-1 text-[11.5px] text-muted">รองรับไฟล์ CSV · ขนาดไม่เกิน 10 MB</p>
            </template>
          </div>

          <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="inline-flex h-10 items-center gap-1.5 text-[12px] font-medium text-muted transition hover:text-brand-700"
              @click="useSampleFile"
            >
              <Sparkles class="h-4 w-4 text-accent-600" aria-hidden="true" />
              ยังไม่มีไฟล์? ลองใช้ไฟล์ตัวอย่าง
            </button>
            <p class="text-[11px] text-muted">ข้อมูลจะถูกเก็บในเครื่องของคุณระหว่างทดลอง</p>
          </div>

          <div class="mt-6 flex justify-end">
            <AppButton type="submit" size="lg" :disabled="!file" :loading="loadingPreview">
              ตรวจสอบไฟล์
              <template #right>
                <ArrowRight v-if="!loadingPreview" class="h-4 w-4" aria-hidden="true" />
              </template>
            </AppButton>
          </div>
        </form>

        <form v-else-if="step === 1" key="mapping" @submit.prevent="nextFromMapping">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 2 จาก 4</p>
              <h2 class="mt-2 text-h2 font-semibold tracking-tight text-ink">จับคู่คอลัมน์</h2>
              <p class="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
                ตรวจสอบว่าคอลัมน์ในไฟล์ตรงกับข้อมูลที่ ROOKAR ต้องใช้
                ระบบจับคู่ให้แล้ว {{ mappedCount }} จาก {{ fieldDefs.length }} ช่อง
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-10 w-fit items-center gap-1.5 rounded-lg bg-ink-50 px-3 text-[12px] font-medium text-muted transition hover:bg-brand-50 hover:text-brand-700"
              @click="autoMap"
            >
              <Wand2 class="h-4 w-4" aria-hidden="true" />
              จับคู่อัตโนมัติ
            </button>
          </div>

          <div class="mt-5 overflow-hidden">
            <div class="grid grid-cols-[1fr_1.2fr] gap-3 bg-canvas px-4 py-2.5 text-[11px] font-medium text-muted">
              <span>ข้อมูลที่ต้องใช้</span>
              <span>คอลัมน์ในไฟล์</span>
            </div>
            <div>
              <div
                v-for="field in fieldDefs"
                :key="field.key"
                class="grid grid-cols-1 items-center gap-2 px-4 py-3 odd:bg-surface even:bg-canvas/50 sm:grid-cols-[1fr_1.2fr] sm:gap-3"
              >
                <div class="flex items-center gap-1.5">
                  <span class="text-[12.5px] font-medium text-ink-soft">{{ field.label }}</span>
                  <span v-if="field.required" class="text-[11px] font-medium text-danger">จำเป็น</span>
                  <span v-else class="text-[11px] text-muted">ไม่บังคับ</span>
                </div>
                <select
                  v-model="mapping[field.key]"
                  class="h-10 w-full rounded-lg px-2.5 text-[12px] text-ink focus:bg-ink-100 focus:outline-none"
                  :class="field.required && !mapping[field.key] ? 'bg-danger-soft/40' : 'bg-ink-50'"
                  :aria-label="`เลือกคอลัมน์สำหรับ ${field.label}`"
                >
                  <option value="">— ไม่ใช้คอลัมน์นี้ —</option>
                  <option v-for="option in columnOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div
            v-if="missingRequired.length"
            class="mt-3 flex items-start gap-2 bg-warning-soft/70 px-3.5 py-3 text-[12px] leading-relaxed text-warning"
          >
            <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ยังไม่ได้จับคู่ {{ missingRequired.map((field) => field.label).join(', ') }}
          </div>

          <div class="mt-6 flex items-center justify-between gap-3 pt-5">
            <AppButton variant="ghost" size="lg" @click="back">
              <template #left>
                <ArrowLeft class="h-4 w-4" aria-hidden="true" />
              </template>
              ย้อนกลับ
            </AppButton>
            <AppButton type="submit" size="lg">
              ตรวจสอบข้อมูล
              <template #right>
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </template>
            </AppButton>
          </div>
        </form>

        <form v-else-if="step === 2 && preview" key="review" @submit.prevent="finishImport">
          <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 3 จาก 4</p>
          <h2 class="mt-2 text-h2 font-semibold tracking-tight text-ink">ตรวจสอบก่อนนำเข้า</h2>
          <p class="mt-2 text-[13px] leading-relaxed text-muted">
            พบ {{ formatNumber(totalRows) }} แถวในไฟล์ {{ preview.fileName }} ตรวจสอบแถวที่มีปัญหาให้ครบก่อนยืนยัน
          </p>

          <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div class="rounded-2xl bg-neutral-800 p-3 text-white">
              <p class="text-[11px] text-neutral-300">แถวทั้งหมด</p>
              <p class="tabular mt-1 text-lg font-semibold text-white">{{ formatNumber(preview.totalRows) }}</p>
            </div>
            <div class="rounded-2xl bg-black p-3 text-white">
              <p class="text-[11px] text-neutral-300">พร้อมนำเข้า</p>
              <p class="tabular mt-1 text-lg font-semibold text-white">{{ formatNumber(preview.validRows) }}</p>
            </div>
            <div class="rounded-2xl bg-amber-800 p-3 text-white">
              <p class="text-[11px] text-amber-200">ข้อมูลซ้ำ</p>
              <p class="tabular mt-1 text-lg font-semibold text-white">{{ formatNumber(preview.duplicateRows) }}</p>
            </div>
            <div class="rounded-2xl bg-rose-800 p-3 text-white">
              <p class="text-[11px] text-rose-200">ผิดรูปแบบ</p>
              <p class="tabular mt-1 text-lg font-semibold text-white">{{ formatNumber(preview.errorRows) }}</p>
            </div>
          </div>

          <div v-if="preview.errors.length" class="mt-4 bg-danger-soft/50 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-2">
                <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <div>
                  <p class="text-[12.5px] font-medium text-danger">มี {{ preview.errors.length }} แถวที่ต้องตรวจสอบ</p>
                  <p class="mt-0.5 text-[11px] leading-relaxed text-danger/80">ระบบจะข้ามแถวเหล่านี้ และนำเข้าเฉพาะแถวที่ถูกต้อง</p>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex h-10 w-fit shrink-0 items-center gap-1.5 rounded-lg bg-surface px-3 text-[11.5px] font-medium text-danger transition hover:bg-danger-soft"
                @click="downloadErrors"
              >
                <Download class="h-3.5 w-3.5" aria-hidden="true" />
                ดาวน์โหลดรายงาน
              </button>
            </div>
            <ul class="mt-3 space-y-1.5">
              <li v-for="error in preview.errors" :key="`${error.row}-${error.field}`" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-danger/90">
                <span class="bg-surface/70 px-1.5 py-0.5 font-medium">แถว {{ error.row }}</span>
                <span class="font-medium">{{ error.field }}</span>
                <span class="text-danger/75">{{ error.message }}</span>
              </li>
            </ul>
          </div>

          <div class="mt-4 overflow-hidden">
            <div class="flex items-center justify-between bg-canvas px-3.5 py-2">
              <p class="text-[11px] font-medium text-muted">ตัวอย่างข้อมูล · {{ preview.rows.length }} แถวแรก</p>
              <span class="text-[11px] text-muted">{{ preview.columns.length }} คอลัมน์</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[560px] text-left">
                <caption class="sr-only">ตัวอย่างข้อมูลที่นำเข้า</caption>
                <thead>
                  <tr class="bg-canvas text-[11px] font-medium text-muted">
                    <th v-for="column in preview.columns" :key="column" class="whitespace-nowrap px-3 py-2 font-medium">
                      {{ column }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in preview.rows" :key="index" class="odd:bg-surface even:bg-canvas/50">
                    <td v-for="column in preview.columns" :key="column" class="whitespace-nowrap px-3 py-2 text-[11.5px] text-ink-soft">
                      {{ row[column] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 flex items-start gap-2.5 bg-brand-50 px-3.5 py-3">
            <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
            <p class="text-[11.5px] leading-relaxed text-brand-900/80">
              ข้อมูลจะถูกเพิ่มเป็นแหล่งข้อมูลใหม่ และภาพรวมจะอัปเดตทันทีหลังนำเข้า
            </p>
          </div>

          <div class="mt-6 flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <AppButton variant="ghost" size="lg" :disabled="committing" @click="back">
              <template #left>
                <ArrowLeft class="h-4 w-4" aria-hidden="true" />
              </template>
              ย้อนกลับ
            </AppButton>
            <AppButton type="submit" size="lg" :loading="committing" :disabled="importCount === 0">
              นำเข้า {{ formatNumber(importCount) }} แถว
              <template #right>
                <FileUp v-if="!committing" class="h-4 w-4" aria-hidden="true" />
              </template>
            </AppButton>
          </div>
        </form>

        <div v-else-if="step === 3" key="done" class="py-4 text-center">
          <CheckCircle2 class="mx-auto h-9 w-9 text-success" aria-hidden="true" />
          <h2 class="mt-5 text-h2 font-semibold tracking-tight text-ink">นำเข้าข้อมูลสำเร็จ</h2>
          <p class="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">
            เพิ่ม <span class="font-medium text-ink">{{ formatNumber(createdSource?.rowCount ?? 0) }} แถว</span>
            จาก {{ createdSource?.fileName }} เข้าสู่ระบบแล้ว ภาพรวมและคำแนะนำของ AI จะอัปเดตให้อัตโนมัติ
          </p>

          <div class="mx-auto mt-5 max-w-sm bg-canvas p-4 text-left">
            <div class="flex items-center gap-3">
              <FileSpreadsheet class="h-4 w-4 text-brand-400" aria-hidden="true" />
              <div class="min-w-0">
                <p class="truncate text-[12.5px] font-medium text-ink">{{ createdSource?.name }}</p>
                <p class="mt-0.5 text-[11px] text-muted">{{ formatNumber(createdSource?.rowCount ?? 0) }} แถว · พร้อมวิเคราะห์</p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <AppButton size="lg" @click="router.navigate({ to: '/app' })">
              ไปที่ภาพรวม
              <template #right>
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </template>
            </AppButton>
            <AppButton variant="secondary" size="lg" @click="resetAll">
              <template #left>
                <RotateCcw class="h-4 w-4" aria-hidden="true" />
              </template>
              นำเข้าอีกไฟล์
            </AppButton>
          </div>
          <button
            type="button"
            class="mt-4 text-[12px] font-medium text-brand-700 underline-offset-2 hover:underline"
            @click="router.navigate({ to: '/app/data-sources' })"
          >
            ดูแหล่งข้อมูลทั้งหมด
          </button>
        </div>
      </Transition>
      </div>
    </section>

    <p v-if="step < 3" class="pt-2 text-center text-[11.5px] leading-relaxed text-muted">
      ข้อมูลในเวอร์ชันทดลองถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น · ลบได้ทุกเมื่อจากหน้าแหล่งข้อมูล
    </p>
  </div>
</template>

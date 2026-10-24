<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CircleAlert, Download, FileSpreadsheet, Loader2, Plus, Search, Trash2, Upload } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { deleteSource, listSources, seedSampleSources } from '@/lib/mockApi'
import { formatNumber, timeAgo } from '@/lib/format'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/cn'
import type { DataSource, DataType } from '@/types'

const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()
const search = ref('')
const typeFilter = ref<'all' | DataType>('all')
const deleteTarget = ref<DataSource | null>(null)
const seedLoading = ref(false)

const { data: sources, isPending } = useQuery({
  queryKey: ['sources'],
  queryFn: listSources,
})

const deleteMutation = useMutation({
  mutationFn: (id: string) => deleteSource(id),
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    toast.success('ลบแหล่งข้อมูลแล้ว')
    deleteTarget.value = null
  },
  onError: () => {
    toast.error('ลบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
  },
})

const qualityMeta = {
  complete: { label: 'ครบถ้วน', tone: 'success' as const },
  partial: { label: 'ควรตรวจสอบ', tone: 'warning' as const },
  duplicate: { label: 'มีข้อมูลซ้ำ', tone: 'danger' as const },
}

const typeMeta: Record<DataType, { label: string; className: string }> = {
  sales: { label: 'ยอดขาย', className: 'bg-black text-white font-semibold' },
  materials: { label: 'วัตถุดิบ', className: 'bg-neutral-800 text-white font-semibold' },
  labor: { label: 'ค่าแรง', className: 'bg-neutral-800 text-white font-semibold' },
  expenses: { label: 'ค่าใช้จ่าย', className: 'bg-neutral-800 text-white font-semibold' },
}

const filters: { value: 'all' | DataType; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'sales', label: 'ยอดขาย' },
  { value: 'materials', label: 'วัตถุดิบ' },
  { value: 'labor', label: 'ค่าแรง' },
  { value: 'expenses', label: 'ค่าใช้จ่าย' },
]

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return (sources.value ?? []).filter((source) => {
    const matchesType = typeFilter.value === 'all' || source.type === typeFilter.value
    const matchesQuery =
      !query ||
      source.name.toLowerCase().includes(query) ||
      source.typeLabel.toLowerCase().includes(query) ||
      source.fileName.toLowerCase().includes(query)
    return matchesType && matchesQuery
  })
})

const totalRows = computed(() => (sources.value ?? []).reduce((sum, source) => sum + source.rowCount, 0))
const completeCount = computed(() => (sources.value ?? []).filter((source) => source.quality === 'complete').length)
const attentionCount = computed(() => (sources.value ?? []).filter((source) => source.quality !== 'complete').length)
const lastUpdated = computed(() => {
  const sorted = [...(sources.value ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  return sorted[0]?.updatedAt
})

async function confirmDelete() {
  if (!deleteTarget.value) return
  await deleteMutation.mutateAsync(deleteTarget.value.id)
}

async function loadSample() {
  if (seedLoading.value) return
  seedLoading.value = true
  try {
    await seedSampleSources()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    toast.success('เพิ่มข้อมูลตัวอย่างแล้ว')
  } finally {
    seedLoading.value = false
  }
}

function downloadTemplate() {
  const content = [
    '\uFEFFวันที่,ยอดขาย,จำนวนออเดอร์,ช่องทาง',
    '2026-10-01,42850,126,หน้าร้าน',
    '2026-10-02,39420,112,เดลิเวอรี',
    '2026-10-03,45190,134,หน้าร้าน',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'rookar-template-sales.csv'
  anchor.click()
  URL.revokeObjectURL(url)
  toast.success('ดาวน์โหลดเทมเพลตแล้ว', 'เปิดด้วย Excel หรือ Google Sheets ได้เลย')
}
</script>

<template>
  <PageHeader
    title="แหล่งข้อมูล"
    description="ทุกไฟล์ที่ ROOKAR ใช้วิเคราะห์อยู่ที่นี่ ตรวจสอบความครบถ้วนและอัปเดตได้ทุกเมื่อ"
  >
    <template #actions>
      <AppButton variant="secondary" @click="downloadTemplate">
        <template #left>
          <Download class="h-4 w-4" aria-hidden="true" />
        </template>
        ดาวน์โหลดเทมเพลต
      </AppButton>
      <AppButton @click="router.navigate({ to: '/app/import' })">
        <template #left>
          <Plus class="h-4 w-4" aria-hidden="true" />
        </template>
        นำเข้าข้อมูล
      </AppButton>
    </template>
  </PageHeader>

  <dl class="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
    <div class="card-fade p-4">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <dt class="text-[11.5px] font-medium text-ink-soft">แหล่งข้อมูลทั้งหมด</dt>
        <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-ink">{{ sources?.length ?? 0 }}</dd>
      </div>
    </div>
    <div class="card-fade p-4">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <dt class="text-[11.5px] font-medium text-ink-soft">ข้อมูลรวม</dt>
        <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-ink">{{ formatNumber(totalRows) }} <span class="text-[11px] font-normal text-muted">แถว</span></dd>
      </div>
    </div>
    <div class="card-fade p-4">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <dt class="text-[11.5px] font-medium text-ink-soft">พร้อมใช้งาน</dt>
        <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-success">{{ completeCount }} <span class="text-[11px] font-normal text-muted">ชุด</span></dd>
      </div>
    </div>
    <div class="card-fade p-4">
      <div class="relative z-10 flex h-full flex-col justify-between">
        <dt class="text-[11.5px] font-medium text-ink-soft">ต้องตรวจสอบ</dt>
        <dd class="tabular mt-3 text-2xl font-bold tracking-tight" :class="attentionCount ? 'text-warning' : 'text-ink'">
          {{ attentionCount }} <span class="text-[11px] font-normal text-muted">ชุด</span>
        </dd>
      </div>
    </div>
  </dl>

  <section class="card-fade-static">
    <div class="relative z-10">
      <form class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" role="search" @submit.prevent>
        <div class="relative w-full sm:max-w-xs">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            placeholder="ค้นหาไฟล์หรือชื่อข้อมูล…"
            class="h-10 w-full rounded-full bg-white pl-9 pr-3 text-[12.5px] text-ink placeholder:text-faint focus:outline-none"
            aria-label="ค้นหาแหล่งข้อมูล"
          />
        </div>
        <div class="flex gap-1 overflow-x-auto" role="group" aria-label="กรองตามประเภทข้อมูล">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            :class="
              cn(
                'h-10 shrink-0 rounded-full px-4 text-[12px] font-medium transition',
                typeFilter === filter.value
                  ? 'bg-ink text-white'
                  : 'text-muted hover:bg-white hover:text-ink',
              )
            "
            :aria-pressed="typeFilter === filter.value"
            @click="typeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </form>

    <div v-if="isPending" class="p-4">
      <div v-for="index in 4" :key="index" class="skeleton mb-2 h-14 rounded-2xl" />
    </div>

    <div v-else-if="!sources?.length" class="px-5 py-14 text-center">
      <FileSpreadsheet class="mx-auto h-7 w-7 text-brand-400" aria-hidden="true" />
      <h2 class="mt-4 text-base font-semibold text-ink">ยังไม่มีแหล่งข้อมูล</h2>
      <p class="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">
        เริ่มจากไฟล์เดียวก็พอ ไม่ว่าจะเป็นยอดขายรายวันหรือต้นทุนวัตถุดิบ
      </p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <AppButton size="sm" @click="router.navigate({ to: '/app/import' })">
          <template #left>
            <Upload class="h-3.5 w-3.5" aria-hidden="true" />
          </template>
          นำเข้าข้อมูล
        </AppButton>
        <AppButton variant="secondary" size="sm" :loading="seedLoading" @click="loadSample">
          ใช้ข้อมูลตัวอย่าง
        </AppButton>
      </div>
    </div>

    <div v-else-if="filtered.length === 0" class="px-5 py-12 text-center">
      <Search class="mx-auto h-6 w-6 text-faint" aria-hidden="true" />
      <p class="mt-2 text-sm font-medium text-ink">ไม่พบข้อมูลที่ตรงกับคำค้น</p>
      <button
        type="button"
        class="mt-2 text-[12.5px] font-medium text-brand-700 hover:underline"
        @click="search = ''; typeFilter = 'all'"
      >
        ล้างตัวกรอง
      </button>
    </div>

    <div v-else class="hidden md:block">
      <table class="w-full text-left">
        <caption class="sr-only">รายการแหล่งข้อมูลทางธุรกิจ</caption>
        <thead>
          <tr class="bg-canvas text-[11px] font-medium text-muted">
            <th class="px-4 py-3 font-medium">แหล่งข้อมูล</th>
            <th class="px-3 py-3 font-medium">ประเภท</th>
            <th class="px-3 py-3 text-right font-medium">จำนวนแถว</th>
            <th class="px-3 py-3 font-medium">คุณภาพ</th>
            <th class="px-3 py-3 font-medium">อัปเดต</th>
            <th class="w-14 px-3 py-3"><span class="sr-only">การจัดการ</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="source in filtered"
            :key="source.id"
            class="odd:bg-surface even:bg-canvas/50 cursor-pointer transition-colors hover:bg-neutral-100/70"
            @click="router.navigate({ to: `/app/data-sources/${source.id}` })"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <FileSpreadsheet class="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="truncate text-[12.5px] font-semibold text-ink hover:underline">{{ source.name }}</p>
                  <p class="mt-0.5 max-w-[280px] truncate text-[11px] text-muted">
                    {{ source.fileName }} · {{ source.period }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-3 py-3">
              <span :class="cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
            </td>
            <td class="tabular px-3 py-3 text-right text-[12.5px] text-ink-soft">{{ formatNumber(source.rowCount) }}</td>
            <td class="px-3 py-3">
              <AppBadge :tone="qualityMeta[source.quality].tone" dot>{{ qualityMeta[source.quality].label }}</AppBadge>
            </td>
            <td class="px-3 py-3 text-[12px] text-muted">{{ timeAgo(source.updatedAt) }}</td>
            <td class="px-3 py-3">
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
                :aria-label="`ลบ ${source.name}`"
                @click="deleteTarget = source"
              >
                <Trash2 class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul v-if="filtered.length && !isPending" class="md:hidden">
      <li
        v-for="source in filtered"
        :key="source.id"
        class="odd:bg-surface even:bg-canvas/50 cursor-pointer transition-colors hover:bg-neutral-100/70"
        @click="router.navigate({ to: `/app/data-sources/${source.id}` })"
      >
        <div class="flex items-start gap-3 p-4">
          <FileSpreadsheet class="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-semibold text-ink">{{ source.name }}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted">{{ source.fileName }} · {{ source.period }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span :class="cn('rounded-full px-2 py-0.5 text-[10.5px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
              <AppBadge :tone="qualityMeta[source.quality].tone" dot>{{ qualityMeta[source.quality].label }}</AppBadge>
              <span class="text-[10.5px] text-muted">{{ formatNumber(source.rowCount) }} แถว · {{ timeAgo(source.updatedAt) }}</span>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
            :aria-label="`ลบ ${source.name}`"
            @click="deleteTarget = source"
          >
            <Trash2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </li>
    </ul>

    <div v-if="filtered.length && sources?.length" class="flex flex-col gap-1 bg-canvas px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>แสดง {{ filtered.length }} จาก {{ sources.length }} แหล่งข้อมูล</p>
      <p v-if="lastUpdated">อัปเดตล่าสุด {{ timeAgo(lastUpdated) }}</p>
    </div>

    <div v-if="attentionCount" class="flex items-center gap-2.5 rounded-2xl bg-[#f4f5f7] px-4 py-3 text-[12px] text-ink">
      <CircleAlert class="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      <p class="leading-relaxed">
        มี {{ attentionCount }} ชุดที่ควรตรวจสอบ ข้อมูลยังใช้วิเคราะห์ได้ แต่ตัวเลขอาจคลาดเคลื่อน
      </p>
    </div>
    </div>
  </section>

  <AppModal
    :open="Boolean(deleteTarget)"
    title="ลบแหล่งข้อมูลนี้?"
    :description="`${deleteTarget?.name ?? ''} จะถูกนำออกจากการวิเคราะห์ทั้งหมด การลบไม่สามารถย้อนกลับได้`"
    size="sm"
    @update:open="(value) => { if (!value) deleteTarget = null }"
  >
    <div class="flex items-start gap-3 bg-danger-soft/60 px-3.5 py-3 text-[12.5px] leading-relaxed text-danger">
      <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ภาพรวมและคำแนะนำของ AI อาจเปลี่ยนหลังลบข้อมูลชุดนี้
    </div>
    <template #footer>
      <AppButton variant="secondary" @click="deleteTarget = null">ยกเลิก</AppButton>
      <AppButton variant="danger" :loading="deleteMutation.isPending.value" @click="confirmDelete">
        <template #left>
          <Loader2 v-if="deleteMutation.isPending.value" class="h-4 w-4 animate-spin" aria-hidden="true" />
        </template>
        ลบแหล่งข้อมูล
      </AppButton>
    </template>
  </AppModal>
</template>

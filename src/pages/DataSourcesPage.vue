<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Download, FileSpreadsheet, ListFilter, Loader2, Plus, Search, Trash2, Upload } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
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

const page = ref(1)
const pageSize = 10

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

const typeCounts = computed<Record<DataType, number>>(() => {
  const counts: Record<DataType, number> = { sales: 0, materials: 0, labor: 0, expenses: 0 }
  for (const source of sources.value ?? []) counts[source.type] += 1
  return counts
})
const availableFilters = computed(() => [
  { value: 'all' as const, label: 'ทั้งหมด', count: sources.value?.length ?? 0 },
  ...(Object.keys(typeMeta) as DataType[])
    .filter((type) => typeCounts.value[type] > 0)
    .map((type) => ({ value: type, label: typeMeta[type].label, count: typeCounts.value[type] })),
])
const activeFilter = computed(
  () => availableFilters.value.find((filter) => filter.value === typeFilter.value) ?? availableFilters.value[0],
)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pagedSources = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const rangeStart = computed(() => (filtered.value.length === 0 ? 0 : (page.value - 1) * pageSize + 1))
const rangeEnd = computed(() => Math.min(page.value * pageSize, filtered.value.length))

const totalRows = computed(() => (sources.value ?? []).reduce((sum, source) => sum + source.rowCount, 0))
const completeCount = computed(() => (sources.value ?? []).filter((source) => source.quality === 'complete').length)
const attentionCount = computed(() => (sources.value ?? []).filter((source) => source.quality !== 'complete').length)
watch([search, typeFilter], () => {
  page.value = 1
})
watch(availableFilters, (filters) => {
  if (typeFilter.value !== 'all' && !filters.some((filter) => filter.value === typeFilter.value)) {
    typeFilter.value = 'all'
  }
})
watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

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

  <section class="card-fade-static data-table-surface">
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
        <div class="flex items-center gap-2">
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-white transition hover:bg-black"
              aria-label="กรองตามประเภทข้อมูล"
            >
              <ListFilter class="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
              {{ activeFilter.label }}
              <span class="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                {{ activeFilter.count }}
              </span>
              <ChevronDown class="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              align="end"
              :side-offset="8"
              class="z-[70] max-h-72 w-60 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] focus:outline-none"
            >
              <DropdownMenuLabel class="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                กรองตามประเภท
              </DropdownMenuLabel>
              <DropdownMenuItem
                v-for="filter in availableFilters"
                :key="filter.value"
                class="flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium text-ink outline-none transition data-[highlighted]:bg-neutral-100"
                @select="typeFilter = filter.value"
              >
                <span class="flex-1">{{ filter.label }}</span>
                <span class="tabular text-[10.5px] text-muted">{{ filter.count }}</span>
                <Check v-if="typeFilter === filter.value" class="h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
        <AppButton size="sm" @click="router.navigate({ to: '/app/import' })">
          <template #left>
            <Plus class="h-3.5 w-3.5" aria-hidden="true" />
          </template>
          นำเข้าข้อมูล
        </AppButton>
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
            v-for="source in pagedSources"
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
              <span :class="cn('inline-flex h-[22px] w-28 items-center justify-center rounded-full px-2.5 text-center text-[11px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
            </td>
            <td class="tabular px-3 py-3 text-right text-[12.5px] text-ink-soft">{{ formatNumber(source.rowCount) }}</td>
            <td class="px-3 py-3">
              <div class="flex flex-wrap items-center gap-1.5">
                <AppBadge v-if="source.isDemo" tone="warning">ตัวอย่าง</AppBadge>
                <AppBadge :tone="qualityMeta[source.quality].tone">{{ qualityMeta[source.quality].label }}</AppBadge>
              </div>
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
        v-for="source in pagedSources"
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
              <span :class="cn('inline-flex h-[22px] w-28 items-center justify-center rounded-full px-2.5 text-center text-[11px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
              <AppBadge v-if="source.isDemo" tone="warning">ตัวอย่าง</AppBadge>
              <AppBadge :tone="qualityMeta[source.quality].tone">{{ qualityMeta[source.quality].label }}</AppBadge>
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

    <div v-if="filtered.length && sources?.length" class="flex flex-col gap-2 bg-canvas px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        แสดง {{ rangeStart }}–{{ rangeEnd }} จาก {{ filtered.length }} รายการ
        <span v-if="lastUpdated"> · อัปเดตล่าสุด {{ timeAgo(lastUpdated) }}</span>
      </p>
      <div v-if="pageCount > 1" class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-medium text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
          :disabled="page === 1"
          aria-label="หน้าก่อนหน้า"
          @click="page -= 1"
        >
          <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
          ก่อนหน้า
        </button>
        <span class="tabular px-1 text-ink-soft">{{ page }} / {{ pageCount }}</span>
        <button
          type="button"
          class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 font-medium text-ink transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
          :disabled="page === pageCount"
          aria-label="หน้าถัดไป"
          @click="page += 1"
        >
          ถัดไป
          <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
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

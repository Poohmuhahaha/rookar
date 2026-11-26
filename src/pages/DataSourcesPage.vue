<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Download, FileSpreadsheet, ListFilter, Loader2, Plus, Search, Trash2, Upload } from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import IndustryPicker from '@/components/ui/IndustryPicker.vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import { deleteSource, listSources, setSourceIndustry } from '@/lib/mockApi'
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
const assigningId = ref<string | null>(null)

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

async function assignIndustry(source: DataSource, industryId: string | null) {
  if ((source.industryId ?? null) === industryId || assigningId.value) return
  assigningId.value = source.id
  try {
    await setSourceIndustry(source.id, industryId)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    toast.success(industryId ? 'อัปเดตอุตสาหกรรมแล้ว' : 'นำไฟล์ออกจากอุตสาหกรรมแล้ว')
  } catch {
    toast.error('อัปเดตอุตสาหกรรมไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
  } finally {
    assigningId.value = null
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
      <div class="relative w-full sm:w-64">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          v-model="search"
          type="search"
          placeholder="ค้นหาไฟล์หรือชื่อข้อมูล…"
          class="h-10 w-full rounded-full bg-surface pl-9 pr-3 text-[12.5px] text-ink placeholder:text-faint transition-colors focus:bg-neutral-200 focus:outline-none"
          aria-label="ค้นหาแหล่งข้อมูล"
        />
      </div>
      <AppButton variant="secondary" class="w-full sm:w-auto" @click="downloadTemplate">
        <template #left>
          <Download class="h-4 w-4" aria-hidden="true" />
        </template>
        ดาวน์โหลดเทมเพลต
      </AppButton>
    </template>
  </PageHeader>

  <div class="grid gap-5 xl:grid-cols-[200px_minmax(0,1fr)]">
      <form class="order-1 mb-3 flex flex-wrap items-center justify-start gap-2 sm:justify-end xl:col-start-2 xl:row-start-1 xl:mb-0" role="search" @submit.prevent>
    <div class="flex w-full items-center gap-2 sm:w-auto">
    <DropdownMenuRoot>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-white transition hover:bg-black sm:flex-none"
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
          align="start"
          :side-offset="8"
          class="z-[70] max-h-72 w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06] focus:outline-none sm:w-60"
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
    <AppButton size="sm" class="flex-1 sm:flex-none" @click="router.navigate({ to: '/app/import' })">
      <template #left>
        <Plus class="h-3.5 w-3.5" aria-hidden="true" />
      </template>
      นำเข้าข้อมูล
    </AppButton>
    </div>
  </form>

    <dl class="order-2 grid grid-cols-2 gap-x-5 gap-y-5 rounded-[24px] bg-surface p-4 sm:grid-cols-4 sm:gap-x-0 sm:gap-y-0 sm:p-5 xl:col-start-1 xl:row-start-2 xl:grid-cols-1 xl:gap-y-0 xl:self-start">
    <div class="relative flex flex-col justify-between sm:px-5 sm:first:pl-0 sm:last:pr-0 xl:px-0 xl:py-4 xl:first:pt-0 xl:last:pb-0">
      <dt class="text-[11.5px] font-medium text-ink-soft">แหล่งข้อมูลทั้งหมด</dt>
      <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-ink xl:mt-1.5">{{ sources?.length ?? 0 }}</dd>
    </div>
    <div class="relative flex flex-col justify-between sm:px-5 xl:px-0 xl:py-4">
      <span class="absolute left-0 top-1/2 hidden h-9 w-px -translate-y-1/2 bg-black/10 sm:block xl:hidden" aria-hidden="true" />
      <span class="absolute inset-x-0 top-0 hidden h-px bg-black/10 xl:block" aria-hidden="true" />
      <dt class="text-[11.5px] font-medium text-ink-soft">ข้อมูลรวม</dt>
      <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-ink xl:mt-1.5">{{ formatNumber(totalRows) }} <span class="text-[11px] font-normal text-muted">แถว</span></dd>
    </div>
    <div class="relative flex flex-col justify-between sm:px-5 xl:px-0 xl:py-4">
      <span class="absolute left-0 top-1/2 hidden h-9 w-px -translate-y-1/2 bg-black/10 sm:block xl:hidden" aria-hidden="true" />
      <span class="absolute inset-x-0 top-0 hidden h-px bg-black/10 xl:block" aria-hidden="true" />
      <dt class="text-[11.5px] font-medium text-ink-soft">พร้อมใช้งาน</dt>
      <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-success xl:mt-1.5">{{ completeCount }} <span class="text-[11px] font-normal text-muted">ชุด</span></dd>
    </div>
    <div class="relative flex flex-col justify-between sm:px-5 sm:last:pr-0 xl:px-0 xl:py-4 xl:last:pb-0">
      <span class="absolute left-0 top-1/2 hidden h-9 w-px -translate-y-1/2 bg-black/10 sm:block xl:hidden" aria-hidden="true" />
      <span class="absolute inset-x-0 top-0 hidden h-px bg-black/10 xl:block" aria-hidden="true" />
      <dt class="text-[11.5px] font-medium text-ink-soft">ต้องตรวจสอบ</dt>
      <dd class="tabular mt-3 text-2xl font-bold tracking-tight xl:mt-1.5" :class="attentionCount ? 'text-warning' : 'text-ink'">
        {{ attentionCount }} <span class="text-[11px] font-normal text-muted">ชุด</span>
      </dd>
    </div>
    </dl>

  <section class="order-3 min-w-0 card-fade-static xl:col-start-2 xl:row-start-2">
    <div class="relative z-10">

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

    <div v-else class="hidden overflow-x-auto md:block">
      <table class="w-full min-w-[720px] table-fixed text-left">
        <caption class="sr-only">รายการแหล่งข้อมูลทางธุรกิจ</caption>
        <thead>
          <tr class="border-b border-ink-100 bg-surface text-[12px] font-semibold text-ink-soft">
            <th class="whitespace-nowrap px-5 py-3.5">แหล่งข้อมูล</th>
            <th class="w-[120px] whitespace-nowrap px-3 py-3.5">ประเภท</th>
            <th class="w-[110px] whitespace-nowrap px-3 py-3.5 text-right">จำนวนแถว</th>
            <th class="w-[140px] whitespace-nowrap px-3 py-3.5">คุณภาพ</th>
            <th class="hidden w-[130px] whitespace-nowrap px-3 py-3.5 2xl:table-cell">อัปเดต</th>
            <th class="w-16 px-3 py-3.5"><span class="sr-only">การจัดการ</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100/70">
          <tr
            v-for="source in pagedSources"
            :key="source.id"
            class="cursor-pointer bg-surface transition-colors hover:bg-[#eceef1]"
            @click="router.navigate({ to: `/app/data-sources/${source.id}` })"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                  <FileSpreadsheet class="h-4 w-4 text-ink-soft" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <p class="truncate text-[13.5px] font-semibold text-ink">{{ source.name }}</p>
                  <p class="mt-0.5 max-w-[320px] truncate text-[12px] text-muted">
                    {{ source.fileName }} · {{ source.period }}
                  </p>
                  <div class="mt-1.5">
                    <IndustryPicker
                      :model-value="source.industryId ?? null"
                      :disabled="assigningId === source.id"
                      @update:model-value="assignIndustry(source, $event)"
                    />
                  </div>
                </div>
              </div>
            </td>
            <td class="px-3 py-4">
              <span :class="cn('inline-flex h-[24px] w-[92px] items-center justify-center rounded-full px-2.5 text-center text-[11.5px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
            </td>
            <td class="tabular px-3 py-4 text-right text-[13px] font-medium text-ink">{{ formatNumber(source.rowCount) }}</td>
            <td class="px-3 py-4">
              <div class="flex flex-col items-start gap-1.5">
                <AppBadge :tone="qualityMeta[source.quality].tone">{{ qualityMeta[source.quality].label }}</AppBadge>
              </div>
            </td>
            <td class="hidden whitespace-nowrap px-3 py-4 text-[12px] text-ink-soft 2xl:table-cell">{{ timeAgo(source.updatedAt) }}</td>
            <td class="px-3 py-4">
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-faint transition hover:bg-danger-soft hover:text-danger"
                :aria-label="`ลบ ${source.name}`"
                @click.stop="deleteTarget = source"
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
        class="cursor-pointer bg-surface transition-colors hover:bg-[#eceef1]"
        @click="router.navigate({ to: `/app/data-sources/${source.id}` })"
      >
        <div class="flex items-start gap-3 p-4">
          <FileSpreadsheet class="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-semibold text-ink">{{ source.name }}</p>
            <p class="mt-0.5 truncate text-[11px] text-muted">{{ source.fileName }} · {{ source.period }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span :class="cn('inline-flex h-[22px] w-[92px] items-center justify-center rounded-full px-2.5 text-center text-[11px] font-semibold', typeMeta[source.type].className)">
                {{ typeMeta[source.type].label }}
              </span>
              <AppBadge :tone="qualityMeta[source.quality].tone">{{ qualityMeta[source.quality].label }}</AppBadge>
              <span class="text-[10.5px] text-muted">{{ formatNumber(source.rowCount) }} แถว · {{ timeAgo(source.updatedAt) }}</span>
              <span @click.stop>
                <IndustryPicker
                  :model-value="source.industryId ?? null"
                  :disabled="assigningId === source.id"
                  @update:model-value="assignIndustry(source, $event)"
                />
              </span>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
            :aria-label="`ลบ ${source.name}`"
            @click.stop="deleteTarget = source"
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

    </div>
  </section>

  </div>

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

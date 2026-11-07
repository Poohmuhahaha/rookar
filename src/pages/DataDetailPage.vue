<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'
import { useRouter, useRouterState } from '@tanstack/vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { deleteSource, getSourceById, getSourceRows } from '@/lib/mockApi'
import { formatNumber, timeAgo } from '@/lib/format'
import { useToast } from '@/lib/toast'

const props = defineProps<{
  id?: string
}>()

const router = useRouter()
const pathname = useRouterState({ select: (s) => s.location.pathname }) as Ref<string>
const toast = useToast()
const queryClient = useQueryClient()

const sourceId = computed(() => {
  if (props.id) return props.id
  const match = pathname.value.match(/\/data-sources\/([^/?#]+)/)
  return match ? match[1] : ''
})
const search = ref('')
const deleteModalOpen = ref(false)

const { data: source, isPending: sourcePending } = useQuery({
  queryKey: computed(() => ['source', sourceId.value]),
  queryFn: () => getSourceById(sourceId.value),
})

const { data: tableData, isPending: rowsPending } = useQuery({
  queryKey: computed(() => ['sourceRows', sourceId.value]),
  queryFn: () => getSourceRows(sourceId.value),
})

const filteredRows = computed(() => {
  const rows = tableData.value?.rows ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
  )
})

const qualityMeta = {
  complete: { label: 'ครบถ้วนสมบูรณ์', tone: 'success' as const, desc: 'ข้อมูลพร้อมสำหรับการวิเคราะห์ทุกมิติ' },
  partial: { label: 'ควรตรวจสอบ', tone: 'warning' as const, desc: 'มีบางแถวที่อาจขาดข้อมูลคอลัมน์ที่ไม่จำเป็น' },
  duplicate: { label: 'มีข้อมูลซ้ำ', tone: 'danger' as const, desc: 'พบข้อมูลที่ซ้ำกัน อาจทำให้ตัวเลขคลาดเคลื่อน' },
}

const deleteMutation = useMutation({
  mutationFn: () => deleteSource(sourceId.value),
  onSuccess: async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sources'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
    toast.success('ลบชุดข้อมูลแล้ว')
    deleteModalOpen.value = false
    router.navigate({ to: '/app/data-sources' })
  },
  onError: () => {
    toast.error('ลบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
  },
})

function downloadCsv() {
  if (!source.value || !tableData.value) return
  const cols = tableData.value.columns.map((c) => c.label).join(',')
  const rows = tableData.value.rows
    .map((r) => tableData.value!.columns.map((c) => `"${r[c.key] ?? ''}"`).join(','))
    .join('\n')
  const content = `\uFEFF${cols}\n${rows}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = source.value.fileName || `${source.value.name}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('ดาวน์โหลดไฟล์ CSV แล้ว')
}

function askAiAboutDataset() {
  if (!source.value) return
  const prompt = `ช่วยสรุปภาพรวมและจุดสังเกตสำคัญจากชุดข้อมูล "${source.value.name}" (${source.value.fileName}) หน่อยครับ`
  router.navigate({
    to: '/app/assistant',
    search: { prompt },
  })
}
</script>

<template>
  <div v-if="sourcePending" class="flex min-h-[400px] items-center justify-center">
    <Loader2 class="h-8 w-8 animate-spin text-muted" />
  </div>

  <div v-else-if="!source" class="py-16 text-center">
    <Database class="mx-auto h-12 w-12 text-muted" />
    <h2 class="mt-4 text-h2 font-semibold text-ink">ไม่พบชุดข้อมูลนี้</h2>
    <p class="mt-2 text-sm text-muted">ชุดข้อมูลนี้อาจถูกลบไปแล้วหรือรหัสไม่ถูกต้อง</p>
    <AppButton class="mt-6" @click="router.navigate({ to: '/app/data-sources' })">
      กลับไปหน้ารวมแหล่งข้อมูล
    </AppButton>
  </div>

  <div v-else class="space-y-6">
    <!-- Header -->
    <PageHeader
      :title="source.name"
      :description="`${source.fileName} · ข้อมูลช่วง ${source.period} · อัปเดตล่าสุด ${timeAgo(source.updatedAt)}`"
    >
      <template #actions>
        <AppButton variant="secondary" @click="router.navigate({ to: '/app/data-sources' })">
          <template #left>
            <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          </template>
          แหล่งข้อมูลทั้งหมด
        </AppButton>
        <AppButton variant="secondary" @click="downloadCsv">
          <template #left>
            <Download class="h-4 w-4" aria-hidden="true" />
          </template>
          ดาวน์โหลด CSV
        </AppButton>
        <AppButton @click="askAiAboutDataset">
          <template #left>
            <Sparkles class="h-4 w-4" aria-hidden="true" />
          </template>
          ถาม AI ถึงชุดข้อมูลนี้
        </AppButton>
      </template>
    </PageHeader>

    <!-- 4 Stats Cards -->
    <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      <div class="card-fade p-4">
        <div class="relative z-10 flex h-full flex-col justify-between">
          <dt class="text-[11.5px] font-medium text-ink-soft">จำนวนแถวข้อมูล</dt>
          <dd class="tabular mt-3 text-2xl font-bold tracking-tight text-ink">
            {{ formatNumber(source.rowCount) }} <span class="text-[11px] font-normal text-muted">แถว</span>
          </dd>
        </div>
      </div>
      <div class="card-fade p-4">
        <div class="relative z-10 flex h-full flex-col justify-between">
          <dt class="text-[11.5px] font-medium text-ink-soft">สถานะคุณภาพ</dt>
          <dd class="mt-3 flex items-center gap-1.5">
            <AppBadge :tone="qualityMeta[source.quality].tone">
              {{ qualityMeta[source.quality].label }}
            </AppBadge>
          </dd>
        </div>
      </div>
      <div class="card-fade p-4">
        <div class="relative z-10 flex h-full flex-col justify-between">
          <dt class="text-[11.5px] font-medium text-ink-soft">หมวดหมู่</dt>
          <dd class="tabular mt-3 text-lg font-bold tracking-tight text-ink">
            {{ source.typeLabel }}
          </dd>
        </div>
      </div>
      <div class="card-fade p-4">
        <div class="relative z-10 flex h-full flex-col justify-between">
          <dt class="text-[11.5px] font-medium text-ink-soft">การอัปเดต</dt>
          <dd class="tabular mt-3 text-base font-bold tracking-tight text-ink">
            {{ timeAgo(source.updatedAt) }}
          </dd>
        </div>
      </div>
    </div>

    <!-- Data Table & Search -->
    <div class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10 space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-[17px] font-bold text-ink">ตัวอย่างข้อมูล (Row Preview)</h2>
              <AppBadge v-if="source.isDemo" tone="warning">ข้อมูลตัวอย่าง</AppBadge>
            </div>
            <p class="text-[12.5px] text-muted">แสดงข้อมูลตัวอย่างที่ ROOKAR ใช้วิเคราะห์และส่งต่อให้ AI</p>
          </div>
          <div class="relative w-full sm:max-w-xs">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              v-model="search"
              type="search"
              placeholder="ค้นหาในตาราง..."
              class="h-10 w-full rounded-xl bg-[#f4f5f7] pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:bg-neutral-200 focus:outline-none"
            />
          </div>
        </div>

        <!-- Table Container -->
        <div class="overflow-hidden rounded-2xl bg-[#f4f5f7]">
          <div v-if="rowsPending" class="flex min-h-[200px] items-center justify-center">
            <Loader2 class="h-6 w-6 animate-spin text-muted" />
          </div>

          <div v-else-if="!tableData?.rows.length" class="py-12 text-center text-muted">
            <p class="text-sm">ไม่มีข้อมูลในชุดนี้</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-[13px]">
              <thead class="bg-black text-white text-[11.5px] font-semibold uppercase tracking-wider">
                <tr>
                  <th v-for="col in tableData.columns" :key="col.key" class="px-4 py-3.5 whitespace-nowrap">
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200/60 bg-white">
                <tr
                  v-for="(row, idx) in filteredRows"
                  :key="idx"
                  class="transition-colors hover:bg-neutral-50"
                >
                  <td
                    v-for="col in tableData.columns"
                    :key="col.key"
                    class="px-4 py-3.5 whitespace-nowrap font-medium text-ink"
                  >
                    {{ row[col.key] ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="flex items-center justify-between pt-2">
          <p class="text-xs text-muted">
            แสดง {{ filteredRows.length }} จาก {{ tableData?.rows.length ?? 0 }} แถวตัวอย่าง
          </p>

          <button
            type="button"
            class="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            @click="deleteModalOpen = true"
          >
            <Trash2 class="h-3.5 w-3.5" />
            ลบชุดข้อมูลนี้
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <AppModal
      :open="deleteModalOpen"
      title="ยืนยันการลบชุดข้อมูล"
      description="การลบชุดข้อมูลจะทำให้กราฟและบทวิเคราะห์ที่เกี่ยวข้องอัปเดตใหม่ทันที และไม่สามารถกู้คืนได้"
      size="md"
      @update:open="deleteModalOpen = $event"
    >
      <div class="space-y-4 pt-2">
        <div class="rounded-xl bg-[#f4f5f7] p-4 text-[13px] text-ink">
          <p class="font-bold">{{ source.name }}</p>
          <p class="mt-0.5 text-xs text-muted">{{ source.fileName }} · {{ formatNumber(source.rowCount) }} แถว</p>
        </div>

        <div class="flex justify-end gap-2.5 pt-2">
          <AppButton variant="secondary" @click="deleteModalOpen = false">
            ยกเลิก
          </AppButton>
          <AppButton
            variant="danger"
            :loading="deleteMutation.isPending.value"
            @click="deleteMutation.mutate"
          >
            ยืนยันลบ
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

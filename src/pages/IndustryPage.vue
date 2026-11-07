<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowRight, Check, ChevronDown, Coffee, Fuel, HeartPulse, ShieldCheck, Sparkles, Target, Truck, Zap } from '@lucide/vue'
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
import { getMacroBenchmark } from '@/lib/macroApi'
import {
  FOCUS_INDUSTRIES,
  getIndustryProfile,
  type IndustryId,
} from '@/lib/industries'
import { industryFocus, setIndustryFocus } from '@/lib/industryFocus'
import { listSources, seedSampleSources } from '@/lib/mockApi'
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

const { data: sources } = useQuery({
  queryKey: ['sources'],
  queryFn: listSources,
})

const canReplaceWithDemo = computed(() => {
  const list = sources.value ?? []
  return list.length > 0 && list.every((source) => source.isDemo)
})

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

async function selectIndustry(industryId: IndustryId) {
  if (industryFocus.value === industryId) return
  setIndustryFocus(industryId)
  if (canReplaceWithDemo.value) {
    const replacements = await seedSampleSources(industryId)
    queryClient.setQueryData(['sources'], replacements)
  }
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
    description="บริบทเศรษฐกิจมหภาคจริงจาก World Bank และจุดโฟกัสของอุตสาหกรรมที่เลือก โดยแยกจากภาพรวมธุรกิจ"
  >
    <template #actions>
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[12px] font-semibold text-ink ring-1 ring-neutral-200 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-black"
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
          <AppBadge v-if="selectedProfile.salesNote" tone="warning">
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

  <p class="mt-5 rounded-[24px] bg-black px-4 py-3 text-center text-[11px] leading-relaxed text-white">
    ข้อมูลมหภาคเป็นข้อมูลจริงจาก World Bank · ข้อมูลอุตสาหกรรมและตัวเลขธุรกิจบางส่วนเป็นข้อมูลตัวอย่างสำหรับสาธิต
  </p>
</template>

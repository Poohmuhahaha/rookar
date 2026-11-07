<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import type { Component } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Coffee,
  Fuel,
  HeartPulse,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Wallet,
  Zap,
} from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStepper from '@/components/ui/AppStepper.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import SelectField from '@/components/ui/SelectField.vue'
import TextField from '@/components/ui/TextField.vue'
import ImportPage from '@/pages/ImportPage.vue'
import { cn } from '@/lib/cn'
import {
  FOCUS_INDUSTRIES,
  normalizeIndustryId,
  type IndustryId,
} from '@/lib/industries'
import { getSession, saveBusiness, skipBusiness } from '@/lib/mockApi'
import { setIndustryFocus } from '@/lib/industryFocus'
import { useToast } from '@/lib/toast'

const router = useRouter()
const toast = useToast()
const session = getSession()

const steps = [
  { label: 'ข้อมูลธุรกิจ', hint: 'พื้นฐาน' },
  { label: 'เป้าหมาย', hint: 'สิ่งที่อยากได้' },
  { label: 'นำเข้าข้อมูล', hint: 'ไม่บังคับ' },
  { label: 'พร้อมเริ่ม', hint: 'ตรวจสอบ' },
]

const current = ref(0)
const loading = ref(false)
const imported = ref(false)
const errors = reactive<{ name?: string; type?: string; employees?: string; goals?: string }>({})

const form = reactive({
  name: session?.business?.name ?? '',
  type: session?.business?.type ? normalizeIndustryId(session.business.type) : '',
  employees: session?.business?.employees ?? '',
  revenueRange: session?.business?.revenueRange ?? '',
  goals: [...(session?.business?.goals ?? [])],
})

const industryIcons: Record<IndustryId, Component> = {
  logistics: Truck,
  'energy-fuel': Fuel,
  ev: Zap,
  healthcare: HeartPulse,
  'quantum-security': ShieldCheck,
  fnb: Coffee,
}

const businessTypes = FOCUS_INDUSTRIES.map((industry) => {
  const notes = [industry.salesNote ?? ''].filter(Boolean)
  return {
    value: industry.id,
    label: industry.label,
    shortLabel: industry.shortLabel,
    description: notes.length > 0 ? `${industry.description} · ${notes.join(' · ')}` : industry.description,
    icon: industryIcons[industry.id],
    parentId: industry.parentId,
  }
})

const topLevelBusinessTypes = businessTypes
  .filter((type) => !type.parentId)
  .map((type) => ({
    ...type,
    children: businessTypes.filter((child) => child.parentId === type.value),
  }))

type BusinessType = (typeof topLevelBusinessTypes)[number]

function isGroupActive(type: BusinessType) {
  return form.type === type.value || type.children.some((child) => child.value === form.type)
}

function selectBusinessType(value: string) {
  form.type = value
  errors.type = undefined
}

const employeeOptions = [
  { value: '1', label: '1 คน (เจ้าของคนเดียว)' },
  { value: '2-5', label: '2–5 คน' },
  { value: '6-10', label: '6–10 คน' },
  { value: '11-30', label: '11–30 คน' },
  { value: '31-50', label: '31–50 คน' },
  { value: '51+', label: 'มากกว่า 50 คน' },
]

const revenueOptions = [
  { value: 'ยังไม่ถึง 1 ล้านบาท', label: 'ยังไม่ถึง 1 ล้านบาท / ปี' },
  { value: '1-3 ล้านบาท', label: '1–3 ล้านบาท / ปี' },
  { value: '3-10 ล้านบาท', label: '3–10 ล้านบาท / ปี' },
  { value: '10-50 ล้านบาท', label: '10–50 ล้านบาท / ปี' },
  { value: 'มากกว่า 50 ล้านบาท', label: 'มากกว่า 50 ล้านบาท / ปี' },
]

const goalOptions = [
  { value: 'เพิ่มกำไร', description: 'ทำให้ทุกบาทที่ขายได้เหลือเป็นกำไรมากขึ้น', icon: TrendingUp },
  { value: 'เพิ่มยอดขาย', description: 'เติบโตอย่างมีแผน ไม่ใช่แค่รอลูกค้า', icon: Rocket },
  { value: 'ลดต้นทุน', description: 'รู้ว่าต้นทุนไหนกินกำไรและลดได้ตรงจุด', icon: Wallet },
  { value: 'จัดการกระแสเงินสด', description: 'เห็นเงินเข้า–ออกล่วงหน้า ไม่สะดุด', icon: Target },
  { value: 'วางแผนการเติบโต', description: 'ตัดสินใจขยายสาขาหรือสินค้าใหม่จากข้อมูล', icon: Lightbulb },
  { value: 'เข้าใจลูกค้า', description: 'รู้ว่าอะไรขายดีและใครคือลูกค้าหลัก', icon: Sparkles },
]

const selectedType = computed(() => businessTypes.find((item) => item.value === form.type))

function validateStep() {
  errors.name = undefined
  errors.type = undefined
  errors.employees = undefined
  errors.goals = undefined
  if (current.value === 0) {
    if (!form.name.trim()) errors.name = 'กรุณากรอกชื่อธุรกิจ'
    if (!form.type) errors.type = 'เลือกประเภทธุรกิจเพื่อไปต่อ'
    if (!form.employees) errors.employees = 'เลือกจำนวนพนักงาน'
  }
  if (current.value === 1 && form.goals.length === 0) {
    errors.goals = 'เลือกเป้าหมายอย่างน้อย 1 ข้อ'
  }
  return !errors.name && !errors.type && !errors.employees && !errors.goals
}

function next() {
  if (!validateStep()) return
  if (current.value < steps.length - 1) current.value += 1
}

function back() {
  if (current.value > 0) current.value -= 1
}

function skipImport() {
  if (current.value === 2) current.value = 3
}

function completeImport() {
  imported.value = true
  current.value = 3
}

function toggleGoal(goal: string) {
  errors.goals = undefined
  const index = form.goals.indexOf(goal)
  if (index >= 0) {
    form.goals.splice(index, 1)
    return
  }
  if (form.goals.length >= 3) {
    toast.info('เลือกได้สูงสุด 3 เป้าหมาย', 'จัดลำดับสิ่งที่สำคัญที่สุดก่อนนะครับ')
    return
  }
  form.goals.push(goal)
}

async function finish() {
  if (loading.value || !session) return
  loading.value = true
  try {
    await saveBusiness({
      name: form.name.trim(),
      type: form.type,
      typeLabel: selectedType.value?.label ?? 'ธุรกิจ',
      employees: form.employees,
      revenueRange: form.revenueRange,
      goals: form.goals,
    })
    setIndustryFocus(form.type as IndustryId)
    toast.success('ตั้งค่าธุรกิจเรียบร้อย', 'พร้อมเริ่มแชทกับ ROOKAR')
    await router.navigate({ to: '/app/assistant' })
  } catch (error) {
    toast.error('บันทึกไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง')
  } finally {
    loading.value = false
  }
}

async function skip() {
  if (loading.value) return
  loading.value = true
  try {
    await skipBusiness()
    toast.info('ข้ามการตั้งค่าก่อน', 'คุณกลับมาตั้งค่าธุรกิจได้ทุกเมื่อ')
    await router.navigate({ to: '/app/assistant' })
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <PageHeader
    title="ตั้งค่าธุรกิจ"
    description="ข้อมูลนี้ช่วยให้ ROOKAR ตีความตัวเลขและให้คำแนะนำที่ตรงกับธุรกิจของคุณมากขึ้น"
  >
    <template #actions>
      <a
        href="mailto:hello@rookar.co"
        class="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-ink-50 hover:text-brand-700"
      >
        <CircleHelp class="h-3.5 w-3.5" aria-hidden="true" />
        ต้องการความช่วยเหลือ?
      </a>
    </template>
  </PageHeader>

  <div class="space-y-4">

      <div class="rounded-[24px] bg-[#eef0f2] p-5 sm:p-6">
        <div class="relative z-10">
          <AppStepper :current="current" :steps="steps" variant="connected" />
        </div>
      </div>

      <section class="rounded-[24px] bg-[#eef0f2] p-6 sm:p-8">
        <div class="relative z-10">
        <Transition name="step" mode="out-in">
          <form v-if="current === 0" key="details" @submit.prevent="next">
            <div class="flex items-center gap-1.5">
              <h1 class="text-h2 font-semibold tracking-tight text-ink">เล่าธุรกิจของคุณให้เรารู้จัก</h1>
              <InfoTip
                text="ข้อมูลนี้ช่วยให้ ROOKAR ตีความตัวเลขและให้คำแนะนำที่ตรงกับธุรกิจคุณมากขึ้น"
                side="bottom"
              />
            </div>

            <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                v-model="form.name"
                label="ชื่อธุรกิจ"
                placeholder="เช่น บลูมมิ่ง คอฟฟี่"
                size="lg"
                required
                surface
                :error="errors.name"
              />
              <SelectField
                v-model="form.employees"
                label="จำนวนพนักงาน"
                placeholder="เลือกจำนวน"
                :options="employeeOptions"
                size="lg"
                required
                surface
                :error="errors.employees"
              />
              <SelectField
                v-model="form.revenueRange"
                label="รายได้ต่อปี (โดยประมาณ)"
                placeholder="เลือกช่วงรายได้"
                :options="revenueOptions"
                size="lg"
                surface
              />
            </div>


            <fieldset class="mt-6">
              <legend class="mb-2 flex w-full flex-wrap items-center gap-1.5 text-[13px] font-medium text-ink-soft">
                ประเภทธุรกิจ
                <span class="text-danger" aria-hidden="true">*</span>
                <span class="ml-auto flex items-center gap-1 text-[11.5px] font-normal text-muted">
                  <InfoTip text="ใช้เป็นข้อมูลประกอบการวิเคราะห์ ไม่ได้ใช้ยืนยันตัวตนหรือยื่นภาษี" />
                  ใช้เพื่อปรับคำแนะนำให้เหมาะกับขนาดธุรกิจของคุณ
                </span>
              </legend>
              <div class="grid auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="type in topLevelBusinessTypes"
                  :key="type.value"
                  :class="
                    cn(
                      'group h-full min-h-[112px] cursor-pointer overflow-hidden rounded-2xl text-left transition-all',
                      isGroupActive(type) ? 'bg-black text-white' : 'bg-neutral-200 text-ink hover:bg-neutral-300/70',
                    )
                  "
                  @click="selectBusinessType(type.value)"
                >
                  <div class="flex h-full items-stretch">
                    <span
                      :class="
                        cn(
                          'flex w-24 shrink-0 items-center justify-center rounded-2xl transition-colors sm:w-28',
                          isGroupActive(type) ? 'bg-white/10 text-white' : 'bg-white text-neutral-600',
                        )
                      "
                      aria-hidden="true"
                    >
                      <component :is="type.icon" class="h-12 w-12 sm:h-14 sm:w-14" />
                    </span>
                    <div class="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                      <button
                        type="button"
                        class="flex w-full flex-col items-start gap-1 text-left"
                        :aria-pressed="form.type === type.value"
                      >
                        <span class="flex w-full items-center gap-2">
                          <span :class="cn('block text-[14.5px] font-semibold', isGroupActive(type) ? 'text-white' : 'text-ink')">{{ type.label }}</span>
                          <Check v-if="form.type === type.value" class="ml-auto h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                        </span>
                        <span :class="cn('block text-[12.5px] leading-snug line-clamp-2', isGroupActive(type) ? 'text-neutral-300' : 'text-muted')">{{ type.description }}</span>
                      </button>
                      <div
                        v-if="type.children.length > 0"
                        class="mt-2 flex flex-wrap items-center gap-2"
                      >
                        <span :class="cn('text-[10px] font-semibold uppercase tracking-wide', isGroupActive(type) ? 'text-neutral-400' : 'text-muted')">ในกลุ่มนี้</span>
                        <button
                          v-for="child in type.children"
                          :key="child.value"
                          type="button"
                          :aria-pressed="form.type === child.value"
                          :class="
                            cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold transition',
                              form.type === child.value
                                ? 'bg-white text-ink'
                                : isGroupActive(type)
                                  ? 'bg-white/10 text-white hover:bg-white/20'
                                  : 'bg-white text-ink hover:bg-neutral-200',
                            )
                          "
                          @click.stop="selectBusinessType(child.value)"
                        >
                          <component :is="child.icon" class="h-3.5 w-3.5" aria-hidden="true" />
                          {{ child.shortLabel }}
                          <Check v-if="form.type === child.value" class="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-if="errors.type" class="mt-1.5 text-[12.5px] text-danger">{{ errors.type }}</p>
            </fieldset>

            <div class="mt-7 flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <button
                type="button"
                class="h-10 rounded-full px-4 text-[13px] font-semibold text-ink-soft transition hover:bg-black/[0.04] hover:text-ink"
                @click="skip"
              >
                ข้ามไปก่อน
              </button>
              <AppButton type="submit" size="lg">
                ต่อไป
                <template #right>
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </template>
              </AppButton>
            </div>
          </form>

          <form v-else-if="current === 1" key="goals" @submit.prevent="next">
            <h1 class="text-h2 font-semibold tracking-tight text-ink">อะไรสำคัญที่สุดสำหรับคุณ?</h1>
            <p class="mt-2 text-[13px] leading-relaxed text-muted">
              เลือกได้สูงสุด 3 เป้าหมาย เราจะใช้จัดลำดับข้อมูลและคำแนะนำในหน้าภาพรวม
            </p>

            <div class="mt-2 flex items-center justify-end gap-3">
              <p v-if="errors.goals" class="text-[12.5px] text-danger">{{ errors.goals }}</p>
              <p v-else class="text-[11.5px] text-muted">เลือกแล้ว {{ form.goals.length }} จาก 3 เป้าหมาย</p>
            </div>
            <div class="mt-3 grid auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div
                v-for="goal in goalOptions"
                :key="goal.value"
                :class="
                  cn(
                    'group h-full min-h-[112px] cursor-pointer overflow-hidden rounded-2xl text-left transition-all',
                    form.goals.includes(goal.value) ? 'bg-black text-white' : 'bg-neutral-200 text-ink hover:bg-neutral-300/70',
                  )
                "
                @click="toggleGoal(goal.value)"
              >
                <div class="flex h-full items-stretch">
                  <span
                    :class="
                      cn(
                        'flex w-24 shrink-0 items-center justify-center rounded-2xl transition-colors sm:w-28',
                        form.goals.includes(goal.value) ? 'bg-white/10 text-white' : 'bg-white text-neutral-600',
                      )
                    "
                    aria-hidden="true"
                  >
                    <component :is="goal.icon" class="h-12 w-12 sm:h-14 sm:w-14" />
                  </span>
                  <div class="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                    <button
                      type="button"
                      class="flex w-full flex-col items-start gap-1 text-left"
                      :aria-pressed="form.goals.includes(goal.value)"
                    >
                      <span class="flex w-full items-center gap-2">
                        <span :class="cn('block text-[14.5px] font-semibold', form.goals.includes(goal.value) ? 'text-white' : 'text-ink')">{{ goal.value }}</span>
                        <Check v-if="form.goals.includes(goal.value)" class="ml-auto h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                      </span>
                      <span :class="cn('block text-[12.5px] leading-snug line-clamp-2', form.goals.includes(goal.value) ? 'text-neutral-300' : 'text-muted')">{{ goal.description }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-7 flex items-center justify-end gap-3 pt-5">
              <AppButton variant="ghost" size="lg" @click="back">
                <template #left>
                  <ArrowLeft class="h-4 w-4" aria-hidden="true" />
                </template>
                ย้อนกลับ
              </AppButton>
              <AppButton type="submit" size="lg">
                ต่อไป
                <template #right>
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </template>
              </AppButton>
            </div>
          </form>

          <div v-else-if="current === 2" key="import">
            <ImportPage
              embedded
              @back="back"
              @skip="skipImport"
              @complete="completeImport"
            />
          </div>

          <div v-else-if="current === 3" key="review">
            <h1 class="text-h2 font-semibold tracking-tight text-ink">ทุกอย่างพร้อมแล้ว</h1>
            <p class="mt-3 text-[13px] leading-relaxed text-muted">
              ตรวจสอบข้อมูลอีกครั้ง แล้วเริ่มใช้งาน ROOKAR ได้เลย
            </p>

            <dl class="mt-6 overflow-hidden">
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="text-[12px] font-medium text-ink-soft">ชื่อธุรกิจ</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ form.name }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 px-4 py-3.5">
                <dt class="text-[12px] font-medium text-ink-soft">ประเภทธุรกิจ</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ selectedType?.label }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="text-[12px] font-medium text-ink-soft">พนักงาน</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ employeeOptions.find((item) => item.value === form.employees)?.label ?? '—' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 px-4 py-3.5">
                <dt class="text-[12px] font-medium text-ink-soft">รายได้ต่อปี</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ form.revenueRange || '—' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="shrink-0 text-[12px] font-medium text-ink-soft">เป้าหมาย</dt>
                <dd class="flex flex-wrap justify-end gap-1.5">
                  <span v-for="goal in form.goals" :key="goal" class="rounded-full bg-black text-white font-semibold px-2.5 py-0.5 text-[11px]">
                    {{ goal }}
                  </span>
                  <span v-if="form.goals.length === 0" class="text-[13px] text-muted">ยังไม่ได้เลือก</span>
                </dd>
              </div>
            </dl>

            <div v-if="!imported" class="mt-4 flex items-start gap-2.5">
              <Lightbulb class="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
              <p class="text-[12px] leading-relaxed text-muted">
                ยังไม่มีข้อมูลจริง? เริ่มด้วยไฟล์ยอดขายหรือต้นทุน 1 ไฟล์ก็พอ
                ROOKAR จะค่อย ๆ เรียนรู้ธุรกิจคุณไปพร้อมกัน
              </p>
            </div>
            <div v-else class="mt-4 flex items-start gap-2.5">
              <Check class="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <p class="text-[12px] leading-relaxed text-muted">
                นำเข้าข้อมูลแล้ว ROOKAR จะใช้ข้อมูลนี้วิเคราะห์ภาพรวมและคำแนะนำให้คุณทันที
              </p>
            </div>

            <div class="mt-6 flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <AppButton variant="ghost" size="lg" :disabled="loading" @click="back">
                <template #left>
                  <ArrowLeft class="h-4 w-4" aria-hidden="true" />
                </template>
                ย้อนกลับ
              </AppButton>
              <AppButton size="lg" :loading="loading" @click="finish">
                เริ่มใช้งาน ROOKAR
                <template #right>
                  <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
                </template>
              </AppButton>
            </div>
          </div>
        </Transition>
        </div>
      </section>

      <p class="rounded-2xl bg-white px-4 py-3 text-center text-[11px] text-muted">
        เปลี่ยนใจได้ทุกเมื่อ · ข้อมูลธุรกิจแก้ไขได้ภายหลัง
      </p>
  </div>
</template>

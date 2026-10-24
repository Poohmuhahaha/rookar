<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Coffee,
  Globe2,
  Lightbulb,
  Loader2,
  LogOut,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Wallet,
  Wrench,
} from '@lucide/vue'
import BrandLogo from '@/components/brand/BrandLogo.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStepper from '@/components/ui/AppStepper.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import SelectField from '@/components/ui/SelectField.vue'
import TextField from '@/components/ui/TextField.vue'
import { cn } from '@/lib/cn'
import { getSession, logout, saveBusiness, skipBusiness } from '@/lib/mockApi'
import { useToast } from '@/lib/toast'

const router = useRouter()
const toast = useToast()
const session = getSession()

const steps = [
  { label: 'ข้อมูลธุรกิจ', hint: 'พื้นฐาน' },
  { label: 'เป้าหมาย', hint: 'สิ่งที่อยากได้' },
  { label: 'พร้อมเริ่ม', hint: 'ตรวจสอบ' },
]

const current = ref(0)
const loading = ref(false)
const errors = reactive<{ name?: string; type?: string; employees?: string; goals?: string }>({})

const form = reactive({
  name: session?.business?.name ?? '',
  type: session?.business?.type ?? '',
  employees: session?.business?.employees ?? '',
  revenueRange: session?.business?.revenueRange ?? '',
  goals: [...(session?.business?.goals ?? [])],
})

const businessTypes = [
  { value: 'fnb', label: 'อาหารและเครื่องดื่ม', description: 'ร้านอาหาร คาเฟ่ เบเกอรี', icon: Coffee },
  { value: 'retail', label: 'ค้าปลีก', description: 'ร้านค้า สินค้าอุปโภค', icon: Store },
  { value: 'ecommerce', label: 'อีคอมเมิร์ซ', description: 'ขายออนไลน์ มาร์เก็ตเพลส', icon: ShoppingBag },
  { value: 'services', label: 'บริการ', description: 'ที่ปรึกษา ซ่อมบำรุง', icon: Wrench },
  { value: 'manufacturing', label: 'การผลิต', description: 'โรงงาน สินค้าสั่งทำ', icon: Globe2 },
  { value: 'other', label: 'อื่น ๆ', description: 'ธุรกิจรูปแบบอื่น', icon: Sparkles },
]

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
const progress = computed(() => ((current.value + 1) / steps.length) * 100)
const initials = computed(() => session?.user.initials ?? 'RK')
const avatarUrl = computed(() => session?.user.avatarUrl ?? '/avatar.jpg')

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

async function finish(target: 'app' | 'import') {
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
    toast.success('ตั้งค่าธุรกิจเรียบร้อย', target === 'import' ? 'เริ่มนำเข้าข้อมูลแรกได้เลย' : 'พร้อมเริ่มแชทกับ ROOKAR')
    await router.navigate({ to: target === 'import' ? '/app/import' : '/app/assistant' })
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

async function signOut() {
  await logout()
  await router.navigate({ to: '/login' })
}
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link to="/" aria-label="ROOKAR หน้าหลัก">
        <BrandLogo :mark-size="34" />
      </Link>
      <div class="flex items-center gap-1.5">
        <a
          href="mailto:hello@rookar.co"
          class="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-ink-50 hover:text-brand-700"
        >
          <CircleHelp class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">ต้องการความช่วยเหลือ?</span>
          <span class="sm:hidden">ช่วยเหลือ</span>
        </a>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-ink-50 hover:text-brand-700"
          aria-label="ออกจากระบบ"
          @click="signOut"
        >
          <LogOut class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">ออกจากระบบ</span>
        </button>
        <div class="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
          <img :src="avatarUrl" alt="Profile" class="h-full w-full object-cover" />
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl space-y-4 px-4 pb-14 sm:px-6">
      <div class="card-fade-static p-6 sm:p-8">
        <div class="relative z-10">
          <AppStepper :current="current" :steps="steps" />
          <div class="mt-4 h-1 overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
            <div class="h-full bg-brand-700 transition-all duration-500" :style="{ width: `${progress}%` }" />
          </div>
        </div>
      </div>

      <section class="card-fade-static p-6 sm:p-8">
        <div class="relative z-10">
        <Transition name="step" mode="out-in">
          <form v-if="current === 0" key="details" @submit.prevent="next">
            <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 1 จาก 3</p>
            <h1 class="mt-2 text-h2 font-semibold tracking-tight text-ink">เล่าธุรกิจของคุณให้เรารู้จัก</h1>
            <p class="mt-2 text-[13px] leading-relaxed text-muted">
              ข้อมูลนี้ช่วยให้ ROOKAR ตีความตัวเลขและให้คำแนะนำที่ตรงกับธุรกิจคุณมากขึ้น
            </p>

            <div class="mt-6">
              <TextField
                v-model="form.name"
                label="ชื่อธุรกิจ"
                placeholder="เช่น บลูมมิ่ง คอฟฟี่"
                size="lg"
                required
                :error="errors.name"
              />
            </div>

            <fieldset class="mt-6">
              <legend class="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink-soft">
                ประเภทธุรกิจ
                <span class="text-danger" aria-hidden="true">*</span>
              </legend>
              <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  v-for="type in businessTypes"
                  :key="type.value"
                  type="button"
                  :class="
                    cn(
                      'group flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all',
                      form.type === type.value ? 'bg-black text-white' : 'bg-neutral-100/80 text-ink hover:bg-neutral-200/70',
                    )
                  "
                  :aria-pressed="form.type === type.value"
                  @click="form.type = type.value; errors.type = undefined"
                >
                  <component
                    :is="type.icon"
                    :class="cn('h-4 w-4 shrink-0 transition-colors', form.type === type.value ? 'text-white' : 'text-neutral-500')"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 flex-1">
                    <span :class="cn('block text-[13px] font-semibold', form.type === type.value ? 'text-white' : 'text-ink')">{{ type.label }}</span>
                    <span :class="cn('mt-0.5 block truncate text-[11.5px]', form.type === type.value ? 'text-neutral-300' : 'text-muted')">{{ type.description }}</span>
                  </span>
                  <Check v-if="form.type === type.value" class="ml-auto h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                </button>
              </div>
              <p v-if="errors.type" class="mt-1.5 text-[12.5px] text-danger">{{ errors.type }}</p>
            </fieldset>

            <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <SelectField
                  v-model="form.employees"
                  label="จำนวนพนักงาน"
                  placeholder="เลือกจำนวน"
                  :options="employeeOptions"
                  required
                  :error="errors.employees"
                />
              </div>
              <SelectField
                v-model="form.revenueRange"
                label="รายได้ต่อปี (โดยประมาณ)"
                placeholder="เลือกช่วงรายได้"
                :options="revenueOptions"
              />
            </div>
            <p class="mt-2 flex items-center gap-1 text-[11.5px] text-muted">
              <InfoTip text="ใช้เป็นข้อมูลประกอบการวิเคราะห์ ไม่ได้ใช้ยืนยันตัวตนหรือยื่นภาษี" />
              ใช้เพื่อปรับคำแนะนำให้เหมาะกับขนาดธุรกิจของคุณ
            </p>

            <div class="mt-7 flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                class="h-10 text-[13px] font-medium text-muted transition hover:text-brand-700"
                @click="skip"
              >
                ข้ามไปก่อน
              </button>
              <AppButton type="submit" size="lg">
                ต่อไป: เป้าหมาย
                <template #right>
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </template>
              </AppButton>
            </div>
          </form>

          <form v-else-if="current === 1" key="goals" @submit.prevent="next">
            <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 2 จาก 3</p>
            <h1 class="mt-2 text-h2 font-semibold tracking-tight text-ink">อะไรสำคัญที่สุดสำหรับคุณ?</h1>
            <p class="mt-2 text-[13px] leading-relaxed text-muted">
              เลือกได้สูงสุด 3 เป้าหมาย เราจะใช้จัดลำดับข้อมูลและคำแนะนำในหน้าภาพรวม
            </p>

            <div class="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                v-for="goal in goalOptions"
                :key="goal.value"
                type="button"
                :class="
                  cn(
                    'group flex items-start gap-3 rounded-2xl p-3.5 text-left transition-all',
                    form.goals.includes(goal.value) ? 'bg-black text-white' : 'bg-neutral-100/80 text-ink hover:bg-neutral-200/70',
                  )
                "
                :aria-pressed="form.goals.includes(goal.value)"
                @click="toggleGoal(goal.value)"
              >
                <component
                  :is="goal.icon"
                  :class="cn('mt-0.5 h-4 w-4 shrink-0 transition-colors', form.goals.includes(goal.value) ? 'text-white' : 'text-neutral-500')"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">
                  <span :class="cn('block text-[13px] font-semibold', form.goals.includes(goal.value) ? 'text-white' : 'text-ink')">{{ goal.value }}</span>
                  <span :class="cn('mt-0.5 block text-[11.5px] leading-relaxed', form.goals.includes(goal.value) ? 'text-neutral-300' : 'text-muted')">{{ goal.description }}</span>
                </span>
                <Check v-if="form.goals.includes(goal.value)" class="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
              </button>
            </div>
            <div class="mt-2 flex items-center justify-between gap-3">
              <p v-if="errors.goals" class="text-[12.5px] text-danger">{{ errors.goals }}</p>
              <p v-else class="text-[11.5px] text-muted">เลือกแล้ว {{ form.goals.length }} จาก 3 เป้าหมาย</p>
            </div>

            <div class="mt-7 flex items-center justify-between gap-3 pt-5">
              <AppButton variant="ghost" size="lg" @click="back">
                <template #left>
                  <ArrowLeft class="h-4 w-4" aria-hidden="true" />
                </template>
                ย้อนกลับ
              </AppButton>
              <AppButton type="submit" size="lg">
                ต่อไป: ตรวจสอบ
                <template #right>
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </template>
              </AppButton>
            </div>
          </form>

          <div v-else key="review">
            <div class="flex items-start gap-3">
              <Sparkles class="mt-1 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
              <div>
                <p class="text-[11px] font-medium text-brand-700">ขั้นที่ 3 จาก 3</p>
                <h1 class="mt-1 text-h2 font-semibold tracking-tight text-ink">ทุกอย่างพร้อมแล้ว</h1>
              </div>
            </div>
            <p class="mt-3 text-[13px] leading-relaxed text-muted">
              ตรวจสอบข้อมูลอีกครั้ง แล้วเริ่มใช้งาน ROOKAR ได้เลย
            </p>

            <dl class="mt-6 overflow-hidden">
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="text-[12px] text-muted">ชื่อธุรกิจ</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ form.name }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 px-4 py-3.5">
                <dt class="text-[12px] text-muted">ประเภทธุรกิจ</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ selectedType?.label }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="text-[12px] text-muted">พนักงาน</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ employeeOptions.find((item) => item.value === form.employees)?.label ?? '—' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 px-4 py-3.5">
                <dt class="text-[12px] text-muted">รายได้ต่อปี</dt>
                <dd class="text-right text-[13px] font-medium text-ink">{{ form.revenueRange || '—' }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4 bg-ink-50 px-4 py-3.5">
                <dt class="shrink-0 text-[12px] text-muted">เป้าหมาย</dt>
                <dd class="flex flex-wrap justify-end gap-1.5">
                  <span v-for="goal in form.goals" :key="goal" class="rounded-full bg-black text-white font-semibold px-2.5 py-0.5 text-[11px]">
                    {{ goal }}
                  </span>
                  <span v-if="form.goals.length === 0" class="text-[13px] text-muted">ยังไม่ได้เลือก</span>
                </dd>
              </div>
            </dl>

            <div class="mt-4 flex items-start gap-2.5 bg-canvas px-3.5 py-3">
              <Lightbulb class="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
              <p class="text-[12px] leading-relaxed text-muted">
                ยังไม่มีข้อมูลจริง? เริ่มด้วยไฟล์ยอดขายหรือต้นทุน 1 ไฟล์ก็พอ
                ROOKAR จะค่อย ๆ เรียนรู้ธุรกิจคุณไปพร้อมกัน
              </p>
            </div>

            <div class="mt-6 flex flex-col-reverse gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <AppButton variant="ghost" size="lg" :disabled="loading" @click="back">
                <template #left>
                  <ArrowLeft class="h-4 w-4" aria-hidden="true" />
                </template>
                ย้อนกลับ
              </AppButton>
              <div class="flex flex-col gap-2 sm:flex-row">
                <AppButton variant="secondary" size="lg" :disabled="loading" @click="finish('import')">
                  <template #left>
                    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
                  </template>
                  นำเข้าข้อมูลก่อน
                </AppButton>
                <AppButton size="lg" :loading="loading" @click="finish('app')">
                  เริ่มใช้งาน ROOKAR
                  <template #right>
                    <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
                  </template>
                </AppButton>
              </div>
            </div>
          </div>
        </Transition>
        </div>
      </section>

      <p class="card-fade-static px-4 py-3 text-center text-[11px] text-muted">
        เปลี่ยนใจได้ทุกเมื่อ · ข้อมูลธุรกิจแก้ไขได้ภายหลัง
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import { AlertCircle, ArrowRight, Check } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CheckboxField from '@/components/ui/CheckboxField.vue'
import TextField from '@/components/ui/TextField.vue'
import { signup } from '@/lib/mockApi'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/cn'

const router = useRouter()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  accept: false,
})
const errors = reactive<{
  name?: string
  email?: string
  password?: string
  accept?: string
  general?: string
}>({})
const loading = ref(false)
const touchedPassword = ref(false)

const strength = computed(() => {
  const value = form.password
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) || /[ก-๙]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9ก-๙]/.test(value)) score += 1
  return Math.min(score, 4)
})

const strengthLabel = computed(() => {
  if (!form.password) return ''
  if (strength.value <= 1) return 'อ่อน'
  if (strength.value === 2) return 'พอใช้'
  if (strength.value === 3) return 'ดี'
  return 'แข็งแรง'
})

function validate() {
  errors.name = undefined
  errors.email = undefined
  errors.password = undefined
  errors.accept = undefined
  errors.general = undefined
  if (!form.name.trim()) errors.name = 'กรุณากรอกชื่อของคุณ'
  else if (form.name.trim().length < 2) errors.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
  if (!form.email.trim()) errors.email = 'กรุณากรอกอีเมล'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!form.password) errors.password = 'กรุณาตั้งรหัสผ่าน'
  else if (form.password.length < 8) errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  if (!form.accept) errors.accept = 'กรุณายอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว'
  return !errors.name && !errors.email && !errors.password && !errors.accept
}

async function handleSubmit() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    const session = await signup(form.name.trim(), form.email.trim(), form.password)
    toast.success('สร้างบัญชีสำเร็จ', 'อีกขั้นเดียวก็เริ่มใช้งานได้แล้ว')
    await router.navigate({ to: session.onboardingComplete ? '/app/assistant' : '/setup' })
  } catch (error) {
    errors.general = error instanceof Error ? error.message : 'สมัครใช้งานไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div>
      <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        เริ่มเห็นธุรกิจชัดขึ้น
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        สมัครฟรีและตั้งค่าธุรกิจของคุณได้ในไม่ถึง 2 นาที
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.name"
          label="ชื่อ-นามสกุล"
          autocomplete="name"
          placeholder="เช่น ภีม ธีรภัทร"
          size="lg"
          :error="errors.name"
        />
        <TextField
          v-model="form.email"
          label="อีเมล"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          size="lg"
          :error="errors.email"
        />
        <div>
          <TextField
            v-model="form.password"
            label="รหัสผ่าน"
            type="password"
            autocomplete="new-password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            size="lg"
            :error="errors.password"
            @focus="touchedPassword = true"
          />
          <div v-if="touchedPassword && !errors.password" class="mt-2 flex items-center gap-2">
            <div class="flex flex-1 gap-1" aria-hidden="true">
              <span
                v-for="index in 4"
                :key="index"
                :class="
                  cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    index <= strength
                      ? strength <= 1
                        ? 'bg-danger'
                        : strength === 2
                          ? 'bg-accent-500'
                          : 'bg-brand-500'
                      : 'bg-ink-100',
                  )
                "
              />
            </div>
            <span
              :class="
                cn(
                  'w-12 text-right text-[11px]',
                  strength <= 1 ? 'text-danger' : strength === 2 ? 'text-warning' : 'text-brand-700',
                )
              "
            >
              {{ strengthLabel }}
            </span>
          </div>
        </div>

        <div>
          <CheckboxField
            v-model="form.accept"
            label="ฉันยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว"
          />
          <p v-if="errors.accept" class="ml-7 mt-1 text-xs text-danger">{{ errors.accept }}</p>
        </div>

        <div
          v-if="errors.general"
          role="alert"
          class="flex items-start gap-2 bg-danger-soft/60 px-3.5 py-3 text-[13px] leading-relaxed text-danger"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ errors.general }}
        </div>

        <AppButton type="submit" size="lg" block :loading="loading">
          สมัครใช้งานฟรี
          <template #right>
            <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </form>

      <ul class="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
        <li
          v-for="item in ['ไม่มีค่าใช้จ่าย', 'ไม่ใช้บัตรเครดิต', 'ยกเลิกได้ทุกเมื่อ']"
          :key="item"
          class="flex items-center gap-1 text-[11px] text-muted"
        >
          <Check class="h-3 w-3 text-brand-600" aria-hidden="true" />
          {{ item }}
        </li>
      </ul>

      <p class="mt-7 text-center text-[13px] text-muted">
        มีบัญชีอยู่แล้ว?
        <Link
          to="/login"
          class="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  </AuthLayout>
</template>

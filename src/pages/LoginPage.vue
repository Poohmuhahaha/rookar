<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import { AlertCircle, ArrowRight } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CheckboxField from '@/components/ui/CheckboxField.vue'
import TextField from '@/components/ui/TextField.vue'
import { login } from '@/lib/mockApi'
import { useToast } from '@/lib/toast'

const router = useRouter()
const toast = useToast()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})
const errors = reactive<{ email?: string; password?: string; general?: string }>({})
const loading = ref(false)

function validate() {
  errors.email = undefined
  errors.password = undefined
  errors.general = undefined
  if (!form.email.trim()) errors.email = 'กรุณากรอกอีเมล'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  if (!form.password) errors.password = 'กรุณากรอกรหัสผ่าน'
  else if (form.password.length < 8) errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
  return !errors.email && !errors.password
}

async function handleSubmit() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    const session = await login(form.email.trim(), form.password)
    toast.success('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับกลับ ${session.user.name}`)
    await router.navigate({ to: session.onboardingComplete ? '/app/assistant' : '/setup' })
  } catch (error) {
    errors.general = error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <AuthLayout>
    <div>
      <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ยินดีต้อนรับกลับ
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        เข้าสู่ระบบเพื่อดูภาพรวมธุรกิจและคุยกับ AI ของคุณ
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.email"
          label="อีเมล"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          size="lg"
          :error="errors.email"
        />
        <TextField
          v-model="form.password"
          label="รหัสผ่าน"
          type="password"
          autocomplete="current-password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          size="lg"
          :error="errors.password"
        />

        <div class="flex items-center justify-between gap-3 pt-0.5">
          <CheckboxField v-model="form.remember" label="จดจำฉันไว้" />
          <Link
            to="/forgot-password"
            class="shrink-0 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
          >
            ลืมรหัสผ่าน?
          </Link>
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
          เข้าสู่ระบบ
          <template #right>
            <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </form>

      <p class="mt-7 text-center text-[13px] text-muted">
        ยังไม่มีบัญชี?
        <Link
          to="/signup"
          class="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
        >
          สมัครใช้งานฟรี
        </Link>
      </p>
    </div>
  </AuthLayout>
</template>

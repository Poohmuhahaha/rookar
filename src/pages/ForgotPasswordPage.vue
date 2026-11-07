<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link } from '@tanstack/vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { requestPasswordReset } from '@/lib/mockApi'

const form = reactive({ email: '' })
const errors = reactive<{ email?: string }>({})
const loading = ref(false)
const sent = ref(false)
const sentEmail = ref('')
const devResetUrl = ref<string | null>(null)

async function handleSubmit() {
  errors.email = undefined
  if (!form.email.trim()) {
    errors.email = 'กรุณากรอกอีเมล'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  loading.value = true
  try {
    const result = await requestPasswordReset(form.email.trim())
    sentEmail.value = form.email.trim()
    devResetUrl.value = result.devResetUrl ?? null
    sent.value = true
  } catch (error) {
    errors.email = error instanceof Error ? error.message : 'ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}

function retry() {
  sent.value = false
  devResetUrl.value = null
}
</script>

<template>
  <AuthLayout>
    <div v-if="!sent">
      <Mail class="h-6 w-6 text-brand-400" aria-hidden="true" />
      <h1 class="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ลืมรหัสผ่าน?
      </h1>
      <p class="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
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
        <AppButton type="submit" size="lg" block :loading="loading">
          ส่งลิงก์ตั้งรหัสผ่านใหม่
        </AppButton>
      </form>

      <Link
        to="/login"
        class="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        กลับไปเข้าสู่ระบบ
      </Link>
    </div>

    <div v-else class="text-center sm:text-left">
      <CheckCircle2 class="mx-auto h-7 w-7 text-success sm:mx-0" aria-hidden="true" />
      <h1 class="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ส่งลิงก์แล้ว
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        ถ้ามีบัญชีที่ใช้ <span class="font-medium text-ink-soft">{{ sentEmail }}</span>
        คุณจะได้รับอีเมลพร้อมลิงก์ตั้งรหัสผ่านใหม่ภายใน 1–2 นาที
      </p>
      <div class="mt-5 flex items-start gap-2 bg-ink-50 px-3.5 py-3 text-left text-xs leading-relaxed text-muted">
        <AlertCircle class="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" aria-hidden="true" />
        ไม่พบอีเมล? ลองตรวจโฟลเดอร์สแปม หรือส่งอีกครั้งด้วยอีเมลอื่น
      </div>
      <div v-if="devResetUrl" class="mt-3 bg-brand-50 px-3.5 py-3 text-left text-xs leading-relaxed text-brand-800">
        <p class="font-semibold">โหมดทดสอบ: ยังไม่ได้ตั้งค่าอีเมล</p>
        <a :href="devResetUrl" class="mt-1 inline-block font-semibold underline underline-offset-4">
          เปิดลิงก์ตั้งรหัสผ่านใหม่
        </a>
      </div>
      <AppButton variant="secondary" block class="mt-5" @click="retry">
        ส่งอีกครั้ง
      </AppButton>
      <Link
        to="/login"
        class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        กลับไปเข้าสู่ระบบ
      </Link>
    </div>
  </AuthLayout>
</template>

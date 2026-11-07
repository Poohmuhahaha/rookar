<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, useSearch } from '@tanstack/vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { resetPassword } from '@/lib/mockApi'

const search = useSearch({ from: '/reset-password' })
const token = typeof search.value.token === 'string' ? search.value.token : ''

const form = reactive({ password: '', confirm: '' })
const errors = reactive<{ password?: string; confirm?: string; general?: string }>({})
const loading = ref(false)
const done = ref(false)

async function handleSubmit() {
  errors.password = undefined
  errors.confirm = undefined
  errors.general = undefined
  if (!form.password) {
    errors.password = 'กรุณากรอกรหัสผ่านใหม่'
    return
  }
  if (form.password.length < 8) {
    errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (form.password !== form.confirm) {
    errors.confirm = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน'
    return
  }
  loading.value = true
  try {
    await resetPassword(token, form.password)
    done.value = true
  } catch (error) {
    errors.general = error instanceof Error ? error.message : 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div v-if="!token" class="text-center sm:text-left">
      <AlertCircle class="mx-auto h-7 w-7 text-danger sm:mx-0" aria-hidden="true" />
      <h1 class="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ลิงก์ไม่ถูกต้อง
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง
      </p>
      <Link
        to="/forgot-password"
        class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        ขอลิงก์ตั้งรหัสผ่านใหม่
      </Link>
    </div>

    <div v-else-if="done" class="text-center sm:text-left">
      <CheckCircle2 class="mx-auto h-7 w-7 text-success sm:mx-0" aria-hidden="true" />
      <h1 class="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ตั้งรหัสผ่านใหม่แล้ว
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อย กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่
      </p>
      <Link
        to="/login"
        class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        กลับไปเข้าสู่ระบบ
      </Link>
    </div>

    <div v-else>
      <KeyRound class="h-6 w-6 text-brand-400" aria-hidden="true" />
      <h1 class="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        ตั้งรหัสผ่านใหม่
      </h1>
      <p class="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.password"
          label="รหัสผ่านใหม่"
          type="password"
          autocomplete="new-password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          size="lg"
          :error="errors.password"
        />
        <TextField
          v-model="form.confirm"
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          autocomplete="new-password"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          size="lg"
          :error="errors.confirm"
        />
        <div v-if="errors.general" class="flex items-start gap-2 bg-danger-soft/60 px-3.5 py-3 text-[13px] leading-relaxed text-danger">
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ errors.general }}
        </div>
        <AppButton type="submit" size="lg" block :loading="loading">
          บันทึกรหัสผ่านใหม่
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
  </AuthLayout>
</template>

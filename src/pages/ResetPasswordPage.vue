<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, useSearch } from '@tanstack/vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TextField from '@/components/ui/TextField.vue'
import { resetPassword } from '@/lib/mockApi'
import { t, translateServerError } from '@/lib/i18n'

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
    errors.password = t('reset.passwordRequired')
    return
  }
  if (form.password.length < 8) {
    errors.password = t('err.passwordMin')
    return
  }
  if (form.password !== form.confirm) {
    errors.confirm = t('err.confirmMismatch')
    return
  }
  loading.value = true
  try {
    await resetPassword(token, form.password)
    done.value = true
  } catch (error) {
    errors.general =
      error instanceof Error ? translateServerError(error.message, 'err.genericReset') : t('err.genericReset')
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
        {{ t('reset.invalidTitle') }}
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        {{ t('reset.invalidBody') }}
      </p>
      <Link
        to="/forgot-password"
        class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('reset.requestNew') }}
      </Link>
    </div>

    <div v-else-if="done" class="text-center sm:text-left">
      <CheckCircle2 class="mx-auto h-7 w-7 text-success sm:mx-0" aria-hidden="true" />
      <h1 class="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('reset.doneTitle') }}
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        {{ t('reset.doneBody') }}
      </p>
      <Link
        to="/login"
        class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('common.backToLogin') }}
      </Link>
    </div>

    <div v-else>
      <KeyRound class="h-6 w-6 text-brand-400" aria-hidden="true" />
      <h1 class="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('reset.title') }}
      </h1>
      <p class="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        {{ t('reset.subtitle') }}
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.password"
          :label="t('reset.newPassword')"
          type="password"
          autocomplete="new-password"
          :placeholder="t('common.passwordPlaceholder')"
          size="lg"
          :error="errors.password"
        />
        <TextField
          v-model="form.confirm"
          :label="t('reset.confirmNew')"
          type="password"
          autocomplete="new-password"
          :placeholder="t('reset.confirmPlaceholder')"
          size="lg"
          :error="errors.confirm"
        />
        <div v-if="errors.general" class="flex items-start gap-2 bg-danger-soft/60 px-3.5 py-3 text-[13px] leading-relaxed text-danger">
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ errors.general }}
        </div>
        <AppButton type="submit" size="lg" block :loading="loading">
          {{ t('reset.submit') }}
        </AppButton>
      </form>

      <Link
        to="/login"
        class="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
      >
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('common.backToLogin') }}
      </Link>
    </div>
  </AuthLayout>
</template>

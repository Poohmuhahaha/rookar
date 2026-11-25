<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import { AlertCircle, ArrowRight } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CheckboxField from '@/components/ui/CheckboxField.vue'
import TextField from '@/components/ui/TextField.vue'
import { login } from '@/lib/mockApi'
import { t, translateServerError } from '@/lib/i18n'
import { useToast } from '@/lib/toast'

const router = useRouter()
const toast = useToast()

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  remember: true,
})
const errors = reactive<{
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}>({})
const loading = ref(false)

function validate() {
  errors.email = undefined
  errors.password = undefined
  errors.confirmPassword = undefined
  errors.general = undefined
  if (!form.email.trim()) errors.email = t('err.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('err.emailInvalid')
  if (!form.password) errors.password = t('err.passwordRequired')
  else if (form.password.length < 8) errors.password = t('err.passwordMin')
  if (!form.confirmPassword) errors.confirmPassword = t('err.confirmRequired')
  else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('err.confirmMismatch')
  }
  return !errors.email && !errors.password && !errors.confirmPassword
}

async function handleSubmit() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    const session = await login(form.email.trim(), form.password)
    toast.success(t('toast.loginTitle'), t('toast.welcome', { name: session.user.name }))
    await router.navigate({ to: session.onboardingComplete ? '/app/assistant' : '/setup' })
  } catch (error) {
    errors.general =
      error instanceof Error ? translateServerError(error.message, 'err.genericLogin') : t('err.genericLogin')
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <AuthLayout>
    <div>
      <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('login.title') }}
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        {{ t('login.subtitle') }}
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.email"
          :label="t('common.email')"
          type="email"
          autocomplete="email"
          :placeholder="t('common.emailPlaceholder')"
          size="lg"
          :error="errors.email"
        />
        <TextField
          v-model="form.password"
          :label="t('common.password')"
          type="password"
          autocomplete="current-password"
          :placeholder="t('common.passwordPlaceholder')"
          size="lg"
          :error="errors.password"
        />
        <TextField
          v-model="form.confirmPassword"
          :label="t('login.confirmLabel')"
          type="password"
          autocomplete="current-password"
          :placeholder="t('login.confirmPlaceholder')"
          size="lg"
          :error="errors.confirmPassword"
        />

        <div class="flex items-center justify-between gap-3 pt-0.5">
          <CheckboxField v-model="form.remember" :label="t('login.remember')" />
          <Link
            to="/forgot-password"
            class="shrink-0 text-[13px] font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
          >
            {{ t('login.forgot') }}
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
          {{ t('login.submit') }}
          <template #right>
            <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </form>

      <p class="mt-7 text-center text-[13px] text-muted">
        {{ t('login.noAccount') }}
        <Link
          to="/signup"
          class="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
        >
          {{ t('login.signupLink') }}
        </Link>
      </p>
    </div>
  </AuthLayout>
</template>

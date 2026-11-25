<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import { AlertCircle, ArrowRight } from '@lucide/vue'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CheckboxField from '@/components/ui/CheckboxField.vue'
import TextField from '@/components/ui/TextField.vue'
import { signup } from '@/lib/mockApi'
import { t, translateServerError } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/cn'

const router = useRouter()
const toast = useToast()

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  remember: true,
})
const errors = reactive<{
  name?: string
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
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
  if (strength.value <= 1) return t('strength.weak')
  if (strength.value === 2) return t('strength.fair')
  if (strength.value === 3) return t('strength.good')
  return t('strength.strong')
})

function validate() {
  errors.name = undefined
  errors.username = undefined
  errors.email = undefined
  errors.password = undefined
  errors.confirmPassword = undefined
  errors.general = undefined
  if (!form.name.trim()) errors.name = t('err.nameRequired')
  else if (form.name.trim().length < 2) errors.name = t('err.nameMin')
  if (!form.username.trim()) errors.username = t('err.usernameRequired')
  else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.username.trim())) {
    errors.username = t('err.usernameInvalid')
  }
  if (!form.email.trim()) errors.email = t('err.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t('err.emailInvalid')
  if (!form.password) errors.password = t('err.passwordRequired')
  else if (form.password.length < 8) errors.password = t('err.passwordMin')
  if (!form.confirmPassword) errors.confirmPassword = t('err.confirmRequired')
  else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('err.confirmMismatch')
  }
  return (
    !errors.name &&
    !errors.username &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword
  )
}

async function handleSubmit() {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    const session = await signup(
      form.name.trim(),
      form.username.trim().toLowerCase(),
      form.email.trim(),
      form.password,
    )
    toast.success(t('toast.signupTitle'), t('toast.signupDesc'))
    await router.navigate({ to: session.onboardingComplete ? '/app/assistant' : '/setup' })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('ชื่อผู้ใช้')) {
      errors.username = translateServerError(message, 'err.usernameTaken')
    } else if (message.includes('อีเมล')) {
      errors.email = translateServerError(message, 'err.emailTaken')
    } else {
      errors.general = message ? translateServerError(message, 'err.genericSignup') : t('err.genericSignup')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div>
      <h1 class="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">
        {{ t('signup.title') }}
      </h1>
      <p class="mt-2 text-[13px] leading-relaxed text-muted">
        {{ t('signup.subtitle') }}
      </p>

      <form class="mt-7 space-y-4" novalidate @submit.prevent="handleSubmit">
        <TextField
          v-model="form.name"
          :label="t('signup.nameLabel')"
          autocomplete="name"
          :placeholder="t('signup.namePlaceholder')"
          size="lg"
          :error="errors.name"
        />
        <TextField
          v-model="form.username"
          :label="t('signup.usernameLabel')"
          autocomplete="username"
          :placeholder="t('signup.usernamePlaceholder')"
          size="lg"
          :error="errors.username"
        />
        <TextField
          v-model="form.email"
          :label="t('common.email')"
          type="email"
          autocomplete="email"
          :placeholder="t('common.emailPlaceholder')"
          size="lg"
          :error="errors.email"
        />
        <div>
          <TextField
            v-model="form.password"
            :label="t('common.password')"
            type="password"
            autocomplete="new-password"
            :placeholder="t('common.passwordPlaceholder')"
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

        <TextField
          v-model="form.confirmPassword"
          :label="t('login.confirmLabel')"
          type="password"
          autocomplete="new-password"
          :placeholder="t('login.confirmPlaceholder')"
          size="lg"
          :error="errors.confirmPassword"
        />

        <div>
          <CheckboxField v-model="form.remember" :label="t('login.remember')" />
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
          {{ t('signup.submit') }}
          <template #right>
            <ArrowRight v-if="!loading" class="h-4 w-4" aria-hidden="true" />
          </template>
        </AppButton>
      </form>

      <p class="mt-7 text-center text-[13px] text-muted">
        {{ t('signup.haveAccount') }}
        <Link
          to="/login"
          class="font-medium text-brand-700 underline-offset-4 transition hover:text-brand-900 hover:underline"
        >
          {{ t('signup.loginLink') }}
        </Link>
      </p>
    </div>
  </AuthLayout>
</template>

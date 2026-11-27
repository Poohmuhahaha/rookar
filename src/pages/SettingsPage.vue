<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
  Bell,
  Building2,
  ChevronRight,
  Globe2,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import { getSession, logout, resetAccountData } from '@/lib/mockApi'
import { setSession } from '@/lib/session'
import { apiFetch } from '@/lib/api/client'
import { profileAvatar } from '@/lib/profile'
import { uploadImage, type MediaDto } from '@/lib/media'
import { getAiUsage, type AiUsage } from '@/lib/aiUsage'
import { locale, setLocale, t } from '@/lib/i18n'
import { useToast } from '@/lib/toast'
import type { Session } from '@/types'

const router = useRouter()
const toast = useToast()

const user = computed(() => getSession()?.user)
const business = computed(() => getSession()?.business)

const roleLabel = computed(() => {
  if (user.value?.role === 'owner') return 'เจ้าของธุรกิจ'
  if (user.value?.role === 'manager') return 'ผู้จัดการ'
  if (user.value?.role === 'staff') return 'พนักงาน'
  return 'ผู้ดูแลระบบ'
})

const profileModalOpen = ref(false)
const profileSaving = ref(false)
const profileError = ref('')
const profileDraft = reactive({ name: '', email: '', role: 'owner' })
const profileAvatarInput = ref<HTMLInputElement | null>(null)
const profileFile = ref<File | null>(null)
const profilePreviewUrl = ref('')
const profilePreviewSrc = computed(() => profilePreviewUrl.value || profileAvatar.value)

const roleOptions = computed(() => {
  const options = [
    { value: 'owner', label: 'เจ้าของธุรกิจ' },
    { value: 'manager', label: 'ผู้จัดการ' },
    { value: 'staff', label: 'พนักงาน' },
  ]
  if (user.value?.role === 'admin') {
    options.push({ value: 'admin', label: 'ผู้ดูแลระบบ' })
  }
  return options
})

function resetProfileImage() {
  if (profilePreviewUrl.value) URL.revokeObjectURL(profilePreviewUrl.value)
  profilePreviewUrl.value = ''
  profileFile.value = null
  if (profileAvatarInput.value) profileAvatarInput.value.value = ''
}

function closeProfileModal(open: boolean) {
  profileModalOpen.value = open
  if (!open) {
    profileError.value = ''
    resetProfileImage()
  }
}

function openProfileModal() {
  profileDraft.name = user.value?.name ?? ''
  profileDraft.email = user.value?.email ?? ''
  profileDraft.role = user.value?.role ?? 'owner'
  profileError.value = ''
  resetProfileImage()
  profileModalOpen.value = true
}

function handleProfileFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)')
    input.value = ''
    return
  }
  if (profilePreviewUrl.value) URL.revokeObjectURL(profilePreviewUrl.value)
  profileFile.value = file
  profilePreviewUrl.value = URL.createObjectURL(file)
  input.value = ''
}

onBeforeUnmount(() => {
  if (profilePreviewUrl.value) URL.revokeObjectURL(profilePreviewUrl.value)
})

async function saveProfile() {
  const name = profileDraft.name.trim()
  const email = profileDraft.email.trim().toLowerCase()
  if (name.length < 2) {
    profileError.value = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    profileError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  profileSaving.value = true
  profileError.value = ''
  let media: MediaDto | null = null
  try {
    if (profileFile.value) {
      media = await uploadImage(profileFile.value, {
        kind: 'avatar',
        maxEdge: 512,
        quality: 0.85,
        fileName: 'avatar.webp',
      })
    }
    const data = await apiFetch<{ session: Session }>('/me', {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        email,
        role: profileDraft.role,
        ...(media ? { avatarMediaId: media.id } : {}),
      }),
    })
    setSession(data.session)
    profileModalOpen.value = false
    resetProfileImage()
    toast.success('บันทึกข้อมูลส่วนตัวแล้ว')
  } catch (error) {
    if (media) {
      let linked = true
      try {
        const current = await apiFetch<{ session: Session | null }>('/auth/session')
        linked = current.session?.user.avatarUrl?.includes(media.id) ?? false
      } catch {
        linked = true
      }
      if (!linked) {
        await apiFetch(`/media/${media.id}`, { method: 'DELETE' }).catch(() => undefined)
      }
    }
    profileError.value = error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ'
  } finally {
    profileSaving.value = false
  }
}

const SETTINGS_KEY = 'rookar.settings.v1'
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as {
      notifications?: Record<string, boolean>
    }
  } catch {
    return {}
  }
})()

const notifications = reactive({
  anomaly: saved.notifications?.anomaly ?? true,
  weeklySummary: saved.notifications?.weeklySummary ?? true,
  importDone: saved.notifications?.importDone ?? true,
  productTips: saved.notifications?.productTips ?? false,
})

watch(
  notifications,
  () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        notifications,
      }),
    )
  },
  { deep: true },
)

const notificationItems = [
  { key: 'anomaly', label: 'แจ้งเตือนความผิดปกติ', description: 'เมื่อยอดขายหรือต้นทุนเบี่ยงเบนจากปกติ' },
  { key: 'weeklySummary', label: 'สรุปรายสัปดาห์', description: 'สรุปภาพรวมธุรกิจและคำแนะนำทุกสัปดาห์' },
  { key: 'importDone', label: 'แจ้งเตือนนำเข้าข้อมูล', description: 'เมื่อนำเข้าไฟล์และประมวลผลเสร็จ' },
  { key: 'productTips', label: 'เคล็ดลับการใช้งาน', description: 'ฟีเจอร์ใหม่และวิธีใช้ ROOKAR' },
] as const

const aiUsage = ref<AiUsage | null>(null)

async function loadAiUsage() {
  try {
    aiUsage.value = await getAiUsage()
  } catch {
    aiUsage.value = null
  }
}

function usagePercentOf(value: number | undefined, limit: number | undefined) {
  if (!value || !limit || limit <= 0) return 0
  return Math.min(100, (value / limit) * 100)
}

function usageBarClass(percent: number) {
  if (percent >= 90) return 'bg-rose-600'
  if (percent >= 70) return 'bg-amber-500'
  return 'bg-black'
}

function formatTokenCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

function aiDayPercent() {
  if (!aiUsage.value) return 0
  const { day, limits } = aiUsage.value
  const tokens = day.inputTokens + day.outputTokens
  return Math.max(
    usagePercentOf(day.messages, limits.dailyMessages),
    usagePercentOf(tokens, limits.dailyTotalTokens),
  )
}

function aiMonthPercent() {
  if (!aiUsage.value) return 0
  const { month, limits } = aiUsage.value
  const tokens = month.inputTokens + month.outputTokens
  return Math.max(
    usagePercentOf(month.messages, limits.monthlyMessages),
    usagePercentOf(tokens, limits.monthlyTotalTokens),
  )
}

onMounted(() => {
  void loadAiUsage()
})

function toggleLanguage() {
  const next = locale.value === 'th' ? 'en' : 'th'
  setLocale(next)
  toast.success(t('lang.changedTitle'), t('lang.changedDesc'))
}

function toggleNotification(key: keyof typeof notifications) {
  notifications[key] = !notifications[key]
}

function editBusiness() {
  void router.navigate({ to: '/setup' })
}

async function resetLocalData() {
  const ok = window.confirm('ต้องการล้างข้อมูลบัญชีทั้งหมดหรือไม่? การกระทำนี้ย้อนกลับไม่ได้')
  if (!ok) return
  try {
    await resetAccountData()
    localStorage.clear()
    window.location.assign('/login')
  } catch {
    toast.error('ล้างข้อมูลไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง')
  }
}

async function signOut() {
  await logout()
  await router.navigate({ to: '/login' })
}
</script>

<template>
  <PageHeader
    title="ตั้งค่า"
    description="จัดการบัญชี ข้อมูลธุรกิจ การแจ้งเตือน และความเป็นส่วนตัวของคุณ"
  />

  <div class="space-y-5">
    <div class="grid gap-5 xl:grid-cols-2">
    <article class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10 flex h-full flex-col gap-5 sm:flex-row sm:items-start">
        <button
          type="button"
          class="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200"
          aria-label="แก้ไขรูปโปรไฟล์"
          @click="openProfileModal"
        >
          <img :src="profileAvatar" :alt="user?.name ?? 'Profile'" class="h-full w-full object-cover" />
          <span class="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            <Upload class="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 items-center gap-2">
            <h2 class="truncate text-[24px] font-bold tracking-tight text-ink">{{ user?.name ?? 'ผู้ใช้งาน' }}</h2>
            <button
              type="button"
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/[0.06] hover:text-ink"
              aria-label="แก้ไขข้อมูลส่วนตัว"
              @click="openProfileModal"
            >
              <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <p class="mt-0.5 text-[12.5px] text-muted">{{ user?.email }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <AppBadge tone="neutral">{{ roleLabel }}</AppBadge>
          </div>
        </div>
      </div>
    </article>
      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Sparkles class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">
              {{ locale === 'th' ? 'การใช้งาน AI' : 'AI usage' }}
            </h2>
          </div>

          <template v-if="aiUsage">
            <div class="mt-4 space-y-4">
              <div>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-[12px] font-semibold text-ink">
                    {{ locale === 'th' ? 'วันนี้' : 'Today' }}
                  </p>
                  <p class="text-[11px] text-muted">
                    {{ aiUsage.day.messages }}/{{ aiUsage.limits.dailyMessages }}
                    {{ locale === 'th' ? 'ข้อความ' : 'messages' }} ·
                    {{ formatTokenCount(aiUsage.day.inputTokens + aiUsage.day.outputTokens) }}/{{ formatTokenCount(aiUsage.limits.dailyTotalTokens) }} tokens
                  </p>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10">
                  <div
                    class="h-full rounded-full transition-[width]"
                    :class="usageBarClass(aiDayPercent())"
                    :style="{ width: `${aiDayPercent()}%` }"
                  />
                </div>
                <p class="mt-1.5 text-[10.5px] text-muted">
                  input {{ formatTokenCount(aiUsage.day.inputTokens) }} · output {{ formatTokenCount(aiUsage.day.outputTokens) }}
                </p>
              </div>

              <div>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="text-[12px] font-semibold text-ink">
                    {{ locale === 'th' ? 'เดือนนี้' : 'This month' }}
                  </p>
                  <p class="text-[11px] text-muted">
                    {{ aiUsage.month.messages }}/{{ aiUsage.limits.monthlyMessages }}
                    {{ locale === 'th' ? 'ข้อความ' : 'messages' }} ·
                    {{ formatTokenCount(aiUsage.month.inputTokens + aiUsage.month.outputTokens) }}/{{ formatTokenCount(aiUsage.limits.monthlyTotalTokens) }} tokens
                  </p>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10">
                  <div
                    class="h-full rounded-full transition-[width]"
                    :class="usageBarClass(aiMonthPercent())"
                    :style="{ width: `${aiMonthPercent()}%` }"
                  />
                </div>
                <p class="mt-1.5 text-[10.5px] text-muted">
                  input {{ formatTokenCount(aiUsage.month.inputTokens) }} · output {{ formatTokenCount(aiUsage.month.outputTokens) }}
                </p>
              </div>
            </div>
            <p class="mt-3 text-[10.5px] leading-relaxed text-muted">
              {{
                locale === 'th'
                  ? 'นับ token โดยประมาณ · รีเซ็ตรายวัน/รายเดือนตามเวลาไทย'
                  : 'Token counts are approximate · daily and monthly limits reset in Thailand time'
              }}
            </p>
          </template>
          <p v-else class="mt-4 text-[11.5px] text-muted">
            {{ locale === 'th' ? 'ยังไม่มีข้อมูลการใช้งาน' : 'No usage data yet' }}
          </p>
        </div>
      </article>
    </div>


    <div class="grid gap-5 xl:grid-cols-2">
      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Building2 class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">ข้อมูลธุรกิจ</h2>
          </div>
          <dl class="mt-4 space-y-3">
            <div class="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
              <dt class="text-[12px] text-muted">ชื่อธุรกิจ</dt>
              <dd class="text-right text-[12.5px] font-medium text-ink">{{ business?.name ?? '—' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
              <dt class="text-[12px] text-muted">ประเภทธุรกิจ</dt>
              <dd class="text-right text-[12.5px] font-medium text-ink">{{ business?.typeLabel ?? '—' }}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
              <dt class="text-[12px] text-muted">พนักงาน</dt>
              <dd class="text-right text-[12.5px] font-medium text-ink">{{ business?.employees ?? '—' }} คน</dd>
            </div>
            <div class="flex items-start justify-between gap-4">
              <dt class="text-[12px] text-muted">รายได้ต่อปี</dt>
              <dd class="text-right text-[12.5px] font-medium text-ink">{{ business?.revenueRange ?? '—' }}</dd>
            </div>
          </dl>
          <AppButton variant="secondary" class="mt-5" @click="editBusiness">
            แก้ไขข้อมูลธุรกิจ
            <template #right>
              <ChevronRight class="h-4 w-4" aria-hidden="true" />
            </template>
          </AppButton>
        </div>
      </article>


      <article class="card-fade-static p-6 sm:p-7 lg:hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Sun class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">การตั้งค่าทั่วไป</h2>
          </div>
          <div class="mt-3">
            <div class="flex items-center justify-between gap-4 py-3.5">
              <div class="flex items-center gap-2.5">
                <Globe2 class="h-4 w-4 text-muted" aria-hidden="true" />
                <div>
                  <p class="text-[12.5px] font-medium text-ink">ภาษา</p>
                  <p class="text-[11px] text-muted">{{ locale === 'th' ? 'ภาษาไทย' : 'English' }}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="locale === 'en'"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="locale === 'en' ? 'bg-black' : 'bg-neutral-300'"
                @click="toggleLanguage"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]"
                  :class="locale === 'en' ? 'left-[22px]' : 'left-0.5'"
                />
              </button>
            </div>
          </div>
        </div>
      </article>

      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Bell class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">การแจ้งเตือน</h2>
          </div>
          <div class="mt-3">
            <div
              v-for="item in notificationItems"
              :key="item.key"
              class="flex items-center justify-between gap-4 border-b border-black/5 py-3.5 last:border-b-0"
            >
              <div>
                <p class="text-[12.5px] font-medium text-ink">{{ item.label }}</p>
                <p class="mt-0.5 text-[11px] leading-relaxed text-muted">{{ item.description }}</p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="notifications[item.key]"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="notifications[item.key] ? 'bg-black' : 'bg-neutral-300'"
                @click="toggleNotification(item.key)"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]"
                  :class="notifications[item.key] ? 'left-[22px]' : 'left-0.5'"
                />
              </button>
            </div>
          </div>
        </div>
      </article>

      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <ShieldCheck class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">ข้อมูลและความเป็นส่วนตัว</h2>
          </div>
          <p class="mt-3 text-[12px] leading-relaxed text-muted">
            ข้อมูลธุรกิจและบทสนทนาของคุณถูกเก็บไว้ในระบบ ROOKAR และเข้าถึงได้เฉพาะบัญชีของคุณ
          </p>
          <button
            type="button"
            class="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            @click="resetLocalData"
          >
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            ล้างข้อมูลบัญชี
          </button>
        </div>
      </article>

      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Mail class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">ความช่วยเหลือ</h2>
          </div>
          <div class="mt-3 space-y-1">
            <a
              href="mailto:hello@rookar.co"
              class="flex items-center justify-between gap-3 rounded-xl px-1 py-3 text-[12.5px] font-medium text-ink transition hover:text-brand-700"
            >
              <span class="flex items-center gap-2.5">
                <Mail class="h-4 w-4 text-muted" aria-hidden="true" />
                ติดต่อทีมสนับสนุน
              </span>
              <ChevronRight class="h-4 w-4 text-muted" aria-hidden="true" />
            </a>
            <a
              href="mailto:feedback@rookar.co?subject=Feedback%20ROOKAR"
              class="flex items-center justify-between gap-3 rounded-xl px-1 py-3 text-[12.5px] font-medium text-ink transition hover:text-brand-700"
            >
              <span class="flex items-center gap-2.5">
                <MessageSquare class="h-4 w-4 text-muted" aria-hidden="true" />
                ส่งข้อเสนอแนะ
              </span>
              <ChevronRight class="h-4 w-4 text-muted" aria-hidden="true" />
            </a>
          </div>
        </div>
      </article>
    </div>

    <article class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-base font-bold text-ink">ออกจากระบบ</h2>
          <p class="mt-1 text-[12px] text-muted">ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-[12px] font-semibold text-white transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          @click="signOut"
        >
          <LogOut class="h-4 w-4" aria-hidden="true" />
          ออกจากระบบ
        </button>
      </div>
    </article>

    <AppModal
      :open="profileModalOpen"
      title="แก้ไขข้อมูลส่วนตัว"
      description="แก้ไขรูป ชื่อ อีเมล และบทบาทของคุณ — อีเมลใช้สำหรับเข้าสู่ระบบ"
      @update:open="closeProfileModal"
    >
      <div class="space-y-4">
        <input
          ref="profileAvatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          aria-label="เลือกไฟล์รูปโปรไฟล์"
          @change="handleProfileFile"
        />
        <div class="flex items-center gap-4">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-200">
            <img :src="profilePreviewSrc" :alt="user?.name ?? 'Profile'" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0">
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-3.5 text-[11.5px] font-semibold text-ink transition hover:bg-neutral-200"
              @click="profileAvatarInput?.click()"
            >
              <Upload class="h-3.5 w-3.5" aria-hidden="true" />
              เปลี่ยนรูป
            </button>
            <p class="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              {{ locale === 'th' ? 'JPG, PNG, WebP · ≤ 10 MB' : 'JPG, PNG, WebP · max 10 MB' }}
            </p>
            <button
              v-if="profileFile"
              type="button"
              class="mt-1 text-[10.5px] font-medium text-brand-700 underline-offset-4 hover:underline"
              @click="resetProfileImage"
            >
              {{ locale === 'th' ? 'ใช้รูปเดิม' : 'Use current photo' }}
            </button>
          </div>
        </div>

        <TextField v-model="profileDraft.name" label="ชื่อ-นามสกุล" required />
        <TextField v-model="profileDraft.email" type="email" label="อีเมล" required hint="ใช้สำหรับเข้าสู่ระบบ" />
        <SelectField v-model="profileDraft.role" label="บทบาท" :options="roleOptions" />
        <p v-if="profileError" class="text-[12px] text-danger">{{ profileError }}</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="closeProfileModal(false)">ยกเลิก</AppButton>
        <AppButton :loading="profileSaving" @click="saveProfile">บันทึก</AppButton>
      </template>
    </AppModal>
  </div>
</template>

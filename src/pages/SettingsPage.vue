<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
  Bell,
  Building2,
  ChevronRight,
  CreditCard,
  Globe2,
  LogOut,
  Mail,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
} from '@lucide/vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getSession, logout, resetAccountData } from '@/lib/mockApi'
import { profileAvatar, setProfileAvatar } from '@/lib/profile'
import { useToast } from '@/lib/toast'

const router = useRouter()
const toast = useToast()
const session = getSession()

const user = computed(() => session?.user)
const business = computed(() => session?.business)
const plan = computed(() => session?.plan ?? 'Pro')

const roleLabel = computed(() => {
  if (user.value?.role === 'owner') return 'เจ้าของธุรกิจ'
  if (user.value?.role === 'manager') return 'ผู้จัดการ'
  if (user.value?.role === 'staff') return 'พนักงาน'
  return 'ผู้ดูแลระบบ'
})

const SETTINGS_KEY = 'rookar.settings.v1'
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as {
      theme?: 'light' | 'dark'
      language?: 'th' | 'en'
      notifications?: Record<string, boolean>
    }
  } catch {
    return {}
  }
})()

const theme = ref<'light' | 'dark'>(saved.theme ?? 'light')
const language = ref<'th' | 'en'>(saved.language ?? 'th')
const notifications = reactive({
  anomaly: saved.notifications?.anomaly ?? true,
  weeklySummary: saved.notifications?.weeklySummary ?? true,
  importDone: saved.notifications?.importDone ?? true,
  productTips: saved.notifications?.productTips ?? false,
})

watch(
  [theme, language, notifications],
  () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        theme: theme.value,
        language: language.value,
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

const avatarInput = ref<HTMLInputElement | null>(null)

function pickAvatar() {
  avatarInput.value?.click()
}

function handleAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.error('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP)')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    setProfileAvatar(dataUrl)
    toast.success('อัปเดตรูปโปรไฟล์สำเร็จ')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  toast.success('บันทึกการตั้งค่าธีมแล้ว', theme.value === 'light' ? 'โหมดสว่าง' : 'โหมดมืด')
}

function toggleLanguage() {
  language.value = language.value === 'th' ? 'en' : 'th'
  toast.success('บันทึกการตั้งค่าภาษาแล้ว', language.value === 'th' ? 'ภาษาไทย' : 'English')
}

function toggleNotification(key: keyof typeof notifications) {
  notifications[key] = !notifications[key]
}

function editBusiness() {
  void router.navigate({ to: '/setup' })
}

function goPricing() {
  void router.navigate({ to: '/pricing' })
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
    description="จัดการบัญชี ข้อมูลธุรกิจ แพ็กเกจ การแจ้งเตือน และความเป็นส่วนตัวของคุณ"
  />

  <div class="space-y-5">
    <article class="card-fade-static p-6 sm:p-7">
      <div class="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        <input ref="avatarInput" type="file" accept="image/*" class="sr-only" aria-label="อัปโหลดรูปโปรไฟล์" @change="handleAvatar" />
        <button
          type="button"
          class="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200"
          aria-label="เปลี่ยนรูปโปรไฟล์"
          @click="pickAvatar"
        >
          <img :src="profileAvatar" :alt="user?.name ?? 'Profile'" class="h-full w-full object-cover" />
          <span class="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            <Upload class="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </button>

        <div class="min-w-0 flex-1">
          <h2 class="text-xl font-bold tracking-tight text-ink">{{ user?.name ?? 'ผู้ใช้งาน' }}</h2>
          <p class="mt-0.5 text-[12.5px] text-muted">{{ user?.email }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <AppBadge tone="success">{{ plan }}</AppBadge>
            <AppBadge tone="neutral">{{ roleLabel }}</AppBadge>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-neutral-100 px-3.5 text-[11.5px] font-semibold text-ink transition hover:bg-neutral-200 sm:self-center"
          @click="pickAvatar"
        >
          <Upload class="h-3.5 w-3.5" aria-hidden="true" />
          เปลี่ยนรูป
        </button>
      </div>
    </article>

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

      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <CreditCard class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">แพ็กเกจและการใช้งาน</h2>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-4">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">แพ็กเกจปัจจุบัน</p>
              <p class="mt-1 text-lg font-bold text-ink">ROOKAR {{ plan }}</p>
            </div>
            <AppBadge tone="success">ใช้งานอยู่</AppBadge>
          </div>
          <p class="mt-3 text-[12px] leading-relaxed text-muted">
            แพ็กเกจ {{ plan }} ให้คุณใช้งานแดชบอร์ด ผู้ช่วย AI และการวิเคราะห์จากข้อมูลจริง
          </p>
          <AppButton class="mt-5" @click="goPricing">
            <template #left>
              <Sparkles class="h-4 w-4" aria-hidden="true" />
            </template>
            ดูแพ็กเกจทั้งหมด
          </AppButton>
        </div>
      </article>

      <article class="card-fade-static p-6 sm:p-7">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <Sun class="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 class="text-base font-bold text-ink">การตั้งค่าทั่วไป</h2>
          </div>
          <div class="mt-3">
            <div class="flex items-center justify-between gap-4 border-b border-black/5 py-3.5">
              <div class="flex items-center gap-2.5">
                <component :is="theme === 'light' ? Sun : Moon" class="h-4 w-4 text-muted" aria-hidden="true" />
                <div>
                  <p class="text-[12.5px] font-medium text-ink">ธีม</p>
                  <p class="text-[11px] text-muted">{{ theme === 'light' ? 'โหมดสว่าง' : 'โหมดมืด' }}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="theme === 'dark'"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="theme === 'dark' ? 'bg-black' : 'bg-neutral-300'"
                @click="toggleTheme"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]"
                  :class="theme === 'dark' ? 'left-[22px]' : 'left-0.5'"
                />
              </button>
            </div>
            <div class="flex items-center justify-between gap-4 py-3.5">
              <div class="flex items-center gap-2.5">
                <Globe2 class="h-4 w-4 text-muted" aria-hidden="true" />
                <div>
                  <p class="text-[12.5px] font-medium text-ink">ภาษา</p>
                  <p class="text-[11px] text-muted">{{ language === 'th' ? 'ภาษาไทย' : 'English' }}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="language === 'en'"
                class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                :class="language === 'en' ? 'bg-black' : 'bg-neutral-300'"
                @click="toggleLanguage"
              >
                <span
                  class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left]"
                  :class="language === 'en' ? 'left-[22px]' : 'left-0.5'"
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
  </div>
</template>

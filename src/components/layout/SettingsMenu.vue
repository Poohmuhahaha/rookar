<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from '@tanstack/vue-router'
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  Globe2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Palette,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRound,
} from '@lucide/vue'
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { getSession, logout } from '@/lib/mockApi'
import { profileAvatar, setProfileAvatar } from '@/lib/profile'
import { useToast } from '@/lib/toast'

const props = withDefaults(defineProps<{ variant?: 'default' | 'assistant' }>(), {
  variant: 'default',
})

const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const toast = useToast()
const session = getSession()

const open = ref(false)

// Dynamic user avatar (supports real local file upload)
const avatarInput = ref<HTMLInputElement | null>(null)

function triggerAvatarPicker() {
  open.value = false
  avatarInput.value?.click()
}

function handleAvatarUpload(event: Event) {
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
    toast.success('อัปเดตรูปโปรไฟล์สำเร็จ', 'บันทึกรูปโปรไฟล์ใหม่ของคุณเรียบร้อยแล้ว')
  }
  reader.readAsDataURL(file)
}

// Modal types
type ModalType =
  | 'notifications'
  | 'privacy'
  | 'feedback'
  | 'support'
  | 'activity'
  | null

const activeModal = ref<ModalType>(null)

function openModal(type: ModalType) {
  open.value = false
  activeModal.value = type
}

// 1. Theme toggle
const currentTheme = ref<'สว่าง' | 'มืด'>('สว่าง')
function toggleTheme() {
  open.value = false
  currentTheme.value = currentTheme.value === 'สว่าง' ? 'มืด' : 'สว่าง'
  toast.success('เปลี่ยนธีมแล้ว', `ขณะนี้ใช้งานโหมด${currentTheme.value}`)
}

// 2. Language toggle
const currentLang = ref<'ไทย' | 'English'>('ไทย')
function toggleLang() {
  open.value = false
  currentLang.value = currentLang.value === 'ไทย' ? 'English' : 'ไทย'
  toast.success('เปลี่ยนภาษาสำเร็จ', `Switched language to ${currentLang.value}`)
}

// 3. Notifications state
const notifications = reactive({
  anomaly: true,
  weeklySummary: true,
  importDone: true,
  productTips: false,
})

function toggleNotification(key: keyof typeof notifications) {
  notifications[key] = !notifications[key]
  toast.info('บันทึกการตั้งค่าแล้ว', notifications[key] ? 'เปิดการแจ้งเตือน' : 'ปิดการแจ้งเตือน')
}

// 4. Feedback state
const feedbackRating = ref(5)
const feedbackCategory = ref('การใช้งานทั่วไป')
const feedbackCategories = ['การใช้งานทั่วไป', 'ความแม่นยำ AI', 'ความเร็ว', 'อยากได้ฟีเจอร์เพิ่ม']
const feedbackText = ref('')
const feedbackSubmitting = ref(false)

function submitFeedback() {
  if (!feedbackText.value.trim()) {
    toast.error('กรุณาระบุความคิดเห็น', 'พิมพ์ข้อความสั้นๆ เพื่อให้ทีมงานนำไปปรับปรุง')
    return
  }
  feedbackSubmitting.value = true
  setTimeout(() => {
    feedbackSubmitting.value = false
    activeModal.value = null
    feedbackText.value = ''
    toast.success('ขอบคุณสำหรับข้อเสนอแนะ!', 'ทีมงานได้รับความคิดเห็นของคุณเรียบร้อยแล้ว')
  }, 400)
}

// 6. Reset cache action
function resetLocalCache() {
  activeModal.value = null
  localStorage.clear()
  toast.info('ล้างข้อมูลเรียบร้อย', 'ระบบกำลังรีโหลดข้อมูลเริ่มต้น...')
  setTimeout(() => {
    window.location.reload()
  }, 500)
}

async function goToBusiness() {
  open.value = false
  emit('close')
  await router.navigate({ to: '/setup' })
}

async function signOut() {
  open.value = false
  emit('close')
  await logout()
  await router.navigate({ to: '/login' })
}
</script>

<template>
  <!-- Hidden File Input for Real Avatar Upload -->
  <input
    ref="avatarInput"
    type="file"
    accept="image/*"
    class="sr-only"
    aria-label="อัปโหลดรูปโปรไฟล์"
    @change="handleAvatarUpload"
  />

  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button
        v-if="variant === 'assistant'"
        type="button"
        class="group w-full rounded-[24px] bg-[#f4f5f7] p-3 text-left transition hover:bg-neutral-200/70 focus-visible:outline-none"
        aria-label="เปิดเมนูตั้งค่าและโปรไฟล์"
      >
        <span class="flex w-full flex-col gap-2.5">
          <span class="flex items-center gap-2.5">
            <span class="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
              <img
                :src="profileAvatar"
                :alt="session?.user.name ?? 'Profile'"
                class="h-full w-full object-cover"
              />
              <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-black ring-2 ring-white" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13px] font-bold text-ink">{{ session?.user.name ?? 'ภีม ธีรภัทร' }}</span>
              <span class="block truncate text-[11px] text-muted">@{{ session?.user.email ? session.user.email.split('@')[0] : 'demo' }}</span>
            </span>
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition group-hover:text-black">
              <Settings class="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        </span>
      </button>
      <button
        v-else
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:outline-none"
        aria-label="เปิดเมนูตั้งค่า"
      >
        <span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200">
          <img :src="profileAvatar" :alt="session?.user.name ?? 'Profile'" class="h-full w-full object-cover" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[12px] font-medium text-ink">{{ session?.user.name ?? 'ผู้ใช้งาน' }}</span>
        </span>
        <Settings class="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        side="top"
        align="start"
        :side-offset="8"
        :collision-padding="12"
        class="settings-popover popover-zoom-in no-scrollbar z-[70] max-h-[min(82vh,620px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-[32px] bg-white p-3 shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06] focus:outline-none"
        aria-label="เมนูตั้งค่า"
      >

        <!-- 2. การตั้งค่า -->
        <section class="py-1">
          <h2 class="px-3 pb-1 pt-2 text-[11px] font-semibold text-muted uppercase tracking-wider">การตั้งค่า</h2>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="toggleTheme"
          >
            <Palette class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ธีม</span>
            <span class="text-[11px] font-medium text-muted">{{ currentTheme }}</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="toggleLang"
          >
            <Globe2 class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ภาษา</span>
            <span class="text-[11px] font-medium text-muted">{{ currentLang }}</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="openModal('notifications')"
          >
            <Bell class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">การแจ้งเตือน</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="triggerAvatarPicker"
          >
            <UserRound class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">รูปโปรไฟล์</span>
            <span class="text-[11px] font-medium text-brand-700">เปลี่ยนรูป</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
        </section>

        <!-- 3. ข้อมูลและความเป็นส่วนตัว -->
        <section class="py-1">
          <h2 class="px-3 pb-1 pt-2 text-[11px] font-semibold text-muted uppercase tracking-wider">ข้อมูลและความเป็นส่วนตัว</h2>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="goToBusiness"
          >
            <Building2 class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ข้อมูลธุรกิจ</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="openModal('privacy')"
          >
            <ShieldCheck class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ความเป็นส่วนตัว</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="openModal('feedback')"
          >
            <MessageSquare class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ส่งความคิดเห็น</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="openModal('support')"
          >
            <CircleHelp class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">ติดต่อทีมงาน</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-[#f4f5f7] focus-visible:outline-none"
            @click="openModal('activity')"
          >
            <Activity class="h-4 w-4 text-muted" aria-hidden="true" />
            <span class="flex-1">กิจกรรม</span>
            <ChevronRight class="h-3.5 w-3.5 text-faint" aria-hidden="true" />
          </button>
        </section>

        <!-- 4. ออกจากระบบ -->
        <section class="py-1">
          <button
            type="button"
            class="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none"
            @click="signOut"
          >
            <LogOut class="h-4 w-4 text-rose-600" aria-hidden="true" />
            <span class="flex-1">ออกจากระบบ</span>
          </button>
        </section>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>




  <!-- ============================================================== -->
  <!-- MODAL 4: การแจ้งเตือน (Notifications) -->
  <!-- ============================================================== -->
  <AppModal
    :open="activeModal === 'notifications'"
    title="การแจ้งเตือน"
    description="ตั้งค่าช่องทางและประเภทข้อมูลที่คุณต้องการรับการแจ้งเตือน"
    size="md"
    @update:open="activeModal = null"
  >
    <div class="space-y-3 pt-1">
      <div
        class="flex items-center justify-between rounded-2xl bg-[#f4f5f7] p-3.5 cursor-pointer transition hover:bg-[#eceef1]"
        @click="toggleNotification('anomaly')"
      >
        <div>
          <p class="text-[13px] font-semibold text-ink">แจ้งเตือนต้นทุนผิดปกติ</p>
          <p class="text-[11px] text-muted">แจ้งเมื่อ AI ตรวจพบรายการค่าใช้จ่ายหรือต้นทุนสูงผิดปกติ</p>
        </div>
        <span
          :class="[
            'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
            notifications.anomaly ? 'bg-black justify-end' : 'bg-neutral-300 justify-start',
          ]"
        >
          <span class="h-4 w-4 rounded-full bg-white" />
        </span>
      </div>

      <div
        class="flex items-center justify-between rounded-2xl bg-[#f4f5f7] p-3.5 cursor-pointer transition hover:bg-[#eceef1]"
        @click="toggleNotification('weeklySummary')"
      >
        <div>
          <p class="text-[13px] font-semibold text-ink">สรุปภาพรวมธุรกิจประจำสัปดาห์</p>
          <p class="text-[11px] text-muted">รับรายงานสรุปรายได้ กำไร และต้นทุนผ่านทางอีเมลทุกวันจันทร์</p>
        </div>
        <span
          :class="[
            'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
            notifications.weeklySummary ? 'bg-black justify-end' : 'bg-neutral-300 justify-start',
          ]"
        >
          <span class="h-4 w-4 rounded-full bg-white" />
        </span>
      </div>

      <div
        class="flex items-center justify-between rounded-2xl bg-[#f4f5f7] p-3.5 cursor-pointer transition hover:bg-[#eceef1]"
        @click="toggleNotification('importDone')"
      >
        <div>
          <p class="text-[13px] font-semibold text-ink">แจ้งเมื่อนำเข้าไฟล์สำเร็จ</p>
          <p class="text-[11px] text-muted">แจ้งเตือนเมื่อระบบจัดระเบียบและตรวจสอบข้อมูลเสร็จสิ้น</p>
        </div>
        <span
          :class="[
            'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
            notifications.importDone ? 'bg-black justify-end' : 'bg-neutral-300 justify-start',
          ]"
        >
          <span class="h-4 w-4 rounded-full bg-white" />
        </span>
      </div>

      <div
        class="flex items-center justify-between rounded-2xl bg-[#f4f5f7] p-3.5 cursor-pointer transition hover:bg-[#eceef1]"
        @click="toggleNotification('productTips')"
      >
        <div>
          <p class="text-[13px] font-semibold text-ink">เคล็ดลับและอัปเดตฟีเจอร์ใหม่</p>
          <p class="text-[11px] text-muted">รับคำแนะนำการใช้ AI ในการบริหารธุรกิจและอัปเดตความสามารถใหม่</p>
        </div>
        <span
          :class="[
            'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
            notifications.productTips ? 'bg-black justify-end' : 'bg-neutral-300 justify-start',
          ]"
        >
          <span class="h-4 w-4 rounded-full bg-white" />
        </span>
      </div>

      <div class="flex justify-end pt-2">
        <AppButton size="sm" @click="activeModal = null">บันทึกเรียบร้อย</AppButton>
      </div>
    </div>
  </AppModal>

  <!-- ============================================================== -->
  <!-- MODAL 5: ความเป็นส่วนตัว (Privacy) -->
  <!-- ============================================================== -->
  <AppModal
    :open="activeModal === 'privacy'"
    title="ข้อมูลและความเป็นส่วนตัว"
    description="ROOKAR ให้ความสำคัญสูงสุดกับการปกป้องข้อมูลธุรกิจของคุณ"
    size="md"
    @update:open="activeModal = null"
  >
    <div class="space-y-3.5 pt-1">
      <div class="rounded-2xl bg-[#f4f5f7] p-4 space-y-3 text-xs">
        <div class="flex items-start gap-2.5">
          <ShieldCheck class="h-4 w-4 text-black shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-ink">Local-First Storage</p>
            <p class="mt-0.5 text-muted leading-relaxed">ข้อมูลยอดขาย ต้นทุน และบทสนทนาถูกจัดเก็บไว้ในเครื่องของคุณ ปลอดภัยจากการเข้าถึงโดยไม่ได้รับอนุญาต</p>
          </div>
        </div>
        <div class="flex items-start gap-2.5">
          <Lock class="h-4 w-4 text-black shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-ink">ไม่นำข้อมูลไปเทรน AI สาธารณะ</p>
            <p class="mt-0.5 text-muted leading-relaxed">ตัวเลขการเงินของคุณจะไม่ถูกนำไปใช้เป็นข้อมูลฝึกสอนโมเดล AI ใดๆ</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-rose-50 p-4">
        <p class="text-xs font-bold text-rose-700">รีเซ็ตข้อมูลในเครื่อง</p>
        <p class="mt-1 text-[11px] text-rose-700/80 leading-relaxed">
          หากต้องการลบแคชข้อมูลตัวอย่างทั้งหมดและเริ่มใหม่ สามารถกดปุ่มด้านล่างได้ทันที
        </p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800"
          @click="resetLocalCache"
        >
          <Trash2 class="h-3.5 w-3.5" />
          ล้างข้อมูลในเครื่องทั้งหมด
        </button>
      </div>

      <div class="flex justify-end pt-1">
        <AppButton size="sm" @click="activeModal = null">เข้าใจแล้ว</AppButton>
      </div>
    </div>
  </AppModal>

  <!-- ============================================================== -->
  <!-- MODAL 6: ส่งความคิดเห็น (Feedback) -->
  <!-- ============================================================== -->
  <AppModal
    :open="activeModal === 'feedback'"
    title="ส่งความคิดเห็นถึงทีมงาน"
    description="ข้อเสนอแนะของคุณมีค่าอย่างยิ่งในการพัฒนา ROOKAR ให้ดียิ่งขึ้น"
    size="md"
    @update:open="activeModal = null"
  >
    <div class="space-y-4 pt-1">
      <div>
        <label class="block text-xs font-semibold text-ink">ระดับความพึงพอใจ</label>
        <div class="mt-2 flex gap-2">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f5f7] transition hover:bg-amber-100"
            @click="feedbackRating = star"
          >
            <Star
              :class="[
                'h-5 w-5',
                star <= feedbackRating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300',
              ]"
            />
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-ink">หมวดหมู่ข้อเสนอแนะ</label>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button
            v-for="cat in feedbackCategories"
            :key="cat"
            type="button"
            :class="[
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              feedbackCategory === cat ? 'bg-ink text-white' : 'bg-[#f4f5f7] text-muted hover:text-ink',
            ]"
            @click="feedbackCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-ink">ข้อความของคุณ</label>
        <textarea
          v-model="feedbackText"
          rows="3"
          placeholder="บอกเล่าสิ่งที่คุณชอบ หรือสิ่งที่อยากให้เราปรับปรุง..."
          class="mt-2 w-full rounded-2xl bg-[#f4f5f7] p-3 text-xs text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <AppButton variant="secondary" size="sm" @click="activeModal = null">ยกเลิก</AppButton>
        <AppButton size="sm" :loading="feedbackSubmitting" @click="submitFeedback">
          ส่งความคิดเห็น
        </AppButton>
      </div>
    </div>
  </AppModal>

  <!-- ============================================================== -->
  <!-- MODAL 7: ติดต่อทีมงาน (Support) -->
  <!-- ============================================================== -->
  <AppModal
    :open="activeModal === 'support'"
    title="ติดต่อทีมสนับสนุน"
    description="ทีมงาน ROOKAR ยินดีช่วยเหลือทุกข้อสงสัยในการใช้งาน"
    size="md"
    @update:open="activeModal = null"
  >
    <div class="space-y-3 pt-1">
      <div class="flex items-center justify-between rounded-2xl bg-neutral-200/60 p-3.5">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-black animate-pulse" />
          <span class="text-xs font-bold text-black">ทีมงานพร้อมช่วยเหลือ (ออนไลน์)</span>
        </div>
        <span class="text-[11px] text-neutral-600">ตอบกลับภายใน 15 นาที</span>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href="https://line.me"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 rounded-2xl bg-[#f4f5f7] p-3.5 transition hover:bg-[#eceef1]"
        >
          <MessageSquare class="h-5 w-5 text-black shrink-0" />
          <div>
            <p class="text-xs font-bold text-ink">LINE Official</p>
            <p class="text-[11px] text-muted">@rookar (แชทด่วน)</p>
          </div>
        </a>

        <a
          href="mailto:hello@rookar.co"
          class="flex items-center gap-3 rounded-2xl bg-[#f4f5f7] p-3.5 transition hover:bg-[#eceef1]"
        >
          <Mail class="h-5 w-5 text-ink shrink-0" />
          <div>
            <p class="text-xs font-bold text-ink">Email Support</p>
            <p class="text-[11px] text-muted">hello@rookar.co</p>
          </div>
        </a>
      </div>

      <div class="rounded-2xl bg-[#f4f5f7] p-3.5 text-xs text-muted flex items-center justify-between">
        <span>เวลาทำการ:</span>
        <span class="font-medium text-ink">จันทร์ – ศุกร์ 09:00 – 18:00 น.</span>
      </div>

      <div class="flex justify-end pt-2">
        <AppButton size="sm" @click="activeModal = null">ปิด</AppButton>
      </div>
    </div>
  </AppModal>

  <!-- ============================================================== -->
  <!-- MODAL 8: บันทึกกิจกรรม (Activity Log) -->
  <!-- ============================================================== -->
  <AppModal
    :open="activeModal === 'activity'"
    title="บันทึกกิจกรรมล่าสุด"
    description="ประวัติการดำเนินการและการเข้าใช้งานบัญชีของคุณ"
    size="md"
    @update:open="activeModal = null"
  >
    <div class="space-y-3 pt-1">
      <div class="rounded-2xl bg-[#f4f5f7] p-3.5 flex items-start gap-3">
        <span class="h-2 w-2 rounded-full bg-black mt-1.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-ink">นำเข้าข้อมูลยอดขายสำเร็จ</p>
          <p class="text-[11px] text-muted truncate">ไฟล์ sample-sales.csv (142 แถว) โดยคุณ</p>
        </div>
        <span class="text-[10px] text-muted shrink-0">2 ชั่วโมงที่แล้ว</span>
      </div>

      <div class="rounded-2xl bg-[#f4f5f7] p-3.5 flex items-start gap-3">
        <span class="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-ink">AI วิเคราะห์โครงสร้างต้นทุน</p>
          <p class="text-[11px] text-muted truncate">สร้างรายงานสรุปกำไรสุทธิและจุดเสี่ยง</p>
        </div>
        <span class="text-[10px] text-muted shrink-0">เมื่อวาน 16:30 น.</span>
      </div>

      <div class="rounded-2xl bg-[#f4f5f7] p-3.5 flex items-start gap-3">
        <span class="h-2 w-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-ink">อัปเดตข้อมูลธุรกิจ</p>
          <p class="text-[11px] text-muted truncate">บันทึกเป้าหมาย: เพิ่มกำไร, ลดต้นทุน</p>
        </div>
        <span class="text-[10px] text-muted shrink-0">2 วันที่แล้ว</span>
      </div>

      <div class="rounded-2xl bg-[#f4f5f7] p-3.5 flex items-start gap-3">
        <span class="h-2 w-2 rounded-full bg-neutral-600 mt-1.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-ink">เข้าสู่ระบบสำเร็จ</p>
          <p class="text-[11px] text-muted truncate">จากเบราว์เซอร์ Linux (Chrome/Firefox)</p>
        </div>
        <span class="text-[10px] text-muted shrink-0">วันนี้ 04:30 น.</span>
      </div>

      <div class="flex justify-end pt-2">
        <AppButton size="sm" @click="activeModal = null">ปิด</AppButton>
      </div>
    </div>
  </AppModal>
</template>
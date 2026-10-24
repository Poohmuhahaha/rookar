<script setup lang="ts">
import { ref } from 'vue'
import { Link, useRouter } from '@tanstack/vue-router'
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Database,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from '@lucide/vue'
import LogoMark from '@/components/brand/LogoMark.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getSession } from '@/lib/mockApi'

const router = useRouter()
const session = getSession()

const faqs = [
  {
    q: 'จำเป็นต้องมีความรู้เรื่องบัญชีหรือการเงินมาก่อนไหม?',
    a: 'ไม่จำเป็นเลยครับ ROOKAR ออกแบบมาเพื่อให้ผู้ประกอบการเข้าใจตัวเลขได้ทันที มีภาษาไทยที่เข้าใจง่าย และมีผู้ช่วย AI ช่วยแปลความหมายพร้อมให้คำแนะนำในเชิงธุรกิจ',
  },
  {
    q: 'ไฟล์ประเภทไหนบ้างที่สามารถนำเข้ามาในระบบได้?',
    a: 'รองรับไฟล์ CSV และ Excel ยอดนิยม เช่น ยอดขายรายวันจากระบบ POS, รายการซื้อวัตถุดิบ, ตารางค่าแรงพนักงาน และค่าใช้จ่ายทั่วไป โดยระบบมี AI ช่วยจับคู่หัวตารางอัตโนมัติ',
  },
  {
    q: 'ข้อมูลธุรกิจของฉันจะปลอดภัยหรือไม่?',
    a: 'ปลอดภัย 100% ครับ เราปฏิบัติตามมาตรฐาน PDPA และในเวอร์ชันทดลอง ข้อมูลทั้งหมดจะถูกจัดเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น คุณสามารถลบข้อมูลทั้งหมดได้ทุกเมื่อที่ต้องการ',
  },
  {
    q: 'ช่วง Closed Trial มีค่าใช้จ่ายหรือไม่?',
    a: 'ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้นครับ ผู้ประกอบการที่ได้รับคัดเลือกเข้าร่วม Closed Trial จะได้ใช้งานฟีเจอร์ระดับ Pro ครบทุกมิติฟรีโดยไม่มีข้อผูกมัด',
  },
]

const activeFaq = ref<number | null>(0)
function toggleFaq(index: number) {
  activeFaq.value = activeFaq.value === index ? null : index
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F9F9] text-ink selection:bg-black selection:text-white">
    <!-- Navigation Bar -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" class="flex items-center gap-2.5">
          <LogoMark :size="32" />
          <span class="text-base font-bold tracking-tight text-ink">ROOKAR</span>
        </Link>

        <nav class="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-neutral-600">
          <a href="#features" class="transition hover:text-black">ฟีเจอร์เด่น</a>
          <a href="#how-it-works" class="transition hover:text-black">ขั้นตอนการทำงาน</a>
          <Link to="/pricing" class="transition hover:text-black">ตารางราคา</Link>
          <a href="#faq" class="transition hover:text-black">คำถามพบบ่อย</a>
        </nav>

        <div class="flex items-center gap-3">
          <template v-if="session">
            <Link
              to="/app"
              class="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              ไปที่แดชบอร์ด
              <ArrowRight class="h-3.5 w-3.5" />
            </Link>
          </template>
          <template v-else>
            <Link
              to="/login"
              class="hidden sm:inline-flex text-[13px] font-semibold text-ink hover:text-neutral-600 transition px-2"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/signup"
              class="inline-flex h-9.5 items-center justify-center rounded-full bg-black px-4 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              เริ่มทดลองฟรี
            </Link>
          </template>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <!-- Badge -->
        <div class="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-neutral-800 mb-6 shadow-xs">
          <span class="flex h-2 w-2 rounded-full bg-black" />
          <span class="font-bold">ROOK-AR (รู้ค้า)</span>
          <span class="text-neutral-400">·</span>
          <span>ai-Augmented Revenue for business ROOKie</span>
        </div>

        <h1 class="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl leading-[1.15]">
          AI Business Decision Workspace<br class="hidden sm:inline" />
          <span class="text-neutral-500 font-bold">เพื่อการวิเคราะห์และตัดสินใจธุรกิจไทย</span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted">
          ROOKAR เปลี่ยนไฟล์ยอดขายและต้นทุนที่กระจัดกระจาย ให้เป็นพื้นที่ทำงานตัดสินใจทางธุรกิจด้วย Specialist AI ที่เข้าใจบริบท ตรวจสอบที่มาได้ และแปลงข้อมูลเป็น Next Action ทันที
        </p>

        <!-- CTA Buttons -->
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            class="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-black px-7 text-sm font-bold text-white transition hover:bg-neutral-800"
          >
            เริ่มต้นใช้งานฟรี (ไม่ต้องผูกบัตร)
            <ArrowRight class="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            class="flex h-12 w-full sm:w-auto items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-neutral-100"
          >
            เข้าใช้งานบัญชีทดลอง
          </Link>
        </div>

        <p class="mt-4 text-xs text-muted">
          ✦ ใช้งานได้ทันทีใน 3 นาที · รองรับ CSV/Excel ทุกระบบ POS · สอดคล้องตามมาตรฐาน PDPA
        </p>

        <!-- Interactive Dashboard Preview Card -->
        <div class="mt-12 sm:mt-16 overflow-hidden rounded-[28px] bg-white p-4 sm:p-6 text-left">
          <div class="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div class="flex items-center gap-3">
              <span class="h-3 w-3 rounded-full bg-neutral-300" />
              <span class="h-3 w-3 rounded-full bg-neutral-300" />
              <span class="h-3 w-3 rounded-full bg-neutral-300" />
              <span class="ml-2 text-xs font-semibold text-ink">ROOKAR Workspace — บลูมมิ่ง คอฟฟี่</span>
            </div>
            <span class="rounded-full bg-black px-2.5 py-0.5 text-[11px] font-semibold text-white">Live Preview</span>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-2xl bg-[#f4f5f7] p-4">
              <p class="text-[11px] text-muted">รายได้รวม (6 เดือน)</p>
              <p class="mt-1 text-xl font-extrabold text-ink">฿6,248,500</p>
              <span class="mt-1 inline-block text-[10.5px] font-semibold text-black">↗ +12.4%</span>
            </div>
            <div class="rounded-2xl bg-[#f4f5f7] p-4">
              <p class="text-[11px] text-muted">กำไรสุทธิ</p>
              <p class="mt-1 text-xl font-extrabold text-ink">฿1,681,800</p>
              <span class="mt-1 inline-block text-[10.5px] font-semibold text-black">↗ +8.1%</span>
            </div>
            <div class="rounded-2xl bg-[#f4f5f7] p-4">
              <p class="text-[11px] text-muted">ต้นทุนรวม</p>
              <p class="mt-1 text-xl font-extrabold text-ink">฿4,566,700</p>
              <span class="mt-1 inline-block text-[10.5px] font-semibold text-black">↗ +3.2%</span>
            </div>
            <div class="rounded-2xl bg-[#f4f5f7] p-4">
              <p class="text-[11px] text-muted">อัตรากำไร (Margin)</p>
              <p class="mt-1 text-xl font-extrabold text-ink">26.9%</p>
              <span class="mt-1 inline-block text-[10.5px] font-semibold text-black">↗ +1.8% จุด</span>
            </div>
          </div>

          <!-- Insight Box -->
          <div class="mt-4 rounded-2xl bg-black p-4 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles class="h-4 w-4 text-white" />
              </div>
              <div>
                <p class="text-xs font-bold text-white">AI ตรวจพบ: ต้นทุนบรรจุภัณฑ์กำลังกัดกำไร 6.2%</p>
                <p class="text-[11px] text-neutral-400">ถ้าเจรจาลดราคาแพ็กเกจจิ้ง 5% กำไรสุทธิจะเพิ่มทันที +฿118,734</p>
              </div>
            </div>
            <Link
              to="/signup"
              class="hidden sm:inline-flex text-xs font-semibold text-white underline underline-offset-4 hover:text-neutral-300"
            >
              ทดลองใช้งานจริง →
            </Link>
          </div>
        </div>
      </div>
    </section>

    <!-- 4 Core Pillars (จาก Slide 3 ของ Pitch Deck) -->
    <section id="features" class="py-16 bg-white">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold uppercase tracking-wider text-neutral-500">4 เสาหลักของ ROOKAR</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            พื้นที่ทำงาน AI สำหรับการตัดสินใจธุรกิจ
          </h2>
          <p class="mt-3 text-sm text-muted">
            ไม่ใช่แค่แชตบอตทั่วไป แต่คือโครงสร้าง AI Workspace ที่ออกแบบมาเพื่อแก้ไข Pain Point ของ SME ไทยโดยเฉพาะ
          </p>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-[28px] bg-[#f4f5f7] p-6 transition hover:bg-neutral-200/60">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <Boxes class="h-5 w-5" />
            </div>
            <h3 class="mt-5 text-base font-bold text-ink">1. Project Context</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              สร้างพื้นที่แยกเฉพาะแต่ละธุรกิจ เก็บเป้าหมาย ข้อมูล และประวัติการสนทนาให้ต่อเนื่อง โดยผู้ใช้ควบคุม Memory และข้อมูลส่วนบุคคลได้
            </p>
          </div>

          <div class="rounded-[28px] bg-[#f4f5f7] p-6 transition hover:bg-neutral-200/60">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <Sparkles class="h-5 w-5" />
            </div>
            <h3 class="mt-5 text-base font-bold text-ink">2. Specialist AI</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              ผู้เชี่ยวชาญ 4 ด้าน: Finance, Market, Strategy และ Business Planning ทำงานจากบริบทร่วมกัน ลดการเริ่มต้นอธิบายใหม่ทุกครั้ง
            </p>
          </div>

          <div class="rounded-[28px] bg-[#f4f5f7] p-6 transition hover:bg-neutral-200/60">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <ShieldCheck class="h-5 w-5" />
            </div>
            <h3 class="mt-5 text-base font-bold text-ink">3. Sources & Trust</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              ให้ความสำคัญกับข้อมูลร้านและแหล่งทางการไทย (สศช., ธปท.) พร้อมบอกข้อจำกัด ไม่สร้าง AI Certainty เกินจริง
            </p>
          </div>

          <div class="rounded-[28px] bg-[#f4f5f7] p-6 transition hover:bg-neutral-200/60">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
              <LayoutDashboard class="h-5 w-5" />
            </div>
            <h3 class="mt-5 text-base font-bold text-ink">4. Multi-Output</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              ผลลัพธ์ไม่ได้มีแค่ข้อความ แต่ต่อยอดเป็นตาราง กราฟ จำลอง What-If และแปลงเป็น Action Plan สำหรับลงมือทำจริง
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="py-16">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-xs font-bold uppercase tracking-wider text-neutral-500">ง่ายและรวดเร็ว</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            เริ่มใช้งานใน 3 ขั้นตอน
          </h2>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div class="rounded-[28px] bg-white p-7 text-center">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white mb-4">1</span>
            <h3 class="text-base font-bold text-ink">สมัครสมาชิกและบอกเป้าหมาย</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              กรอกข้อมูลธุรกิจคร่าวๆ เพื่อให้ AI ปรับคำแนะนำให้เหมาะกับขนาดและประเภทธุรกิจของคุณ
            </p>
          </div>

          <div class="rounded-[28px] bg-white p-7 text-center">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white mb-4">2</span>
            <h3 class="text-base font-bold text-ink">อัปโหลดไฟล์แรกของคุณ</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              ลากวางไฟล์ CSV ยอดขายหรือต้นทุน หรือเลือกกดปุ่มลองใช้ข้อมูลตัวอย่าง (Demo) ได้ทันที
            </p>
          </div>

          <div class="rounded-[28px] bg-white p-7 text-center">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white mb-4">3</span>
            <h3 class="text-base font-bold text-ink">สั่งการและคุยกับ AI</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              เห็นภาพรวมธุรกิจบนแดชบอร์ด และปรึกษา AI เพื่อหาจุดรั่วไหลของต้นทุนและเพิ่มกำไรได้เลย
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-16 bg-white">
      <div class="mx-auto max-w-3xl px-6">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold tracking-tight text-ink">คำถามที่พบบ่อย (FAQ)</h2>
          <p class="mt-2 text-sm text-muted">ทุกข้อสงสัยเกี่ยวกับการใช้งานและช่วง Closed Trial</p>
        </div>

        <div class="mt-10 space-y-3">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="rounded-2xl bg-[#f4f5f7] p-5 cursor-pointer transition hover:bg-neutral-200/70"
            @click="toggleFaq(idx)"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-ink">{{ faq.q }}</h3>
              <ChevronRight
                class="h-4 w-4 text-muted transition-transform duration-200"
                :class="activeFaq === idx ? 'rotate-90' : ''"
              />
            </div>
            <p v-if="activeFaq === idx" class="mt-3 text-[13px] leading-relaxed text-muted border-t border-neutral-200 pt-3">
              {{ faq.a }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA Banner -->
    <section class="py-16">
      <div class="mx-auto max-w-4xl px-6">
        <div class="rounded-[32px] bg-black p-8 sm:p-12 text-center text-white">
          <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            พร้อมเห็นตัวเลขธุรกิจของคุณชัดเจนขึ้นแล้วหรือยัง?
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-neutral-400">
            สมัครเข้าร่วม Closed Trial วันนี้ เพื่อรับสิทธิ์ใช้งาน ROOKAR Pro ฟรีตลอดช่วงทดสอบ
          </p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              class="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-black transition hover:bg-neutral-100"
            >
              เริ่มต้นใช้งานฟรีทันที
              <ArrowRight class="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-neutral-200/80 bg-white py-10">
      <div class="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div class="flex items-center gap-2">
          <LogoMark :size="20" />
          <span class="font-bold text-ink">ROOKAR</span>
          <span>© 2026 ROOKAR. All rights reserved.</span>
        </div>
        <div class="flex items-center gap-6">
          <Link to="/pricing" class="hover:text-black">ตารางราคา</Link>
          <Link to="/login" class="hover:text-black">เข้าสู่ระบบ</Link>
          <a href="mailto:hello@rookar.co" class="hover:text-black">ติดต่อทีมงาน</a>
        </div>
      </div>
    </footer>
  </div>
</template>

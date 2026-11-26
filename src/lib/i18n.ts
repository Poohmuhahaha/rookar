import { ref } from 'vue'

export type Locale = 'th' | 'en'

const STORAGE_KEY = 'rookar.language'

export const locale = ref<Locale>('th')

if (typeof window !== 'undefined') {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'th' || saved === 'en') locale.value = saved
  document.documentElement.lang = locale.value
}

export function setLocale(next: Locale) {
  locale.value = next
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }
}

const th = {
  'layout.headlineA': 'เห็นทุกตัวเลข',
  'layout.headlineB': 'ตัดสินใจได้มั่นใจขึ้น',
  'layout.subtitle':
    'ROOKAR รวมข้อมูลธุรกิจของคุณไว้ที่เดียว แล้วเปลี่ยนเป็นคำตอบที่ใช้ตัดสินใจได้จริง',
  'layout.point1': 'ข้อมูลธุรกิจรวมที่เดียว',
  'layout.point2': 'AI วิเคราะห์จากข้อมูลจริง',
  'layout.point3': 'ตัดสินใจด้วยตัวเลขที่ชัดเจน',
  'layout.quote': '“เลิกเดาจากความรู้สึก เริ่มดูจากตัวเลขที่เกิดขึ้นจริง”',
  'layout.footer': '© 2569 ROOKAR · เวอร์ชันทดลอง',
  'layout.kpiLabel': 'รายได้รวม',
  'layout.kpiNote': 'เทียบช่วงก่อน',
  'layout.kpiInfo': 'รายได้รวมจากทุกช่องทางในช่วง 6 เดือนล่าสุด',

  'policy.terms': 'ข้อกำหนดการใช้งาน',
  'policy.privacy': 'นโยบายความเป็นส่วนตัว',

  'common.email': 'อีเมล',
  'common.emailPlaceholder': 'you@company.com',
  'common.password': 'รหัสผ่าน',
  'common.passwordPlaceholder': 'อย่างน้อย 8 ตัวอักษร',
  'common.backToLogin': 'กลับไปเข้าสู่ระบบ',

  'err.required': 'กรุณากรอกข้อมูลให้ครบ',
  'err.emailRequired': 'กรุณากรอกอีเมล',
  'err.emailInvalid': 'รูปแบบอีเมลไม่ถูกต้อง',
  'err.passwordRequired': 'กรุณากรอกรหัสผ่าน',
  'err.passwordMin': 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
  'err.confirmRequired': 'กรุณายืนยันรหัสผ่าน',
  'err.confirmMismatch': 'รหัสผ่านทั้งสองช่องไม่ตรงกัน',
  'err.nameRequired': 'กรุณากรอกชื่อของคุณ',
  'err.nameMin': 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร',
  'err.usernameRequired': 'กรุณาตั้งชื่อผู้ใช้',
  'err.usernameInvalid': 'ใช้ 3-30 ตัวอักษร a-z, 0-9, จุด หรือขีดล่าง',
  'err.invalidCredentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'err.accountBlocked': 'บัญชีนี้ถูกระงับชั่วคราว กรุณาติดต่อทีมงาน',
  'err.usernameTaken': 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
  'err.emailTaken': 'อีเมลนี้ถูกใช้งานแล้ว',
  'err.resetLinkInvalid': 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว',
  'err.genericLogin': 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
  'err.genericSignup': 'สมัครใช้งานไม่สำเร็จ กรุณาลองใหม่',
  'err.genericReset': 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองใหม่',
  'err.genericSend': 'ส่งลิงก์ไม่สำเร็จ กรุณาลองใหม่',

  'login.title': 'เข้าสู่ระบบ',
  'login.subtitle': 'เข้าสู่ระบบเพื่อดูภาพรวมธุรกิจและคุยกับ AI ของคุณ',
  'login.confirmLabel': 'ยืนยันรหัสผ่าน',
  'login.confirmPlaceholder': 'กรอกรหัสผ่านอีกครั้ง',
  'login.remember': 'จดจำฉันไว้',
  'login.forgot': 'ลืมรหัสผ่าน?',
  'login.submit': 'เข้าสู่ระบบ',
  'login.noAccount': 'ยังไม่มีบัญชี?',
  'login.signupLink': 'สมัครใช้งานฟรี',
  'toast.loginTitle': 'เข้าสู่ระบบสำเร็จ',
  'toast.welcome': 'ยินดีต้อนรับกลับ {name}',

  'signup.title': 'สมัครใช้งาน',
  'signup.subtitle': 'สมัครฟรีและตั้งค่าธุรกิจของคุณได้ในไม่ถึง 2 นาที',
  'signup.nameLabel': 'ชื่อ-นามสกุล',
  'signup.namePlaceholder': 'เช่น ภีม ธีรภัทร',
  'signup.usernameLabel': 'ชื่อผู้ใช้ (Username)',
  'signup.usernamePlaceholder': 'เช่น phim_thira',
  'signup.submit': 'สมัครใช้งานฟรี',
  'signup.haveAccount': 'มีบัญชีอยู่แล้ว?',
  'signup.loginLink': 'เข้าสู่ระบบ',
  'strength.weak': 'อ่อน',
  'strength.fair': 'พอใช้',
  'strength.good': 'ดี',
  'strength.strong': 'แข็งแรง',
  'toast.signupTitle': 'สร้างบัญชีสำเร็จ',
  'toast.signupDesc': 'อีกขั้นเดียวก็เริ่มใช้งานได้แล้ว',

  'forgot.title': 'ลืมรหัสผ่าน?',
  'forgot.subtitle': 'กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ',
  'forgot.submit': 'ส่งลิงก์ตั้งรหัสผ่านใหม่',
  'forgot.sentTitle': 'ส่งลิงก์แล้ว',
  'forgot.sentBefore': 'ถ้ามีบัญชีที่ใช้',
  'forgot.sentAfter': 'คุณจะได้รับอีเมลพร้อมลิงก์ตั้งรหัสผ่านใหม่ภายใน 1–2 นาที',
  'forgot.spam': 'ไม่พบอีเมล? ลองตรวจโฟลเดอร์สแปม หรือส่งอีกครั้งด้วยอีเมลอื่น',
  'forgot.devTitle': 'โหมดทดสอบ: ยังไม่ได้ตั้งค่าอีเมล',
  'forgot.devLink': 'เปิดลิงก์ตั้งรหัสผ่านใหม่',
  'forgot.retry': 'ส่งอีกครั้ง',

  'reset.invalidTitle': 'ลิงก์ไม่ถูกต้อง',
  'reset.invalidBody': 'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง',
  'reset.requestNew': 'ขอลิงก์ตั้งรหัสผ่านใหม่',
  'reset.doneTitle': 'ตั้งรหัสผ่านใหม่แล้ว',
  'reset.doneBody': 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อย กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่',
  'reset.title': 'ตั้งรหัสผ่านใหม่',
  'reset.subtitle': 'กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ',
  'reset.newPassword': 'รหัสผ่านใหม่',
  'reset.confirmNew': 'ยืนยันรหัสผ่านใหม่',
  'reset.confirmPlaceholder': 'กรอกรหัสผ่านอีกครั้ง',
  'reset.submit': 'บันทึกรหัสผ่านใหม่',
  'reset.passwordRequired': 'กรุณากรอกรหัสผ่านใหม่',

  'policyPage.title': 'ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว',
  'policyPage.updatedAt': 'อัปเดตล่าสุด 22 พฤศจิกายน 2569',
  'policyPage.breadcrumbHome': 'ภาพรวม',
  'policyPage.breadcrumbLegal': 'เอกสารทางกฎหมาย',
  'policyPage.breadcrumbCurrent': 'ข้อกำหนดและความเป็นส่วนตัว',
  'policyPage.searchPlaceholder': 'ค้นหาในเอกสาร...',
  'policyPage.searchLabel': 'ค้นหาในเอกสาร',
  'policyPage.onThisPage': 'ในหน้านี้',
  'policyPage.manageSources': 'จัดการแหล่งข้อมูล',
  'policyPage.backToLogin': 'กลับไปเข้าสู่ระบบ',
  'policyPage.login': 'เข้าสู่ระบบ',
  'policyPage.signup': 'สร้างบัญชี',
  'policyPage.tryFree': 'เริ่มทดลองฟรี',
  'policyPage.navHome': 'ภาพรวม',
  'policyPage.navPricing': 'ราคา',
  'policyPage.navHelp': 'ช่วยเหลือ',
  'policyPage.introLabel': 'บทนำ',
  'policyPage.moreLabel': 'เพิ่มเติม',
  'policyPage.contactTeam': 'ติดต่อทีมงาน',
  'policyPage.menuLabel': 'เมนูเอกสาร',
  'policyPage.tocLabel': 'สารบัญในหน้านี้',
  'policyPage.noResults': 'ไม่พบหัวข้อที่ค้นหา',
  'policyPage.termsTitle': 'ข้อกำหนดการใช้งาน',
  'policyPage.privacyTitle': 'นโยบายความเป็นส่วนตัว',
  'policyPage.termsIntro':
    'ข้อกำหนดนี้ใช้บังคับกับการเข้าใช้งานเว็บไซต์และบริการของ ROOKAR (“บริการ”) โดยการสมัครใช้งานหรือเข้าใช้บริการ ถือว่าคุณยอมรับข้อกำหนดทั้งหมดด้านล่างนี้',
  'policyPage.terms1Title': '1. การยอมรับข้อกำหนด',
  'policyPage.terms1Body': 'การเข้าใช้งานบริการถือเป็นการยอมรับข้อกำหนดนี้ หากคุณไม่ยอมรับข้อกำหนด กรุณาหยุดใช้บริการ',
  'policyPage.terms2Title': '2. บัญชีผู้ใช้',
  'policyPage.terms2Body':
    'คุณต้องให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการสมัคร และมีหน้าที่รักษารหัสผ่านของตนเป็นความลับ หากพบการใช้งานบัญชีโดยไม่ได้รับอนุญาต กรุณาแจ้งทีมงานทันที',
  'policyPage.terms3Title': '3. การใช้บริการ',
  'policyPage.terms3Body':
    'คุณตกลงที่จะไม่ใช้บริการในทางที่ผิดกฎหมายหรือละเมิดสิทธิผู้อื่น ไม่พยายามเข้าถึงระบบหรือข้อมูลที่ไม่ได้รับอนุญาต และไม่รบกวนการทำงานของบริการ',
  'policyPage.terms4Title': '4. ข้อมูลและทรัพย์สินทางปัญญา',
  'policyPage.terms4Body':
    'ข้อมูลธุรกิจที่คุณนำเข้าหรืออัปโหลดยังคงเป็นของคุณ ส่วนซอฟต์แวร์ ตราสินค้า และเนื้อหาของ ROOKAR เป็นทรัพย์สินของ ROOKAR และผู้ให้สิทธิ์',
  'policyPage.terms5Title': '5. ข้อจำกัดความรับผิด',
  'policyPage.terms5Body':
    'ผลวิเคราะห์และคำแนะนำจาก AI เป็นข้อมูลประกอบการตัดสินใจ ไม่ใช่คำรับรองผลลัพธ์ทางธุรกิจ ROOKAR ไม่รับผิดชอบต่อความเสียหายที่เกิดจากการนำผลลัพธ์ไปใช้โดยไม่ตรวจสอบข้อมูลต้นทาง',
  'policyPage.terms6Title': '6. การเปลี่ยนแปลงข้อกำหนด',
  'policyPage.terms6Body':
    'ROOKAR อาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว และจะแจ้งให้ทราบผ่านเว็บไซต์หรืออีเมล การใช้บริการต่อหลังการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดฉบับใหม่',
  'policyPage.privacyIntro':
    'ROOKAR ให้ความสำคัญกับความเป็นส่วนตัวของคุณและปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
  'policyPage.privacy1Title': '1. ข้อมูลที่เราเก็บรวบรวม',
  'policyPage.privacy1Body':
    'ข้อมูลบัญชี เช่น ชื่อผู้ใช้ ชื่อ-นามสกุล และอีเมล รวมถึงข้อมูลธุรกิจที่คุณอัปโหลด เช่น ยอดขาย ต้นทุน และค่าใช้จ่าย เพื่อใช้ในการวิเคราะห์และแสดงผลภายในบัญชีของคุณ',
  'policyPage.privacy2Title': '2. วัตถุประสงค์ในการใช้ข้อมูล',
  'policyPage.privacy2Body':
    'เราใช้ข้อมูลเพื่อให้บริการ วิเคราะห์และสรุปผลทางธุรกิจ ปรับปรุงคุณภาพบริการ และติดต่อคุณเกี่ยวกับบัญชีหรือการเปลี่ยนแปลงที่สำคัญ',
  'policyPage.privacy3Title': '3. การเปิดเผยข้อมูล',
  'policyPage.privacy3Body':
    'เราไม่ขายข้อมูลของคุณ และจะเปิดเผยเฉพาะเท่าที่จำเป็นแก่ผู้ให้บริการที่ช่วยดำเนินระบบ หรือเมื่อกฎหมายกำหนด โดยมีมาตรการคุ้มครองข้อมูลที่เหมาะสม',
  'policyPage.privacy4Title': '4. การรักษาความปลอดภัย',
  'policyPage.privacy4Body':
    'เราใช้การเข้ารหัส การควบคุมสิทธิ์การเข้าถึง และการติดตามการใช้งาน เพื่อปกป้องข้อมูลของคุณ อย่างไรก็ตาม ไม่มีระบบใดที่ปลอดภัยได้ร้อยเปอร์เซ็นต์',
  'policyPage.privacy5Title': '5. สิทธิของเจ้าของข้อมูล',
  'policyPage.privacy5Body':
    'คุณมีสิทธิขอเข้าถึง แก้ไข ลบ หรือถอนความยินยอมต่อการประมวลผลข้อมูลส่วนบุคคล โดยติดต่อเราตามช่องทางด้านล่าง',
  'policyPage.privacy6Title': '6. ติดต่อเรา',
  'policyPage.privacy6Body': 'หากมีคำถามเกี่ยวกับข้อกำหนดหรือความเป็นส่วนตัว ติดต่อได้ที่',
  'policyPage.footer': '© 2569 ROOKAR · เวอร์ชันทดลอง',
  'policyPage.beta': 'เวอร์ชันทดลอง',
  'lang.changedTitle': 'เปลี่ยนภาษาแล้ว',
  'lang.changedDesc': 'ภาษาไทย',
} as const

export type MessageKey = keyof typeof th

const en: Record<MessageKey, string> = {
  'layout.headlineA': 'See every number',
  'layout.headlineB': 'Decide with confidence',
  'layout.subtitle':
    'ROOKAR brings your business data together and turns it into answers you can act on.',
  'layout.point1': 'All your business data in one place',
  'layout.point2': 'AI analysis based on real data',
  'layout.point3': 'Decisions backed by clear numbers',
  'layout.quote': '“Stop guessing. Start with the numbers that actually happened.”',
  'layout.footer': '© 2026 ROOKAR · Beta',
  'layout.kpiLabel': 'Total revenue',
  'layout.kpiNote': 'vs previous period',
  'layout.kpiInfo': 'Total revenue across all channels over the last 6 months',

  'policy.terms': 'Terms of Use',
  'policy.privacy': 'Privacy Policy',

  'common.email': 'Email',
  'common.emailPlaceholder': 'you@company.com',
  'common.password': 'Password',
  'common.passwordPlaceholder': 'At least 8 characters',
  'common.backToLogin': 'Back to sign in',

  'err.required': 'Please complete all required fields.',
  'err.emailRequired': 'Please enter your email.',
  'err.emailInvalid': 'Invalid email format.',
  'err.passwordRequired': 'Please enter your password.',
  'err.passwordMin': 'Password must be at least 8 characters.',
  'err.confirmRequired': 'Please confirm your password.',
  'err.confirmMismatch': 'Passwords do not match.',
  'err.nameRequired': 'Please enter your name.',
  'err.nameMin': 'Name must be at least 2 characters.',
  'err.usernameRequired': 'Please choose a username.',
  'err.usernameInvalid': 'Use 3-30 characters: a-z, 0-9, dot or underscore.',
  'err.invalidCredentials': 'Incorrect email or password.',
  'err.accountBlocked': 'This account is temporarily suspended. Please contact support.',
  'err.usernameTaken': 'This username is already taken.',
  'err.emailTaken': 'This email is already in use.',
  'err.resetLinkInvalid': 'This password reset link is invalid or has expired.',
  'err.genericLogin': 'Sign in failed. Please try again.',
  'err.genericSignup': 'Sign up failed. Please try again.',
  'err.genericReset': 'Could not reset password. Please try again.',
  'err.genericSend': 'Could not send the link. Please try again.',

  'login.title': 'Sign in',
  'login.subtitle': 'Sign in to see your business overview and chat with your AI.',
  'login.confirmLabel': 'Confirm password',
  'login.confirmPlaceholder': 'Enter your password again',
  'login.remember': 'Remember me',
  'login.forgot': 'Forgot password?',
  'login.submit': 'Sign in',
  'login.noAccount': 'Don’t have an account?',
  'login.signupLink': 'Sign up for free',
  'toast.loginTitle': 'Signed in successfully',
  'toast.welcome': 'Welcome back, {name}',

  'signup.title': 'Signup',
  'signup.subtitle': 'Sign up free and set up your business in under 2 minutes.',
  'signup.nameLabel': 'Full name',
  'signup.namePlaceholder': 'e.g. Phim Theerapat',
  'signup.usernameLabel': 'Username',
  'signup.usernamePlaceholder': 'e.g. phim_thira',
  'signup.submit': 'Sign up for free',
  'signup.haveAccount': 'Already have an account?',
  'signup.loginLink': 'Sign in',
  'strength.weak': 'Weak',
  'strength.fair': 'Fair',
  'strength.good': 'Good',
  'strength.strong': 'Strong',
  'toast.signupTitle': 'Account created',
  'toast.signupDesc': 'One more step and you’re ready to go.',

  'forgot.title': 'Forgot password?',
  'forgot.subtitle': 'Enter the email you signed up with and we’ll send you a reset link.',
  'forgot.submit': 'Send reset link',
  'forgot.sentTitle': 'Link sent',
  'forgot.sentBefore': 'If an account exists for',
  'forgot.sentAfter': 'you’ll receive a password reset email within 1–2 minutes.',
  'forgot.spam': 'Didn’t get the email? Check your spam folder or try another email.',
  'forgot.devTitle': 'Test mode: email is not configured',
  'forgot.devLink': 'Open password reset link',
  'forgot.retry': 'Send again',

  'reset.invalidTitle': 'Invalid link',
  'reset.invalidBody':
    'This password reset link is invalid or has expired. Please request a new one.',
  'reset.requestNew': 'Request a new reset link',
  'reset.doneTitle': 'Password updated',
  'reset.doneBody': 'Your password has been changed. Please sign in again with your new password.',
  'reset.title': 'Set a new password',
  'reset.subtitle': 'Choose a new password for your account.',
  'reset.newPassword': 'New password',
  'reset.confirmNew': 'Confirm new password',
  'reset.confirmPlaceholder': 'Enter your password again',
  'reset.submit': 'Save new password',
  'reset.passwordRequired': 'Please enter a new password.',

  'policyPage.title': 'Terms of Use and Privacy Policy',
  'policyPage.updatedAt': 'Last updated November 22, 2026',
  'policyPage.breadcrumbHome': 'Home',
  'policyPage.breadcrumbLegal': 'Legal documents',
  'policyPage.breadcrumbCurrent': 'Terms & Privacy',
  'policyPage.searchPlaceholder': 'Search this document...',
  'policyPage.searchLabel': 'Search this document',
  'policyPage.onThisPage': 'On this page',
  'policyPage.manageSources': 'Manage data sources',
  'policyPage.backToLogin': 'Back to sign in',
  'policyPage.login': 'Sign in',
  'policyPage.signup': 'Create account',
  'policyPage.tryFree': 'Try for free',
  'policyPage.navHome': 'Home',
  'policyPage.navPricing': 'Pricing',
  'policyPage.navHelp': 'Help',
  'policyPage.introLabel': 'Introduction',
  'policyPage.moreLabel': 'More',
  'policyPage.contactTeam': 'Contact the team',
  'policyPage.menuLabel': 'Document menu',
  'policyPage.tocLabel': 'On this page',
  'policyPage.noResults': 'No matching sections',
  'policyPage.termsTitle': 'Terms of Use',
  'policyPage.privacyTitle': 'Privacy Policy',
  'policyPage.termsIntro':
    'These terms govern your access to the ROOKAR website and services (the “Service”). By signing up or using the Service, you agree to all terms below.',
  'policyPage.terms1Title': '1. Acceptance of Terms',
  'policyPage.terms1Body': 'Using the Service means you accept these terms. If you do not agree, please stop using the Service.',
  'policyPage.terms2Title': '2. User Accounts',
  'policyPage.terms2Body':
    'You must provide accurate and up-to-date information when signing up and keep your password confidential. If you suspect unauthorized access, contact our team immediately.',
  'policyPage.terms3Title': '3. Use of the Service',
  'policyPage.terms3Body':
    'You agree not to use the Service for unlawful purposes, infringe the rights of others, attempt to access systems or data without authorization, or disrupt the Service.',
  'policyPage.terms4Title': '4. Data and Intellectual Property',
  'policyPage.terms4Body':
    'Business data you import or upload remains yours. ROOKAR software, trademarks, and content are the property of ROOKAR and its licensors.',
  'policyPage.terms5Title': '5. Limitation of Liability',
  'policyPage.terms5Body':
    'AI analysis and recommendations are decision-support information, not guarantees of business outcomes. ROOKAR is not liable for damages from using outputs without verifying source data.',
  'policyPage.terms6Title': '6. Changes to These Terms',
  'policyPage.terms6Body':
    'ROOKAR may update these terms from time to time and will notify you via the website or email. Continued use after changes means you accept the revised terms.',
  'policyPage.privacyIntro':
    'ROOKAR values your privacy and complies with the Personal Data Protection Act B.E. 2562 (PDPA).',
  'policyPage.privacy1Title': '1. Information We Collect',
  'policyPage.privacy1Body':
    'Account information such as username, full name, and email, plus business data you upload such as sales, costs, and expenses, used for analysis and display within your account.',
  'policyPage.privacy2Title': '2. How We Use Information',
  'policyPage.privacy2Body':
    'We use data to provide the Service, analyze and summarize business performance, improve service quality, and contact you about your account or important changes.',
  'policyPage.privacy3Title': '3. Disclosure of Information',
  'policyPage.privacy3Body':
    'We do not sell your data. We disclose it only as needed to service providers who help operate the system, or when required by law, with appropriate safeguards.',
  'policyPage.privacy4Title': '4. Security',
  'policyPage.privacy4Body':
    'We use encryption, access controls, and usage monitoring to protect your data. However, no system is completely secure.',
  'policyPage.privacy5Title': '5. Your Rights',
  'policyPage.privacy5Body':
    'You have the right to access, correct, delete, or withdraw consent for processing of your personal data. Contact us using the channel below.',
  'policyPage.privacy6Title': '6. Contact Us',
  'policyPage.privacy6Body': 'If you have questions about these terms or privacy, contact us at',
  'policyPage.footer': '© 2026 ROOKAR · Beta',
  'policyPage.beta': 'Beta',
  'lang.changedTitle': 'Language changed',
  'lang.changedDesc': 'English',
}

const messages: Record<Locale, Record<MessageKey, string>> = { th, en }

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let text = messages[locale.value][key] ?? messages.th[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

const serverErrorKeys: Record<string, MessageKey> = {
  'กรุณากรอกข้อมูลให้ครบ': 'err.required',
  'รูปแบบอีเมลไม่ถูกต้อง': 'err.emailInvalid',
  'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร': 'err.passwordMin',
  'ชื่อผู้ใช้ใช้ 3-30 ตัวอักษร a-z, 0-9, จุด หรือขีดล่าง': 'err.usernameInvalid',
  'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว': 'err.usernameTaken',
  'อีเมลนี้ถูกใช้งานแล้ว': 'err.emailTaken',
  'อีเมลหรือรหัสผ่านไม่ถูกต้อง': 'err.invalidCredentials',
  'บัญชีนี้ถูกระงับชั่วคราว กรุณาติดต่อทีมงาน': 'err.accountBlocked',
  'ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว': 'err.resetLinkInvalid',
}

export function translateServerError(message: string, fallbackKey: MessageKey): string {
  if (locale.value === 'th') return message
  const key = serverErrorKeys[message]
  return key ? t(key) : t(fallbackKey)
}

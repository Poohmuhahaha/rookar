import { watch } from 'vue'
import { locale } from './i18n'

type Pair = [th: string, en: string]

const PAIRS: Pair[] = [
  ['ภาพรวมธุรกิจของ', 'Business overview of'],
  ['ภาพรวมธุรกิจ', 'Business overview'],
  ['อาหารและเครื่องดื่ม', 'Food & Beverage'],
  ['โลจิสติกส์และขนส่ง', 'Logistics & Transport'],
  ['พลังงานและเชื้อเพลิง', 'Energy & Fuel'],
  ['ยานยนต์ไฟฟ้า (EV)', 'Electric Vehicles (EV)'],
  ['สุขภาพและการแพทย์', 'Healthcare & Medical'],
  ['ความปลอดภัยควอนตัม', 'Quantum Security'],
  ['ไฟล์ · ครอบคลุม', 'files · coverage'],
  ['วินาทีที่ผ่านมา', 'seconds ago'],
  ['นาทีที่ผ่านมา', 'minutes ago'],
  ['ชั่วโมงที่ผ่านมา', 'hours ago'],
  ['วันที่ผ่านมา', 'days ago'],
  ['อัปเดต ', 'Updated '],
  [' เดือน', ' months'],
  [' จุด', ' pts'],
  [' ไฟล์', ' files'],
  ['เศรษฐกิจ & อุตสาหกรรม', 'Economy & Industry'],
  ['เศรษฐกิจและอุตสาหกรรม', 'Economy & Industry'],
  ['ผู้ช่วย AI', 'AI Assistant'],
  ['แหล่งข้อมูล', 'Data sources'],
  ['แหล่งข้อมูลทั้งหมด', 'All data sources'],
  ['จัดการข้อมูลธุรกิจ', 'Manage business'],
  ['จัดการแหล่งข้อมูล', 'Manage data sources'],
  ['ปิดเมนู', 'Close menu'],
  ['เมนูหลัก', 'Main menu'],
  ['ตั้งค่า', 'Settings'],
  ['เข้าสู่ระบบ', 'Sign in'],
  ['ออกจากระบบ', 'Sign out'],
  ['ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน', 'Sign out on this device'],
  ['เวอร์ชันทดลอง', 'Beta'],
  ['ภาพรวม (All)', 'Overview (All)'],
  ['ภาพรวม', 'Overview'],
  ['ราคา', 'Pricing'],
  ['ช่วยเหลือ', 'Help'],
  ['ความเป็นส่วนตัว', 'Privacy'],
  ['ข้อกำหนดการใช้งาน', 'Terms of Use'],
  ['ข้อกำหนด', 'Terms'],
  ['นโยบายความเป็นส่วนตัว', 'Privacy Policy'],
  ['เอกสารทางกฎหมาย', 'Legal'],
  ['สมัครใช้งาน', 'Sign up'],
  ['เริ่มทดลองฟรี', 'Try for free'],

  ['ทุกอุตสาหกรรม', 'All industries'],
  ['รวมทุกอุตสาหกรรม', 'All industries'],
  ['กำลังดู', 'Viewing'],
  ['นำเข้าข้อมูล', 'Import data'],
  ['ถาม AI', 'Ask AI'],
  ['ถาม AI ต่อ', 'Ask AI'],
  ['ความมั่นใจ', 'Confidence'],
  ['ข้อมูลจริง', 'Real data'],
  ['ข้อมูลยังไม่ครบสำหรับการวิเคราะห์กำไร', 'Not enough data to analyze profit'],
  ['นำเข้าไฟล์ที่ขาด', 'Import missing file'],
  ['รายได้รวม', 'Total revenue'],
  ['กำไรสุทธิ', 'Net profit'],
  ['ต้นทุนรวม', 'Total cost'],
  ['อัตรากำไร', 'Profit margin'],
  ['เทียบช่วงก่อน', 'vs previous period'],
  ['รายได้รวมจากทุกช่องทางในช่วง', 'Total revenue across all channels in'],
  ['รายได้หักต้นทุนและค่าใช้จ่ายทั้งหมดแล้ว', 'Revenue minus all costs and expenses'],
  ['ต้นทุนวัตถุดิบ ค่าแรง และค่าใช้จ่ายดำเนินงาน', 'Materials, labor and operating expenses'],
  ['กำไรสุทธิหารด้วยรายได้รวม คิดเป็นเปอร์เซ็นต์', 'Net profit divided by total revenue'],
  ['รายได้และกำไร', 'Revenue and profit'],
  ['รายได้ตาม Segment', 'Revenue by segment'],
  ['ต้นทุนตามหมวด', 'Cost by category'],
  ['รายได้', 'Revenue'],
  ['กำไร', 'Profit'],
  ['ต้นทุน', 'Cost'],
  ['อัปเดต', 'Updated'],
  ['ช่วงเวลา', 'Period'],
  ['กำลังอัปเดต', 'Updating'],
  ['3 เดือน', '3 months'],
  ['6 เดือน', '6 months'],
  ['12 เดือน', '12 months'],
  ['3 เดือนล่าสุด', 'Last 3 months'],
  ['6 เดือนล่าสุด', 'Last 6 months'],
  ['12 เดือนล่าสุด', 'Last 12 months'],
  ['ยังไม่มีข้อมูลยอดขาย', 'No sales data yet'],
  ['นำเข้าข้อมูลยอดขาย →', 'Import sales data →'],
  ['ยังไม่มีข้อมูลต้นทุน', 'No cost data yet'],
  ['นำเข้าข้อมูลต้นทุน →', 'Import cost data →'],
  ['ยังไม่มีข้อมูลต้นทุน จึงยังไม่แสดงเส้นกำไร', 'No cost data yet, so the profit line is hidden'],
  ['โครงสร้างต้นทุน', 'Cost structure'],
  ['สัดส่วนของต้นทุนรวม', 'Share of total cost'],
  ['สัดส่วนต้นทุนแต่ละหมวดจากต้นทุนรวมในช่วงเวลาที่เลือก', 'Cost share by category for the selected period'],
  ['ต้นทุนต่อรายได้', 'Cost / revenue'],
  ['หมวดหลัก', 'Top category'],
  ['จากช่วงก่อน', 'from previous period'],
  ['เพิ่มขึ้น', 'increased'],
  ['ลดลง', 'decreased'],
  ['ทรงตัว', 'unchanged'],
  ['ยังไม่มีข้อมูลช่องทางขายสำหรับอุตสาหกรรมนี้', 'No sales channel data for this industry yet'],
  ['เทียบกับเศรษฐกิจไทย', 'Compared with Thai economy'],
  ['ดูภาพรวมเศรษฐกิจ →', 'View economic overview →'],
  ['GDP ประเทศไทย', 'Thailand GDP'],
  ['เงินเฟ้อ (CPI)', 'Inflation (CPI)'],
  ['อัตราการว่างงาน', 'Unemployment rate'],
  ['สูงกว่า', 'above'],
  ['ต่ำกว่า', 'below'],
  ['AI วิเคราะห์', 'AI analysis'],
  ['อ้างอิง', 'Based on'],
  ['แถว', 'rows'],
  ['ดูทั้งหมด', 'View all'],
  ['เพิ่มแหล่งข้อมูล', 'Add data source'],
  ['ROOKAR วิเคราะห์จากข้อมูลที่คุณนำเข้า · ตัวเลขสรุปอาจแตกต่างจากการปิดบัญชีจริง', 'ROOKAR analyzes your imported data · figures may differ from closing statements'],
  ['เริ่มเห็นภาพรวมของ', 'Start with an overview of'],
  ['นำเข้าไฟล์ยอดขายและต้นทุนของ', 'Import sales and cost files for'],
  ['เพื่อให้ ROOKAR สรุปภาพรวมและหาโอกาสทางธุรกิจให้คุณทันที', 'so ROOKAR can summarize and find opportunities right away'],
  ['นำเข้าข้อมูลแรก', 'Import first dataset'],
  ['ยังไม่มีไฟล์ในอุตสาหกรรมนี้ — นำเข้าไฟล์จริงเพื่อเริ่มวิเคราะห์', 'No files in this industry yet — import real data to start'],

  ['ข้อมูลรวม', 'Total rows'],
  ['พร้อมใช้งาน', 'Ready'],
  ['ต้องตรวจสอบ', 'Needs review'],
  ['ชุด', 'sets'],
  ['ทั้งหมด', 'All'],
  ['กรองตามประเภทข้อมูล', 'Filter by data type'],
  ['กรองตามประเภท', 'Filter by type'],
  ['ประเภท', 'Type'],
  ['จำนวนแถว', 'Rows'],
  ['คุณภาพ', 'Quality'],
  ['ครบถ้วนสมบูรณ์', 'Complete'],
  ['ครบถ้วน', 'Complete'],
  ['ควรตรวจสอบ', 'Needs review'],
  ['มีข้อมูลซ้ำ', 'Duplicates'],
  ['ยังไม่มีแหล่งข้อมูล', 'No data sources yet'],
  ['เริ่มจากไฟล์เดียวก็พอ ไม่ว่าจะเป็นยอดขายรายวันหรือต้นทุนวัตถุดิบ', 'Start with one file — daily sales or material costs'],
  ['ค้นหาไฟล์หรือชื่อข้อมูล…', 'Search data sources...'],
  ['ค้นหาแหล่งข้อมูล', 'Search data sources'],
  ['ดาวน์โหลดเทมเพลต', 'Download template'],
  ['ดาวน์โหลดเทมเพลตแล้ว', 'Template downloaded'],
  ['ไม่พบข้อมูลที่ตรงกับคำค้น', 'No matching data found'],
  ['ล้างตัวกรอง', 'Clear filters'],
  ['หน้าก่อนหน้า', 'Previous'],
  ['หน้าถัดไป', 'Next'],
  ['ถัดไป', 'Next'],
  ['ก่อนหน้า', 'Previous'],
  ['ลบแหล่งข้อมูลนี้?', 'Delete this data source?'],
  ['ลบแหล่งข้อมูล', 'Delete data source'],
  ['ยกเลิก', 'Cancel'],
  ['ยืนยันลบ', 'Confirm delete'],
  ['ลบไม่สำเร็จ', 'Delete failed'],
  ['ลบแหล่งข้อมูลแล้ว', 'Data source deleted'],
  ['การจัดการ', 'Actions'],

  ['ยังไม่มีประวัติแชท', 'No chat history yet'],
  ['ประวัติแชท', 'Chat history'],
  ['เริ่มแชทใหม่', 'New chat'],
  ['เลือกแชท', 'Select chat'],
  ['ภาพรวมอุตสาหกรรม', 'Industry overview'],
  ['จุดที่ควรจับตา', 'Key focus areas'],
  ['ถาม AI เกี่ยวกับอุตสาหกรรม', 'Ask AI about this industry'],
  ['ใช้คำถามเหล่านี้เพื่อเจาะลึกโอกาสและความเสี่ยงของอุตสาหกรรมที่เลือก', 'Use these prompts to explore opportunities and risks in the selected industry'],
  ['วิเคราะห์อุตสาหกรรมนี้กับ AI', 'Analyze this industry with AI'],
  ['ข้อมูลมหาภาคเป็นข้อมูลจริงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน · ข้อมูลอุตสาหกรรมเป็นบริบทเชิงคุณภาพสำหรับการวิเคราะห์', 'Macro data comes from IMF WEO, World Bank and NSO as available · Industry content is qualitative context for analysis'],
  ['เลือกอุตสาหกรรม', 'Select industry'],
  ['ขายก่อน', 'Priority'],

  ['จำนวนแถวข้อมูล', 'Rows'],
  ['สถานะคุณภาพ', 'Data quality'],
  ['หมวดหมู่', 'Category'],
  ['การอัปเดต', 'Updated'],
  ['กลับไปหน้ารวมแหล่งข้อมูล', 'Back to data sources'],
  ['ดาวน์โหลด CSV', 'Download CSV'],
  ['ถาม AI ถึงชุดข้อมูลนี้', 'Ask AI about this dataset'],
  ['ตัวอย่างข้อมูล (Row Preview)', 'Data preview (Row Preview)'],
  ['แสดงข้อมูลตัวอย่างที่ ROOKAR ใช้วิเคราะห์และส่งต่อให้ AI', 'Sample rows used by ROOKAR for analysis'],
  ['ค้นหาในตาราง...', 'Search in table...'],
  ['ไม่มีข้อมูลในชุดนี้', 'No data in this dataset'],
  ['ลบชุดข้อมูล', 'Delete dataset'],
  ['ไม่พบชุดข้อมูลนี้', 'Dataset not found'],
  ['ชุดข้อมูลนี้อาจถูกลบไปแล้วหรือรหัสไม่ถูกต้อง', 'This dataset may have been deleted or the ID is invalid'],
  ['ยืนยันการลบชุดข้อมูล', 'Confirm dataset deletion'],
  ['ภาพรวมและคำแนะนำของ AI อาจเปลี่ยนหลังลบข้อมูลชุดนี้', 'AI overview and recommendations may change after deletion'],
  ['ข้อมูลพร้อมสำหรับการวิเคราะห์ทุกมิติ', 'Data is ready for full analysis'],
  ['มีบางแถวที่อาจขาดข้อมูลคอลัมน์ที่ไม่จำเป็น', 'Some rows may be missing optional columns'],
  ['พบข้อมูลที่ซ้ำกัน อาจทำให้ตัวเลขคลาดเคลื่อน', 'Duplicate records may skew figures'],
  ['อัปเดตอุตสาหกรรมแล้ว', 'Industry updated'],
  ['อัปเดตอุตสาหกรรมไม่สำเร็จ', 'Could not update industry'],
  ['ยังไม่ระบุ', 'Not assigned'],
  ['ไม่ระบุอุตสาหกรรม', 'No industry'],
  ['กำหนดอุตสาหกรรม', 'Assign industry'],
  ['อุตสาหกรรมของไฟล์นี้', 'Industry for this file'],
  ['ใช้แยกข้อมูลใน Dashboard และบริบทของ AI', 'Used to separate data in the dashboard and AI context'],

  ['การตั้งค่าทั่วไป', 'General settings'],
  ['ธีม', 'Theme'],
  ['ภาษา', 'Language'],
  ['ภาษาไทย', 'Thai'],
  ['โหมดสว่าง', 'Light mode'],
  ['โหมดมืด', 'Dark mode'],
  ['การแจ้งเตือน', 'Notifications'],
  ['ข้อมูลและความเป็นส่วนตัว', 'Data & privacy'],
  ['ล้างข้อมูลบัญชี', 'Clear account data'],
  ['เปลี่ยนรูปโปรไฟล์', 'Change profile picture'],
  ['อัปเดตรูปโปรไฟล์สำเร็จ', 'Profile picture updated'],
  ['แพ็กเกจปัจจุบัน', 'Current plan'],
  ['ผู้ใช้งาน', 'User'],
  ['เปลี่ยนภาษาแล้ว', 'Language changed'],
  ['สร้างคำตอบใหม่', 'Regenerate answer'],
  ['ตอบโดย ', 'Answered by '],
  ['แก้ไขข้อความ', 'Edit message'],
  // Macro / industry
  ['บริบทเศรษฐกิจมหภาค (Macro Benchmark)', 'Macro Benchmark'],
  ['บริบทเศรษฐกิจมหภาค', 'Macro Benchmark'],
  ['ประเทศไทย', 'Thailand'],
  ['ข้อมูลล่าสุดจาก ', 'Latest data from '],
  ['ข้อมูลล่าสุดจาก', 'Latest data from'],
  ['การเติบโตทางเศรษฐกิจ', 'Economic growth'],
  ['ประมาณการ', 'Projection'],
  ['การบริโภคภาคครัวเรือน', 'Household consumption'],
  ['กำลังซื้อในประเทศ', 'Domestic purchasing power'],
  ['ต้นทุนค่าครองชีพ', 'Cost of living'],
  ['อัตราเงินเฟ้อ', 'Inflation rate'],
  ['เงินเฟ้อ', 'Inflation'],
  ['อัตราการว่างงาน', 'Unemployment rate'],
  ['ตลาดแรงงาน', 'Labor market'],
  ['หนี้ภาครัฐ', 'Government debt'],
  ['ต่อ GDP', 'of GDP'],
  ['บัญชีเดินสะพัด', 'Current account'],
  ['ภาพรวมเศรษฐกิจไทยจากข้อมูลล่าสุด', 'Thai economy overview from the latest data'],
  ['อัปเดตข้อมูลเมื่อ ', 'Data updated '],
  ['ยังไม่มีการเปรียบเทียบกับข้อย้อนหลัง ตัวเลขนี้เป็นบริบทมหภาคเท่านั้น', 'No historical comparison; these figures are macro context only'],
  ['กำลังดึงข้อมูลจริงจาก IMF / World Bank / NSO…', 'Loading real data from IMF / World Bank / NSO...'],
  ['ลองอีกครั้ง', 'Try again'],
  ['ข้อมูลจริงจาก ', 'Real data from '],
  ['ข้อมูลจริงจาก', 'Real data from'],
  ['ข้อมูลแคชล่าสุด', 'Cached data'],
  ['ภาพรวมเศรษฐกิจ', 'Economic overview'],
  ['บริบทเศรษฐกิจมหภาคจริงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน พร้อมจุดโฟกัสของอุตสาหกรรมที่เลือก', 'Real macro context from IMF WEO, World Bank and NSO as available, with focus areas for the selected industry'],
  ['วิเคราะห์ GDP เงินเฟ้อ และกำลังซื้อ', 'Analyze GDP, inflation and purchasing power'],
  ['เงินเฟ้อกระทบอย่างไร', 'How does inflation affect us?'],
  ['แนวโน้มกำลังซื้อ', 'Purchasing power trend'],
  ['ตลาด & GDP', 'Market & GDP'],
  ['รายการแหล่งข้อมูลทางธุรกิจ', 'Business data source list'],
  ['ค่าใช้จ่าย', 'Expenses'],
  ['ยอดขาย', 'Sales'],
  ['วัตถุดิบ', 'Materials'],
  ['ค่าแรง', 'Labor'],
  ['รายการ', 'items'],
  ['แสดง', 'Showing'],
  ['จาก', 'of'],
  ['ตัวเลขเศรษฐกิจมหภาคของประเทศไทย ดึงจาก IMF WEO, World Bank และ NSO ตามแหล่งที่พร้อมใช้งาน เป็นข้อมูลจริงรายปี/รายไตรมาส ไม่ใช่ข้อมูลธุรกิจของคุณ', 'Thailand macro indicators from IMF WEO, World Bank and NSO as available. Real annual/quarterly data, not your business data.'],

  // Import
  ['อัปโหลดไฟล์ข้อมูล', 'Upload data file'],
  ['ลากไฟล์ มาวาง หรือเลือกไฟล์', 'Drag a file here or choose a file'],
  ['เพื่อให้ระบบช่วยแยกประเภทให้อัตโนมัติ', 'so the system can classify it automatically'],
  ['อัปโหลด', 'Upload'],
  ['จับคู่คอลัมน์', 'Map columns'],
  ['ตรวจสอบ', 'Review'],
  ['เสร็จสิ้น', 'Done'],
  ['เลือกประเภทข้อมูล', 'Select data type'],
  ['ยอดขายรายวันหรือรายการขาย', 'Daily sales or transactions'],
  ['ค่าวัตถุดิบและบรรจุภัณฑ์', 'Materials and packaging costs'],
  ['เงินเดือน ค่าจ้าง และโอที', 'Salaries, wages and overtime'],
  ['ค่าเช่า ค่าน้ำ ค่าไฟ และอื่น ๆ', 'Rent, utilities and other expenses'],
  ['รองรับไฟล์ไม่เกิน 10 MB', 'Files up to 10 MB'],
  ['ไฟล์ CSV เท่านั้น', 'CSV files only'],
  ['อ่านไฟล์ไม่สำเร็จ', 'Could not read file'],
  ['ไฟล์ไม่รองรับ', 'Unsupported file'],
  ['ไฟล์ใหญ่เกินไป', 'File too large'],
  ['ตรวจสอบก่อนนำเข้า', 'Review before import'],
  ['แถวทั้งหมด', 'Total rows'],
  ['พร้อมนำเข้า', 'Ready to import'],
  ['ข้อมูลซ้ำ', 'Duplicates'],
  ['ผิดรูปแบบ', 'Invalid'],
  ['ย้อนกลับ', 'Back'],
  ['ข้ามขั้นตอนนี้', 'Skip this step'],
  ['นำเข้าข้อมูลสำเร็จ', 'Import completed'],
  ['นำเข้าไม่สำเร็จ', 'Import failed'],
  ['ขั้นที่ ', 'Step '],
  ['ดาวน์โหลดรายงาน', 'Download report'],
  ['ระบบจะข้ามแถวเหล่านี้ และนำเข้าเฉพาะแถวที่ถูกต้อง', 'These rows will be skipped; only valid rows will be imported'],
  ['ข้อมูลจะถูกเพิ่มเป็นแหล่งข้อมูลใหม่ และภาพรวมจะอัปเดตทันทีหลังนำเข้า', 'Data will be added as a new source and the dashboard will update immediately'],
  ['ตัวอย่างข้อมูล · ', 'Data preview · '],
  ['คอลัมน์', 'columns'],

  // Assistant
  ['ยินดีต้อนรับ', 'Welcome'],
  ['วันนี้อยากให้ ROOKAR ช่วยวิเคราะห์อะไรดีครับ?', 'What would you like ROOKAR to analyze today?'],
  ['ดูรายละเอียดผู้เชี่ยวชาญ', 'View specialist details'],
  ['ทีม AI', 'AI team'],
  ['ผู้เชี่ยวชาญ', 'Specialist'],
  ['เลือกผู้เชี่ยวชาญ AI', 'Choose an AI specialist'],
  ['แนบไฟล์', 'Attach file'],
  ['ประวัติการสนทนา', 'Chat history'],
  ['กำลังสร้างคำตอบ', 'Generating answer'],
  ['หยุดการตอบ', 'Stop response'],
  ['ส่งคำถาม', 'Send question'],
  ['คำถามถึง AI', 'Question for AI'],
  ['วิเคราะห์', 'Analyze'],
  ['ข้อความ', 'Message'],
  ['AI ตอบไม่สำเร็จ', 'AI response failed'],
  ['AI ไม่สามารถตอบได้ในขณะนี้', 'AI cannot respond right now'],
  ['ลองถามแบบนี้', 'Try asking'],
  ['กำลังฟังคำสั่งของคุณ...', 'Listening to your voice...'],
  ['พร้อมรับคำสั่งเสียง', 'Voice input ready'],
  ['แปลงเสียงเป็นข้อความเรียบร้อย', 'Voice converted to text'],

  // Settings
  ['ข้อมูลธุรกิจ', 'Business profile'],
  ['ชื่อธุรกิจ', 'Business name'],
  ['ประเภทธุรกิจ', 'Business type'],
  ['พนักงาน', 'Employees'],
  ['รายได้ต่อปี', 'Annual revenue'],
  ['แก้ไขข้อมูลธุรกิจ', 'Edit business profile'],
  ['แพ็กเกจและการใช้งาน', 'Plan & usage'],
  ['ใช้งานอยู่', 'Active'],
  ['ดูแพ็กเกจทั้งหมด', 'View all plans'],
  ['เจ้าของธุรกิจ', 'Business owner'],
  ['เปลี่ยนรูป', 'Change photo'],
  ['ผู้จัดการ', 'Manager'],
  ['ผู้ดูแลระบบ', 'Admin'],
  ['แจ้งเตือนความผิดปกติ', 'Anomaly alerts'],
  ['แจ้งเตือนนำเข้าข้อมูล', 'Import alerts'],
  ['สรุปรายสัปดาห์', 'Weekly summary'],
  ['เคล็ดลับการใช้งาน', 'Product tips'],
  ['ข้อมูลของคุณเป็นส่วนตัว', 'Your data is private'],
  ['ข้อมูลและบทสนทนาถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น', 'Data and conversations are stored only in your browser'],
  ['บันทึกการตั้งค่าภาษาแล้ว', 'Language preference saved'],
  ['บันทึกการตั้งค่าธีมแล้ว', 'Theme preference saved'],

  // Industry profiles
  ['ขนส่งสินค้า คลังสินค้า และกระจายสินค้า', 'Freight, warehousing and distribution'],
  ['ต้นทุนน้ำมันและค่าทางด่วนต่อเที่ยว', 'Fuel and toll costs per trip'],
  ['อัตราการบรรทุกเต็มคันและเที่ยววิ่งเปล่า', 'Truck utilization and empty trips'],
  ['กำไรต่อเส้นทางและรอบรถ', 'Profit per route and vehicle cycle'],
  ['ค่าซ่อมบำรุงและค่าคลังสินค้า', 'Maintenance and warehousing costs'],
  ['ต้นทุนน้ำมันต่อเที่ยวสูงขึ้นแค่ไหน', 'How much have fuel costs per trip risen?'],
  ['ควรเพิ่มเที่ยววิ่งหรือลดเที่ยวเปล่า', 'Should we add trips or reduce empty runs?'],
  ['วิเคราะห์กำไรแต่ละเส้นทาง', 'Analyze profit by route'],
  ['สถานีบริการน้ำมัน ค้าส่งเชื้อเพลิง และธุรกิจพลังงาน', 'Fuel stations, fuel wholesale and energy businesses'],
  ['มาร์จิ้นต่อลิตรและราคาต้นทุนเชื้อเพลิง', 'Margin per liter and fuel cost prices'],
  ['รอบสต็อกเชื้อเพลิงและความเสี่ยงราคา', 'Fuel inventory cycles and price risk'],
  ['สัดส่วนรายได้ B2B กับสถานีบริการ', 'B2B vs station revenue mix'],
  ['ค่าขนส่งและค่าดำเนินงานสถานี', 'Logistics and station operating costs'],
  ['ราคาน้ำมันผันผวนกระทบกำไรเท่าไร', 'How much does fuel price volatility affect profit?'],
  ['ควรถือสต็อกเชื้อเพลิงกี่วัน', 'How many days of fuel inventory should we hold?'],
  ['วิเคราะห์มาร์จิ้นต่อลิตร', 'Analyze margin per liter'],
  ['ตัวแทนจำหน่าย อู่ซ่อม EV และสถานีชาร์จ', 'EV dealerships, repair shops and charging stations'],
  ['ต้นทุนแบตเตอรี่และอะไหล่ต่อคัน', 'Battery and parts cost per vehicle'],
  ['รอบสต็อกอะไหล่และรถค้างสต็อก', 'Parts inventory cycle and unsold vehicles'],
  ['รายได้หลังการขายและค่าบริการชาร์จ', 'After-sales and charging service revenue'],
  ['ต้นทุนช่างเทคนิคเฉพาะทาง', 'Specialized technician costs'],
  ['ต้นทุนแบตเตอรี่ต่อคันสูงแค่ไหน', 'How high is battery cost per vehicle?'],
  ['อะไหล่ตัวไหนเงินจมนานที่สุด', 'Which parts tie up cash the longest?'],
  ['รายได้หลังการขายคิดเป็นกี่เปอร์เซ็นต์', 'What percentage comes from after-sales?'],
  ['คลินิก โรงพยาบาล และธุรกิจขายให้ภาคสาธารณสุข', 'Clinics, hospitals and public healthcare businesses (B2G)'],
  ['ระยะเวลาเบิกจ่ายภาครัฐและกระแสเงินสด', 'Government reimbursement timing and cash flow'],
  ['ต้นทุนเวชภัณฑ์ต่อหัตถการ', 'Medical supply cost per procedure'],
  ['สัดส่วนรายได้ภาครัฐกับเอกชน', 'Public vs private revenue mix'],
  ['ต้นทุนบุคลากรทางการแพทย์', 'Medical staff costs'],
  ['รอบเบิกจ่ายภาครัฐกระทบเงินสดแค่ไหน', 'How does government reimbursement affect cash?'],
  ['ต้นทุนเวชภัณฑ์ต่อหัตถการสูงขึ้นไหม', 'Are medical supply costs per procedure rising?'],
  ['รายได้ภาครัฐคิดเป็นกี่เปอร์เซ็นต์', 'What percentage of revenue comes from government?'],
  ['โซลูชันความปลอดภัยไซเบอร์และควอนตัมสำหรับองค์กร', 'Cybersecurity and quantum security solutions for enterprises'],
  ['ต้นทุนบุคลากรผู้เชี่ยวชาญต่อสัญญา', 'Specialist personnel cost per contract'],
  ['ระยะเวลา Sales cycle 4–6 เดือน', '4–6 month sales cycle'],
  ['CAC เทียบกับมูลค่าสัญญา (LTV)', 'CAC vs contract value (LTV)'],
  ['ต้นทุนต่อสัญญาสูงแค่ไหน', 'How high is cost per contract?'],
  ['ควรเน้นขายภาครัฐหรือเอกชน', 'Should we focus on public or private sector?'],
  ['วิเคราะห์ CAC กับ LTV', 'Analyze CAC vs LTV'],
  ['ร้านอาหาร คาเฟ่ และเบเกอรี', 'Restaurants, cafés and bakeries'],
  ['ต้นทุนวัตถุดิบและบรรจุภัณฑ์', 'Ingredient and packaging costs'],
  ['ยอดขายต่อบิลและช่องทางเดลิเวอรี', 'Sales per bill and delivery channels'],
  ['ค่าแรงหน้าร้านและ OT', 'Front-of-house labor and overtime'],
  ['อัตราการสูญเสียของสด', 'Fresh inventory waste rate'],
  ['ต้นทุนบรรจุภัณฑ์เพิ่มขึ้นเพราะอะไร', 'Why are packaging costs increasing?'],
  ['ยอดขายช่องทางไหนโตดีที่สุด', 'Which sales channel is growing fastest?'],
  ['ควรปรับราคาเมนูไหนก่อน', 'Which menu prices should we adjust first?'],

  // Cost labels
  ['น้ำมันและค่าทางด่วน', 'Fuel & tolls'],
  ['ค่าแรงพนักงานขับรถ', 'Driver wages'],
  ['ค่าซ่อมบำรุงและคลังสินค้า', 'Maintenance & warehousing'],
  ['ต้นทุนเชื้อเพลิงและสต็อก', 'Fuel & inventory'],
  ['ค่าแรงพนักงานสถานี', 'Station staff wages'],
  ['ค่าขนส่งและค่าดำเนินงาน', 'Logistics & operations'],
  ['ต้นทุนรถและแบตเตอรี่', 'Vehicles & batteries'],
  ['ค่าแรงช่างเทคนิค EV', 'EV technician wages'],
  ['ค่าสถานีชาร์จและประกัน', 'Charging & insurance'],
  ['ต้นทุนเวชภัณฑ์', 'Medical supplies'],
  ['ค่าแรงบุคลากรทางการแพทย์', 'Medical staff wages'],
  ['ค่าดำเนินงานคลินิก', 'Clinic operations'],
  ['ค่าคลาวด์และฮาร์ดแวร์', 'Cloud & hardware'],
  ['ค่าแรงวิศวกรความปลอดภัย', 'Security engineer wages'],
  ['ค่าการตลาดและคอมพลายแอนซ์', 'Marketing & compliance'],
  ['วัตถุดิบและบรรจุภัณฑ์', 'Ingredients & packaging'],
  ['ค่าแรงหน้าร้าน', 'Front-of-house wages'],
  ['ค่าเช่าและค่าดำเนินงาน', 'Rent & operations'],

  // Months and dynamic UI
  ['ม.ค.', 'Jan'],
  ['ก.พ.', 'Feb'],
  ['มี.ค.', 'Mar'],
  ['เม.ย.', 'Apr'],
  ['พ.ค.', 'May'],
  ['มิ.ย.', 'Jun'],
  ['ก.ค.', 'Jul'],
  ['ส.ค.', 'Aug'],
  ['ก.ย.', 'Sep'],
  ['ต.ค.', 'Oct'],
  ['พ.ย.', 'Nov'],
  ['ธ.ค.', 'Dec'],
  [' ล้าน', ' million'],
  [' จาก ', ' of '],
  [' รายการ', ' items'],
  ['อัปเดตล่าสุด ', 'Last updated '],
  ['คน', 'people'],

  // Settings / import / misc UI
  ['จัดการบัญชี ข้อมูลธุรกิจ แพ็กเกจ การแจ้งเตือน และความเป็นส่วนตัวของคุณ', 'Manage your account, business data, plan, notifications and privacy'],
  ['เมื่อยอดขายหรือต้นทุนเบี่ยงเบนจากปกติ', 'When sales or costs deviate from normal'],
  ['สรุปภาพรวมธุรกิจและคำแนะนำทุกสัปดาห์', 'Weekly business summary and recommendations'],
  ['เมื่อนำเข้าไฟล์และประมวลผลเสร็จ', 'When a file finishes importing'],
  ['ฟีเจอร์ใหม่และวิธีใช้ ROOKAR', 'New features and how to use ROOKAR'],
  ['ติดต่อทีมสนับสนุน', 'Contact support'],
  ['ส่งข้อเสนอแนะ', 'Send feedback'],
  ['ความช่วยเหลือ', 'Help'],
  ['ลากไฟล์ CSV มาวาง หรือเลือกไฟล์', 'Drag a CSV file here or choose a file'],
  ['ลากไฟล์มาวาง หรือ เลือกไฟล์', 'Drag a file here or choose a file'],
  ['รองรับไฟล์ CSV ขนาดไม่เกิน 10 MB', 'CSV files up to 10 MB'],
  ['ตรวจสอบไฟล์', 'Review file'],
  ['ข้อมูลในเบราว์เซอร์ของคุณเท่านั้น', 'Data is stored only in your browser'],
  ['ลบได้ทุกเมื่อจากหน้าแหล่งข้อมูล', 'You can delete it anytime from Data sources'],
  ['ดู', 'View'],

  ['ตามเดือน', 'by month'],
  ['สัดส่วน', 'Share of'],
  ['เป็นต้นทุนก้อนใหญ่สุดที่', 'is the largest cost at'],
  ['จากช่วงก่อน', 'from the previous period'],
  ['รายได้ธุรกิจ', 'Business revenue'],
  ['อ้างอิง ', 'Based on '],
  [' แถว', ' rows'],
  ['แสดง ', 'Showing '],
  ['จริงจากข้อมูลล่าสุด', 'from the latest data'],
  ['ตัวเลขนี้เป็นบริบทมหภาคเท่านั้น', 'these figures are macro context only'],
  ['ข้อมูลมหภาคเป็น', 'Macro data is '],
  ['และ NSO ตามแหล่งที่', 'and NSO as available'],
  ['แยกตามอุตสาหกรรมที่เลือก', 'scoped to the selected industry'],
  ['ลากไฟล์มาวาง หรือ เลือกไฟล์', 'Drag a file here or choose a file'],
  ['รองรับไฟล์ CSV', 'Supports CSV files'],
  ['ขนาดไม่เกิน 10 MB', 'up to 10 MB'],
  ['ถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น', 'is stored only in your browser'],
  ['แพ็กเกจ ', 'Plan '],
  ['ให้คุณใช้งานแดชบอร์ด', 'includes the dashboard'],
  ['และการวิเคราะห์จากข้อมูลจริง', 'and analysis from real data'],
  ['และบทสนทนาของคุณถูกเก็บไว้ในระบบ ROOKAR และเข้าถึงได้เฉพาะบัญชีของคุณ', 'and conversations are stored in ROOKAR and accessible only to your account'],
  ['เลือกบทสนทนา', 'Select conversation'],
  ['ที่ต้องการคุยต่อ หรือเริ่มแชทใหม่', 'to continue or start a new chat'],
  ['ก่อนเริ่มพิมพ์', 'before you start typing'],
  ['กลยุทธ์ & ราคา', 'Strategy & Pricing'],
  ['การเงิน & ต้นทุน', 'Finance & Cost'],
  ['ตลาด & เศรษฐกิจ', 'Market & Economy'],
  ['บริหารจัดการ', 'Operations'],
  ['การตลาดโซเชียล', 'Social marketing'],
  ['ภาพรวม (All)', 'Overview (All)'],

  // Import flow
  ['ต้นทุนวัตถุดิบ', 'Material costs'],
  ['ค่าใช้จ่ายอื่น', 'Other expenses'],
  ['AI ช่วยแยกประเภทไฟล์', 'AI file classification'],
  ['AI ช่วยแยกประเภทให้แล้ว ตรวจสอบและเลือกประเภทที่ถูกต้องก่อนดำเนินการต่อ', 'AI has classified your file. Review and select the correct type before continuing.'],
  ['ลากไฟล์ CSV มาวาง หรือเลือกไฟล์ เพื่อให้ระบบช่วยแยกประเภทให้อัตโนมัติ', 'Drag a CSV file here or choose a file to let the system classify it automatically.'],
  ['แนะนำ:', 'Suggested:'],
  ['พบคอลัมน์: ', 'Columns found: '],
  ['จับคู่จากชื่อไฟล์และหัวตาราง', 'Matched from file name and headers'],
  ['ยังจับสัญญาณจากหัวตารางไม่ได้ เลือกประเภทเองได้เลย', 'Could not detect a type from the headers. Select one manually.'],
  ['ยังไม่ได้วิเคราะห์ไฟล์', 'File not analyzed yet'],
  ['กำลังอ่านหัวตารางและชื่อไฟล์...', 'Reading headers and file name...'],
  ['ใช้ประเภทนี้', 'Use this type'],
  ['ใช้อยู่', 'In use'],
  ['เอาไฟล์ออก', 'Remove file'],
  ['เลือกไฟล์หรือลากไฟล์มาวาง', 'Choose a file or drag it here'],
  ['เลือกไฟล์ CSV', 'Choose CSV file'],
  ['เลือกไฟล์อื่น', 'Choose another file'],
  ['ลากไฟล์มาวาง หรือ ', 'Drag a file here or '],
  ['เลือกไฟล์', 'Choose file'],
  ['รองรับไฟล์ CSV · ขนาดไม่เกิน 10 MB', 'CSV only · up to 10 MB'],
  ['ข้อมูลที่ต้องใช้', 'Required data'],
  ['คอลัมน์ในไฟล์', 'File column'],
  ['จำเป็น', 'Required'],
  ['ไม่บังคับ', 'Optional'],
  ['— ไม่ใช้คอลัมน์นี้ —', '— Do not use this column —'],
  ['จับคู่อัตโนมัติ', 'Auto-map'],
  ['ไม่ต้องมีฟอร์แมตเดียวกับเทมเพลต เลือกจับคู่คอลัมน์ในไฟล์กับข้อมูลที่ ROOKAR ต้องใช้', 'No template format required. Map your file columns to the data ROOKAR needs.'],
  ['ระบบจับคู่ให้แล้ว ', 'Auto-mapped '],
  [' ช่อง', ' fields'],
  ['ยังไม่ได้จับคู่ ', 'Not mapped yet: '],
  ['ตรวจสอบข้อมูล', 'Review data'],
  ['ตรวจสอบก่อนนำเข้า', 'Review before import'],
  [' แถวในไฟล์ ', ' rows in '],
  [' ตรวจสอบแถวที่มีปัญหาให้ครบก่อนยืนยัน', ' Review problematic rows before confirming.'],
  [' แถวที่ต้องตรวจสอบ', ' rows need review'],
  [' แถวแรก', ' first rows'],
  ['แถว ', 'Row '],
  ['นำเข้าข้อมูลสำเร็จ', 'Import completed'],
  ['เพิ่ม ', 'Added '],
  ['เข้าสู่ระบบแล้ว ภาพรวมและคำแนะนำของ AI จะอัปเดตให้อัตโนมัติ', 'have been added. The dashboard and AI recommendations will update automatically.'],
  [' แถว · พร้อมวิเคราะห์', ' rows · ready to analyze'],
  ['ไปที่ภาพรวม', 'Go to overview'],
  ['ดำเนินการต่อ', 'Continue'],
  ['นำเข้าอีกไฟล์', 'Import another file'],
  ['ดูแหล่งข้อมูลทั้งหมด', 'View all data sources'],
  ['รูปแบบไฟล์ CSV ที่แนะนำ', 'Recommended CSV format'],
  ['ใช้เทมเพลตนี้เพื่อให้ระบบจับคู่คอลัมน์ได้แม่นยำขึ้น', 'Use this template to improve automatic column mapping.'],
  ['ไฟล์ UTF-8 · รองรับ comma / semicolon / tab · วันที่ใช้ YYYY-MM-DD · ตัวเลขไม่ใส่ comma', 'UTF-8 file · comma / semicolon / tab supported · dates as YYYY-MM-DD · no thousands separators in numbers'],
  ['(* จำเป็น)', '(* required)'],
  ['ชื่อหรือลำดับคอลัมน์ต่างจากเทมเพลตได้ · ถ้าไม่มีหัวตาราง ระบบจะสร้างชื่อคอลัมน์ให้แล้วจับคู่เองในขั้นถัดไป', 'Column names and order can differ from the template · if there is no header row, column names are generated and mapped in the next step.'],
  ['ข้อมูลในเวอร์ชันทดลองถูกเก็บไว้ในเบราว์เซอร์ของคุณเท่านั้น · ลบได้ทุกเมื่อจากหน้าแหล่งข้อมูล', 'Beta data is stored only in your browser · You can delete it anytime from Data sources'],
  ['นำเข้าข้อมูล', 'Import data'],
  ['นำเข้าไฟล์ CSV เพื่อให้ ROOKAR สรุปภาพรวมและหาโอกาสทางธุรกิจให้อัตโนมัติ', 'Import a CSV file so ROOKAR can summarize your business and find opportunities automatically.'],
  ['กรุณาใช้ไฟล์ CSV (.csv)', 'Please use a CSV (.csv) file.'],
  ['ขนาดไฟล์ต้องไม่เกิน 10 MB', 'File size must not exceed 10 MB.'],
  ['AI แยกประเภทไฟล์ให้แล้ว', 'AI classified the file.'],
  ['ใช้ประเภทที่ AI แนะนำ', 'Using AI suggestion'],
  ['เทมเพลต', 'Template'],
  ['ลองตรวจสอบรูปแบบไฟล์อีกครั้ง', 'Check the file format and try again.'],
  ['จับคู่คอลัมน์ไม่ครบ', 'Incomplete column mapping'],
  ['กรุณาเลือกคอลัมน์สำหรับช่องที่จำเป็น', 'Select a column for every required field.'],
  ['ตรวจสอบข้อมูลไม่สำเร็จ', 'Data review failed'],
  ['กรุณาลองใหม่', 'Please try again.'],
  ['กรุณาลองใหม่อีกครั้ง', 'Please try again.'],
  ['ดาวน์โหลดรายงานแล้ว', 'Report downloaded'],

  // Field labels
  ['วันที่', 'Date'],
  ['จำนวนออเดอร์', 'Orders'],
  ['ช่องทางขาย', 'Sales channel'],
  ['ชื่อวัตถุดิบ', 'Material name'],
  ['จำนวน', 'Quantity'],
  ['ราคาต่อหน่วย', 'Unit price'],
  ['ยอดรวม', 'Total'],
  ['ชื่อพนักงาน', 'Employee name'],
  ['ตำแหน่ง', 'Role'],
  ['ชั่วโมงทำงาน', 'Hours worked'],
  ['หมวดหมู่', 'Category'],
  ['รายละเอียด', 'Description'],
  ['จำนวนเงิน', 'Amount'],
  ['ข้ามไปยังเนื้อหา', 'Skip to content'],
  ['นำเข้า ', 'Import '],
  [' คอลัมน์', ' columns'],
  ['ตัวอย่างข้อมูลที่นำเข้า', 'Imported data preview'],
  ['พบ ', 'Found '],

]

const exact = new Map(PAIRS)
const EXACT_ONLY = new Set(['ค่าใช้จ่าย', 'ยอดขาย', 'วัตถุดิบ', 'ค่าแรง', 'รายการ', 'แสดง', 'จาก'])

const phrases = PAIRS
  .filter(([th]) => !EXACT_ONLY.has(th) && (th.length >= 8 || th.startsWith(' ') || th.endsWith(' ')))
  .sort((a, b) => b[0].length - a[0].length)

const textOriginals = new WeakMap<Text, string>()
const attrOriginals = new WeakMap<Element, Map<string, string>>()
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT'])

function translateValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value
  const direct = exact.get(trimmed)
  if (direct) {
    return value.replace(trimmed, direct)
  }
  let result = value
  for (const [th, en] of phrases) {
    if (result.includes(th)) result = result.split(th).join(en)
  }
  return result
}

function handleText(node: Text) {
  const parent = node.parentElement
  if (!parent || SKIP_TAGS.has(parent.tagName)) return
  const current = node.nodeValue ?? ''
  const stored = textOriginals.get(node)

  if (locale.value !== 'en') {
    if (stored !== undefined && current === translateValue(stored)) {
      node.nodeValue = stored
    }
    textOriginals.delete(node)
    return
  }

  const base =
    stored !== undefined && (current === stored || current === translateValue(stored))
      ? stored
      : current
  const next = translateValue(base)

  if (next !== base) {
    textOriginals.set(node, base)
  } else {
    textOriginals.delete(node)
  }
  if (current !== next) node.nodeValue = next
}

function handleElement(element: Element) {
  let stored = attrOriginals.get(element)
  for (const attr of ATTRS) {
    const current = element.getAttribute(attr)
    if (current === null) continue
    if (!stored) {
      stored = new Map()
      attrOriginals.set(element, stored)
    }
    const original = stored.get(attr) ?? current
    stored.set(attr, original)
    const next = locale.value === 'en' ? translateValue(original) : original
    if (current !== next) element.setAttribute(attr, next)
  }
}

function walk(root: ParentNode) {
  if (root instanceof Element) handleElement(root)
  if (root instanceof Element && SKIP_TAGS.has(root.tagName)) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    handleText(node as Text)
    node = walker.nextNode()
  }
  if (root instanceof Element) {
    const elements = root.querySelectorAll('*')
    elements.forEach((element) => handleElement(element))
  }
}

let startTimer: number | null = null
let observer: MutationObserver | null = null
const pendingRoots = new Set<ParentNode & Node>()

function scheduleWalk(node: ParentNode & Node) {
  pendingRoots.add(node)
  if (startTimer !== null) return
  startTimer = window.setTimeout(() => {
    startTimer = null
    const roots = [...pendingRoots]
    pendingRoots.clear()
    if (locale.value !== 'en') return
    for (const root of roots) {
      if (root.isConnected) walk(root)
    }
  }, 40)
}

export function startAutoI18n() {
  if (typeof window === 'undefined' || observer) return
  if (locale.value === 'en') walk(document.body)
  observer = new MutationObserver((mutations) => {
    if (locale.value !== 'en') return
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) handleText(node as Text)
          else if (node.nodeType === Node.ELEMENT_NODE) scheduleWalk(node as Element)
        })
      } else if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
        handleText(mutation.target as Text)
      }
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...ATTRS],
  })

  watch(locale, (value) => {
    walk(document.body)
    document.documentElement.lang = value === 'th' ? 'th' : 'en'
  })
}

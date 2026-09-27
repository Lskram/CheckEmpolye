import { ViolationLog, ViolationType } from './types';

export interface SecurityExplanation {
  type: ViolationType;
  title: string;
  badgeLabel: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  meaning: string;
  riskAnalysis: string;
  recommendation: string;
}

export function getSecurityExplanation(violation: ViolationLog): SecurityExplanation {
  const vType = violation.violation_type;

  switch (vType) {
    case 'HWID_OVERLAP':
      return {
        type: 'HWID_OVERLAP',
        title: '🚨 ตรวจพบการใช้อุปกรณ์ซ้ำซ้อน (สงสัยฝากเช็คอินแทนกัน / Buddy Punching)',
        badgeLabel: '🚨 วิกฤต: สงสัยลงเวลาแทนกัน',
        badgeColor: 'bg-rose-600 text-white shadow-xs',
        borderColor: 'border-rose-300 ring-1 ring-rose-200',
        bgColor: 'bg-rose-50/70',
        iconBg: 'bg-rose-100 text-rose-700',
        meaning: 'พนักงานมากกว่า 1 คน เข้าสู่ระบบด้วยโทรศัพท์มือถือเครื่องเดียวกัน (Hardware ID ตรงกันเป๊ะ)',
        riskAnalysis: '⚠️ มีโอกาสสูงมากที่จะเป็นการ "ฝากเพื่อนที่อยู่ที่ร้านกดเช็คอินแทน" หรือสลับกันล็อกอินลงเวลาบนเครื่องเดียว เพื่อขอรับเบี้ยขยัน 50฿ หรือหลีกเลี่ยงการตัดสาย',
        recommendation: 'ตรวจสอบกับพนักงานทั้ง 2 คนว่ามีการยืมโทรศัพท์กันจริงหรือไม่ หากตรวจสอบแล้วถูกต้องสามารถกดปุ่ม "รับทราบ / ปิดเคส" ได้',
      };

    case 'DEVICE_MISMATCH':
      return {
        type: 'DEVICE_MISMATCH',
        title: '📱 พยายามเข้าสู่ระบบจากเครื่องอื่นที่ไม่ได้รับอนุญาต (Device Mismatch)',
        badgeLabel: '📱 ความเสี่ยงสูง: เครื่องไม่ตรงที่ผูก',
        badgeColor: 'bg-amber-600 text-white shadow-xs',
        borderColor: 'border-amber-300 ring-1 ring-amber-200',
        bgColor: 'bg-amber-50/70',
        iconBg: 'bg-amber-100 text-amber-800',
        meaning: 'พนักงานพยายามล็อกอินจากโทรศัพท์เครื่องใหม่ที่ไม่ตรงกับโทรศัพท์ประจำตัวที่ผูกไว้ในระบบ',
        riskAnalysis: '🔍 อาจเกิดจากพนักงานเปลี่ยนมือถือใหม่, ลืมมือถือแล้วยืมของเพื่อน, หรือมีผู้อื่นแอบนำรหัสไปใช้ (ระบบทำการบล็อกการเข้าถึงไว้แล้ว)',
        recommendation: 'หากพนักงานแจ้งเปลี่ยนโทรศัพท์เครื่องใหม่จริง ผู้บริหารสามารถกดปุ่ม "🔓 ปลดล็อกเครื่อง (Reset HWID)" เพื่ออนุญาตให้ผูกเครื่องใหม่ได้ทันที',
      };

    case 'OUT_OF_GEOFENCE_BLOCKED':
      return {
        type: 'OUT_OF_GEOFENCE_BLOCKED',
        title: '📍 พยายามลงเวลาเข้า-ออกงานนอกรัศมีร้าน (Geofence Blocked)',
        badgeLabel: '📍 นอกพื้นที่ร้าน (บล็อกแล้ว)',
        badgeColor: 'bg-blue-600 text-white shadow-xs',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50/50',
        iconBg: 'bg-blue-100 text-blue-700',
        meaning: 'พนักงานกดปุ่มลงเวลาขณะที่ตำแหน่งพิกัด GPS อยู่เกินระยะรัศมีร้านที่กำหนด',
        riskAnalysis: '📍 พนักงานอาจยังเดินทางมาไม่ถึงร้าน (กดระหว่างเดินทางบนรถ หรือกดจากที่บ้าน) หรือสัญญาณ GPS บนมือถือยังไม่อัปเดตพิกัด',
        recommendation: 'ระบบได้บล็อกการลงเวลาและตัดสิทธิ์เบี้ยขยันรอบนี้อัตโนมัติแล้ว พนักงานต้องอยู่ในพื้นที่ร้านจริงจึงจะลงเวลาสำเร็จ',
      };

    case 'INVALID_PIN_ATTEMPTS':
      return {
        type: 'INVALID_PIN_ATTEMPTS',
        title: '🔑 กรอกรหัส PIN / รหัสผ่านไม่ถูกต้อง (Invalid PIN)',
        badgeLabel: '🔑 รหัสผ่านไม่ถูกต้อง',
        badgeColor: 'bg-slate-700 text-white shadow-xs',
        borderColor: 'border-slate-200',
        bgColor: 'bg-slate-50',
        iconBg: 'bg-slate-100 text-slate-700',
        meaning: 'มีการกรอกรหัส PIN ไม่ตรงกับที่บันทึกไว้ในระบบ',
        riskAnalysis: '🔑 พนักงานอาจจำรหัสผิด หรือมีบุคคลอื่นพยายามสุ่มรหัสเพื่อเข้าใช้งานบัญชีนี้',
        recommendation: 'หากพนักงานลืมรหัส PIN ผู้บริหารสามารถตั้งรหัสผ่านใหม่ให้พนักงานได้ในแท็บ "จัดการพนักงาน"',
      };

    case 'FAKE_GPS_DETECTED':
    case 'SUSPICIOUS_TIME_TAMPERING':
      return {
        type: vType,
        title: '🛰️ ตรวจพบแอปจำลองพิกัด / พยายามแก้ไขเวลาเครื่อง (Tampering Detected)',
        badgeLabel: '🛰️ วิกฤต: จำลองพิกัด/แก้เวลา',
        badgeColor: 'bg-purple-600 text-white shadow-xs',
        borderColor: 'border-purple-300 ring-1 ring-purple-200',
        bgColor: 'bg-purple-50/70',
        iconBg: 'bg-purple-100 text-purple-700',
        meaning: 'ตรวจพบการเปิดใช้งาน Fake GPS (Mock Location) หรือพยายามปรับตั้งเวลานาฬิกาบนโทรศัพท์',
        riskAnalysis: '🚨 มีความพยายามจงใจหลอกตำแหน่งหรือเวลาของระบบ เพื่อลงเวลาโดยที่ตัวจริงไม่ได้อยู่ที่ร้าน',
        recommendation: 'ควรเรียกพนักงานมาตักเตือนและตรวจสอบโทรศัพท์เครื่องดังกล่าวทันที',
      };

    default:
      return {
        type: vType,
        title: '⚠️ ตรวจพบความผิดปกติในระบบความปลอดภัย',
        badgeLabel: '⚠️ แจ้งเตือนความปลอดภัย',
        badgeColor: 'bg-slate-700 text-white',
        borderColor: 'border-slate-200',
        bgColor: 'bg-slate-50',
        iconBg: 'bg-slate-100 text-slate-700',
        meaning: violation.description || 'ตรวจพบพฤติกรรมผิดปกติ',
        riskAnalysis: 'โปรดตรวจสอบประวัติการลงเวลาและพิกัดของพนักงาน',
        recommendation: 'ตรวจสอบข้อมูลกับพนักงานที่เกี่ยวข้อง',
      };
  }
}

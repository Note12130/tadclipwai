import React from 'react';
import {
  Cookie,
  ArrowLeft,
  Scissors,
  CheckCircle,
  Sliders,
  Lock,
  Globe,
} from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight">ตัดคลิปไว</span>
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าหลัก</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[900px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            นโยบายการใช้คุกกี้ (Cookie Policy)
          </h1>
          <p className="text-xs text-slate-400 mt-1">ปรับปรุงล่าสุดเมื่อ: 4 กันยายน 2569</p>
        </div>

        {/* Highlight Guarantee */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-xs sm:text-sm text-emerald-300">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <strong className="text-white block font-semibold mb-0.5">
              คำยืนยันความปลอดภัยของไฟล์วิดีโอ 100% (Zero Server Upload)
            </strong>
            เว็บไซต์ <strong>ตัดคลิปไว</strong> ทำงานบนเครื่องของคุณทั้งหมดผ่านเทคโนโลยี WebCodecs และ FFmpeg WebAssembly ไม่มีการอัปโหลดหรือส่งไฟล์วิดีโอของคุณออกไปยังเซิร์ฟเวอร์ใด ๆ ทั้งสิ้น
          </div>
        </div>

        {/* 1. คุกกี้คืออะไร */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cookie className="w-5 h-5 text-indigo-400" />
            <span>1. การเก็บคุกกี้คืออะไร ?</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            <strong>คุกกี้ (Cookies)</strong> คือไฟล์ข้อความขนาดเล็ก (Text Files) ที่ถูกบันทึกไว้ในอุปกรณ์ของคุณ (เช่น คอมพิวเตอร์ หรือสมาร์ตโฟน) ผ่านทางเว็บเบราว์เซอร์ เมื่อคุณเข้าชมเว็บไซต์ คุกกี้ทำหน้าที่จดจำข้อมูลและการตั้งค่าของคุณ เพื่อช่วยให้คุณสามารถใช้งานเว็บไซต์ได้อย่างราบรื่นและมีประสิทธิภาพยิ่งขึ้นในการเข้าชมครั้งถัดไป
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            คุกกี้ไม่สามารถเข้าถึงไฟล์ส่วนตัวในเครื่องของคุณ และไม่มีการเข้าถึงหรือนำข้อมูลในไฟล์วิดีโอที่คุณตัดต่อออกไปใช้งานใด ๆ
          </p>
        </section>

        {/* 2. ประโยชน์ของคุกกี้ */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>2. ประโยชน์ของคุกกี้ (Benefits of Cookies)</span>
          </h2>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-white">จดจำการตั้งค่าการใช้งาน:</strong> เช่น การจำสถานะการยอมรับข้อตกลงความเป็นส่วนตัว เพื่อไม่ให้หน้าต่างแจ้งเตือนขึ้นมารบกวนซ้ำซ้อน
            </li>
            <li>
              <strong className="text-white">เพิ่มความสะดวกและความเร็ว:</strong> ช่วยให้เว็บเบราว์เซอร์โหลดระบบเครื่องมือตัดต่อวิดีโอได้อย่างรวดเร็ว
            </li>
            <li>
              <strong className="text-white">รักษาความปลอดภัย:</strong> ป้องกันการใช้งานระบบที่ผิดปกติและตรวจสอบความสมบูรณ์ของระบบ
            </li>
            <li>
              <strong className="text-white">สนับสนุนการให้บริการฟรี:</strong> ช่วยแสดงโฆษณาที่เหมาะสมจาก Google AdSense ทำให้ทีมงานสามารถให้บริการเครื่องมือตัดต่อวิดีโอนี้ได้ฟรี 100% แก่ทุกคนโดยไม่มีค่าใช้จ่ายและไม่มีลายน้ำ
            </li>
          </ul>
        </section>

        {/* 3. คุกกี้ที่เราใช้งาน */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>3. คุกกี้ที่เราใช้งาน (Types of Cookies We Use)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            เว็บไซต์ของเรามีการใช้งานคุกกี้และเทคโนโลยีการบันทึกข้อมูลในเครื่อง (LocalStorage) โดยแบ่งออกเป็น 3 ประเภท ดังนี้:
          </p>

          {/* 3.1 Necessary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-300">
                1. คุกกี้ที่มีความจำเป็นอย่างยิ่ง (Necessary Cookies)
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                จำเป็น (Always Active)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              คุกกี้ประเภทนี้มีความจำเป็นอย่างยิ่งต่อการทำงานพื้นฐานของเว็บไซต์ เช่น การจัดสรรหน่วยความจำสำหรับระบบตัดต่อวิดีโอ (WebCodecs / OPFS) และการบันทึกสถานะการยอมรับเงื่อนไขคุกกี้ของคุณ หากไม่มีคุกกี้ประเภทนี้ เว็บไซต์จะไม่สามารถทำงานได้อย่างถูกต้อง
            </p>
          </div>

          {/* 3.2 Functionality */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-300">
                2. คุกกี้เพื่อการทำงานของเว็บไซต์ (Functionality Cookies)
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                ฟังก์ชันการใช้งาน
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              คุกกี้ประเภทนี้ใช้จดจำการตั้งค่าต่าง ๆ เช่น อัตราส่วนภาพที่คุณเลือกไว้ล่าสุด (16:9, 9:16, 1:1), ประเภทไฟล์ที่ต้องการบันทึก (MP4 หรือ WebM) และระดับเสียงของเครื่องเล่นวิดีโอ เพื่อให้คุณใช้งานต่อเนื่องได้อย่างราบรื่น
            </p>
          </div>

          {/* 3.3 Analytical */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-300">
                3. คุกกี้เพื่อการวิเคราะห์/เพื่อประสิทธิภาพ (Analytical Cookies)
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                วิเคราะห์และปรับปรุง
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              คุกกี้ประเภทนี้ช่วยให้เราเข้าใจการเข้าชมเว็บไซต์ สถิติการใช้งาน และการวัดผลโฆษณาจากผู้ให้บริการบุคคลที่สาม (Google AdSense) ข้อมูลทั้งหมดเป็นแบบไม่ระบุตัวตน (Anonymous) นำมาใช้เพื่อพัฒนาประสิทธิภาพและความเร็วของระบบให้ดียิ่งขึ้น
            </p>
          </div>
        </section>

        {/* 4. วิธีปิดการทำงานของคุกกี้ */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <span>4. วิธีปิดการทำงานของคุกกี้ (How to Disable Cookies)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            คุณสามารถเลือกปิดการทำงานหรือลบคุกกี้ได้ตลอดเวลา ผ่านการตั้งค่าบนเว็บเบราว์เซอร์ของคุณ โดยทำตามขั้นตอนด้านล่าง:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Chrome */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white">🌐 Google Chrome</h4>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>คลิกที่ไอคอน <strong>⋮</strong> ที่มุมขวาบน</li>
                <li>เลือก <strong>การตั้งค่า (Settings)</strong></li>
                <li>ไปที่ <strong>ความเป็นส่วนตัวและความปลอดภัย</strong></li>
                <li>เลือก <strong>คุกกี้ของบุคคลที่สาม</strong> และปรับการตั้งค่า</li>
              </ol>
            </div>

            {/* Safari */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white">🧭 Apple Safari</h4>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>ไปที่ <strong>Safari</strong> &gt; <strong>การตั้งค่า (Settings)</strong></li>
                <li>เลือกแถบ <strong>ความเป็นส่วนตัว (Privacy)</strong></li>
                <li>เลือก <strong>บล็อกคุกกี้ทั้งหมด</strong> ตามต้องการ</li>
              </ol>
            </div>

            {/* Edge */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white">🌀 Microsoft Edge</h4>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>คลิกไอคอน <strong>...</strong> ที่มุมขวาบน</li>
                <li>เลือก <strong>การตั้งค่า (Settings)</strong></li>
                <li>ไปที่ <strong>คุกกี้และการอนุญาตไซต์</strong></li>
                <li>เลือก <strong>จัดการและลบคุกกี้และข้อมูลไซต์</strong></li>
              </ol>
            </div>

            {/* Firefox */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-white">🦊 Mozilla Firefox</h4>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>คลิกไอคอน <strong>☰</strong> ที่มุมขวาบน</li>
                <li>เลือก <strong>การตั้งค่า (Settings)</strong></li>
                <li>ไปที่ <strong>ความเป็นส่วนตัวและความปลอดภัย</strong></li>
                <li>ปรับการตั้งค่าในส่วน <strong>การป้องกันการติดตาม</strong></li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p>ตัดคลิปไว • เครื่องมือตัดต่อวิดีโอออนไลน์ฟรี ปลอดภัย 100% ประมวลผลในเครื่องของคุณ</p>
        <p>&copy; 2026 ตัดคลิปไว (TadClipWai). สงวนลิขสิทธิ์ทุกประการ.</p>
      </footer>
    </div>
  );
};

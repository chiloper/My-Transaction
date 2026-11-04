# Money Planner (Next.js + Supabase `autoscript.transactions`)

เว็บแอปพลิเคชันแสดงรายการรายรับ-รายจ่ายและกราฟสรุปข้อมูลการเงินด้วย **Next.js (App Router)** เชื่อมต่อกับฐานข้อมูล **Supabase** (`autoscript.transactions`) พร้อมรองรับการใช้งานทั้งบน Desktop และ Mobile

## ฟีเจอร์หลัก
1. **ภาพรวม (Dashboard)**
   - การ์ดสรุปยอด **รายรับรวม**, **รายจ่ายรวม**, และ **คงเหลือสุทธิ** ประจำเดือน
   - กราฟวงกลม (Doughnut Chart) แสดงสัดส่วนรายรับและรายจ่าย สามารถสลับดูได้ทั้ง **แยกตามธนาคาร (`bank`)** และ **แยกตามรายละเอียด (`description`)**
   - การ์ดสรุปยอดธุรกรรมแยกตามธนาคาร
   - กราฟแท่ง (Bar Chart) แสดงแนวโน้มรายรับ-รายจ่ายตลอดทั้งปี (ม.ค. - ธ.ค.)
2. **ปฏิทินรายรับ-จ่าย (Calendar)**
   - แสดงยอดรับ-จ่ายและคงเหลือสุทธิรายวันในรูปแบบปฏิทิน
   - แตะที่วันที่เพื่อดูรายการธุรกรรมทั้งหมดของวันนั้นได้ทันที
3. **บันทึกและประวัติรายการ (Transactions)**
   - ฟอร์มเพิ่มรายการธุรกรรมใหม่ (รองรับการเพิ่มหลายรายการพร้อมกัน)
   - ตารางประวัติรายการ (Desktop) และการ์ดรายการ (Mobile) พร้อมตัวกรองตามธนาคาร, ประเภท, ช่วงวันที่ และคำค้นหา
   - ดูข้อความต้นฉบับจากอีเมลธนาคาร (`raw_body` / `email_id`)

## การตั้งค่าเชื่อมต่อ Supabase

1. แก้ไขไฟล์ `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SUPABASE_SCHEMA=autoscript
   ```
   *(หรือสามารถกดปุ่ม **"ตั้งค่า Supabase"** บนหน้าเว็บเพื่อใส่ URL และ Key ได้โดยตรง)*

2. **ตั้งค่าให้ Supabase API เข้าถึง Schema `autoscript` ได้:**
   - ไปที่ Supabase Dashboard &rarr; **Project Settings** &rarr; **Data API (หรือ API)**
   - ในหัวข้อ **Exposed schemas** ให้เพิ่ม `autoscript` เข้าไป (คู่กับ `public`)
   - รัน SQL เพื่อให้สิทธิ์เข้าถึง Schema `autoscript` (หากยังไม่ได้ตั้งค่า):
     ```sql
     grant usage on schema autoscript to anon, authenticated, service_role;
     grant all on all tables in schema autoscript to anon, authenticated, service_role;
     grant all on all sequences in schema autoscript to anon, authenticated, service_role;
     ```

## การรันโปรเจกต์

```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

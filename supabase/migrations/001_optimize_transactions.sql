-- =============================================================================
-- SQL สำหรับปรับปรุงประสิทธิภาพฐานข้อมูล autoscript.transactions (รองรับหลักแสน-ล้านรายการ)
-- วิธีใช้: คัดลอกไปรันใน Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. สร้าง Index เพื่อเพิ่มความเร็วในการค้นหา กรองข้อมูล และเรียงลำดับตามวันที่/ธนาคาร
create index if not exists idx_transactions_date
  on autoscript.transactions (transaction_date desc nulls last, created_at desc);

create index if not exists idx_transactions_bank_type
  on autoscript.transactions (bank, type);

create index if not exists idx_transactions_type_date
  on autoscript.transactions (type, transaction_date desc);

-- 2. สร้าง View สรุปยอดรายเดือนแยกตามธนาคาร (ช่วยให้กราฟรายปีและรายการเดือนดึงข้อมูลเพียงไม่กี่แถว)
create or replace view autoscript.monthly_bank_summary as
select
  to_char(coalesce(transaction_date, created_at) at time zone 'Asia/Bangkok', 'YYYY-MM') as year_month,
  extract(year from (coalesce(transaction_date, created_at) at time zone 'Asia/Bangkok'))::int as tx_year,
  extract(month from (coalesce(transaction_date, created_at) at time zone 'Asia/Bangkok'))::int as tx_month,
  coalesce(bank, 'ไม่ระบุธนาคาร') as bank,
  type,
  count(*)::int as tx_count,
  coalesce(sum(amount), 0)::numeric(14, 2) as total_amount
from autoscript.transactions
group by 1, 2, 3, 4, 5;

-- 3. สร้าง View สรุปยอดรายวัน (ช่วยให้หน้าปฏิทินดึงข้อมูลเร็วขึ้นโดยไม่ต้องดึงทุกแถว)
create or replace view autoscript.daily_transaction_summary as
select
  to_char(coalesce(transaction_date, created_at) at time zone 'Asia/Bangkok', 'YYYY-MM-DD') as tx_date,
  type,
  count(*)::int as tx_count,
  coalesce(sum(amount), 0)::numeric(14, 2) as total_amount
from autoscript.transactions
group by 1, 2;

-- 4. เปิดสิทธิ์ให้ role anon, authenticated และ service_role เรียกใช้งาน Schema, Table และ Views ได้ทั้งหมด
grant usage on schema autoscript to anon, authenticated, service_role;
grant all on all tables in schema autoscript to anon, authenticated, service_role;
grant all on all sequences in schema autoscript to anon, authenticated, service_role;
grant select on autoscript.monthly_bank_summary to anon, authenticated, service_role;
grant select on autoscript.daily_transaction_summary to anon, authenticated, service_role;

import { Transaction } from '@/types/transaction';

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatMonthThai(ym: string): string {
  if (ym === 'ALL') return 'ทั้งหมดทุกเดือน';
  const [y, m] = ym.split('-');
  const yearNum = Number.parseInt(y, 10);
  const monthIdx = Number.parseInt(m, 10) - 1;
  if (Number.isNaN(yearNum) || Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return ym;
  }
  const date = new Date(yearNum, monthIdx, 1);
  const monthLong = date.toLocaleDateString('th-TH', { month: 'long' });
  return `${monthLong} ${yearNum + 543}`;
}

export function getTxDateKey(tx: Transaction): string {
  const raw = tx.transaction_date || tx.created_at;
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return String(raw).slice(0, 10);
  }
}

export function formatShortAmount(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return Math.round(num).toLocaleString();
}

export function getDefaultDateTimeLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

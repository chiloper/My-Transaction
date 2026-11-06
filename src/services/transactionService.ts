import { getSupabaseClient } from '@/lib/supabase';
import {
  NewTransactionInput,
  Transaction,
  TransactionType,
} from '@/types/transaction';
import { getTxDateKey } from '@/utils/dateUtils';

export const MISSING_ENV_ERROR =
  'กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local หรือ GitHub Actions Secrets';

// ไม่ดึง raw_body มาพร้อมตารางหลักเพื่อลดขนาด Payload ลง 80-90%
const LIGHTWEIGHT_COLUMNS =
  'id, email_id, type, amount, description, transaction_date, created_at, bank';

export interface PaginatedQueryParams {
  page: number;
  pageSize: number;
  filterBank?: string;
  filterType?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  searchQuery?: string;
}

export interface PaginatedResult {
  rows: Transaction[];
  totalCount: number;
}

export interface MonthlyTotalPoint {
  income: number[];
  expense: number[];
}

export interface MonthlyBankSummaryRow {
  year_month: string;
  tx_year: number;
  tx_month: number;
  bank: string;
  type: TransactionType;
  tx_count: number;
  total_amount: number;
}

export interface DailySummaryRow {
  tx_date: string;
  type: TransactionType;
  tx_count: number;
  total_amount: number;
}

function normalizeRow(row: Record<string, unknown>): Transaction {
  return {
    ...(row as unknown as Transaction),
    amount:
      row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0,
  };
}

export function getMonthDateRangeISO(yearMonth: string): {
  startISO: string;
  endISO: string;
} {
  const [yStr, mStr] = yearMonth.split('-');
  const year = Number.parseInt(yStr, 10);
  const month = Number.parseInt(mStr, 10);
  const lastDay = new Date(year, month, 0).getDate();

  const startISO = `${yearMonth}-01T00:00:00+07:00`;
  const endISO = `${yearMonth}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`;
  return { startISO, endISO };
}

/**
 * ดึงข้อมูลสรุปจาก View `autoscript.monthly_bank_summary`
 * หาก View ยังไม่ได้เปิดสิทธิ์ GRANT SELECT จะ Fallback คำนวณจากตาราง transactions อัตโนมัติ
 */
export async function fetchBankSummaryByPeriod(
  selectedMonth: string
): Promise<MonthlyBankSummaryRow[]> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  let query = supabase
    .schema(schema)
    .from('monthly_bank_summary')
    .select('year_month, tx_year, tx_month, bank, type, tx_count, total_amount');

  if (selectedMonth !== 'ALL') {
    query = query.eq('year_month', selectedMonth);
  }

  const { data, error } = await query;

  if (!error && data) {
    return data.map((row: Record<string, unknown>) => ({
      year_month: String(row.year_month || ''),
      tx_year: Number(row.tx_year || 0),
      tx_month: Number(row.tx_month || 0),
      bank: String(row.bank || 'ไม่ระบุธนาคาร'),
      type: row.type === 'income' ? 'income' : 'expense',
      tx_count: Number(row.tx_count || 0),
      total_amount: Number(row.total_amount || 0),
    }));
  }

  // Fallback กรณี View ยังไม่ได้รับสิทธิ์ GRANT SELECT (เช่น error 42501)
  const fallbackTxs = await fetchTransactionsByPeriod(selectedMonth);
  const map: Record<string, MonthlyBankSummaryRow> = {};

  fallbackTxs.forEach((tx) => {
    const dKey = getTxDateKey(tx);
    const ym = dKey.slice(0, 7);
    const y = Number.parseInt(dKey.slice(0, 4), 10) || 0;
    const m = Number.parseInt(dKey.slice(5, 7), 10) || 0;
    const bank = (tx.bank || 'ไม่ระบุธนาคาร').trim();
    const key = `${ym}|${bank}|${tx.type}`;

    if (!map[key]) {
      map[key] = {
        year_month: ym,
        tx_year: y,
        tx_month: m,
        bank,
        type: tx.type,
        tx_count: 0,
        total_amount: 0,
      };
    }
    map[key].tx_count += 1;
    map[key].total_amount += Number(tx.amount || 0);
  });

  return Object.values(map);
}

/**
 * ดึงข้อมูลรายการธุรกรรมเฉพาะเมื่อต้องใช้จัดกลุ่มตาม description ในกราฟวงกลม
 */
export async function fetchTransactionsByPeriod(
  selectedMonth: string
): Promise<Transaction[]> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  let query = supabase
    .schema(schema)
    .from('transactions')
    .select(LIGHTWEIGHT_COLUMNS)
    .order('transaction_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(2000);

  if (selectedMonth !== 'ALL') {
    const { startISO, endISO } = getMonthDateRangeISO(selectedMonth);
    query = query
      .gte('transaction_date', startISO)
      .lte('transaction_date', endISO);
  }

  const { data, error } = await query;

  if (error) {
    const hint =
      error.code === 'PGRST106'
        ? ` (กรุณาเพิ่ม "${schema}" ใน Supabase Settings -> API -> Exposed schemas)`
        : '';
    throw new Error(`${error.message}${hint}`);
  }

  return (data || []).map((r) =>
    normalizeRow(r as unknown as Record<string, unknown>)
  );
}

/**
 * ดึงยอดสรุปรายวันจาก View `autoscript.daily_transaction_summary` สำหรับตารางปฏิทิน
 * พร้อม Fallback อัตโนมัติหาก View ยังไม่ได้เปิดสิทธิ์ GRANT SELECT
 */
export async function fetchDailySummaryByMonth(
  yearMonth: string
): Promise<DailySummaryRow[]> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const { data, error } = await supabase
    .schema(schema)
    .from('daily_transaction_summary')
    .select('tx_date, type, tx_count, total_amount')
    .like('tx_date', `${yearMonth}-%`);

  if (!error && data) {
    return data.map((row: Record<string, unknown>) => ({
      tx_date: String(row.tx_date || ''),
      type: row.type === 'income' ? 'income' : 'expense',
      tx_count: Number(row.tx_count || 0),
      total_amount: Number(row.total_amount || 0),
    }));
  }

  // Fallback
  const fallbackTxs = await fetchTransactionsByPeriod(yearMonth);
  const map: Record<string, DailySummaryRow> = {};

  fallbackTxs.forEach((tx) => {
    const txDate = getTxDateKey(tx);
    if (!txDate) return;
    const key = `${txDate}|${tx.type}`;
    if (!map[key]) {
      map[key] = {
        tx_date: txDate,
        type: tx.type,
        tx_count: 0,
        total_amount: 0,
      };
    }
    map[key].tx_count += 1;
    map[key].total_amount += Number(tx.amount || 0);
  });

  return Object.values(map);
}

/**
 * Lazy-load ดึงรายการธุรกรรมเฉพาะวันที่คลิกบนปฏิทิน (YYYY-MM-DD)
 */
export async function fetchTransactionsByDate(
  dateStr: string
): Promise<Transaction[]> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const startISO = `${dateStr}T00:00:00+07:00`;
  const endISO = `${dateStr}T23:59:59.999+07:00`;

  const { data, error } = await supabase
    .schema(schema)
    .from('transactions')
    .select(LIGHTWEIGHT_COLUMNS)
    .gte('transaction_date', startISO)
    .lte('transaction_date', endISO)
    .order('transaction_date', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((r) =>
    normalizeRow(r as unknown as Record<string, unknown>)
  );
}

/**
 * ดึงข้อมูลแบบ Server-side Pagination (.range) สำหรับหน้าประวัติรายการ
 */
export async function fetchPaginatedTransactions(
  params: PaginatedQueryParams
): Promise<PaginatedResult> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .schema(schema)
    .from('transactions')
    .select(LIGHTWEIGHT_COLUMNS, { count: 'exact' })
    .order('transaction_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (params.filterBank) {
    query = query.eq('bank', params.filterBank);
  }
  if (params.filterType) {
    query = query.eq('type', params.filterType);
  }
  if (params.filterStartDate) {
    query = query.gte(
      'transaction_date',
      `${params.filterStartDate}T00:00:00+07:00`
    );
  }
  if (params.filterEndDate) {
    query = query.lte(
      'transaction_date',
      `${params.filterEndDate}T23:59:59.999+07:00`
    );
  }
  if (params.searchQuery?.trim()) {
    const q = params.searchQuery.trim();
    query = query.or(`description.ilike.%${q}%,bank.ilike.%${q}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: (data || []).map((r) =>
      normalizeRow(r as unknown as Record<string, unknown>)
    ),
    totalCount: count ?? 0,
  };
}

/**
 * Lazy-load ดึง raw_body เฉพาะเมื่อผู้ใช้กดปุ่มดูข้อความต้นฉบับ
 */
export async function fetchTransactionRawBody(
  id: number
): Promise<string | null> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const { data, error } = await supabase
    .schema(schema)
    .from('transactions')
    .select('raw_body')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (data as { raw_body?: string | null } | null)?.raw_body || null;
}

/**
 * ดึงยอดสรุปรายปี (12 เดือน) จาก View `monthly_bank_summary`
 */
export async function fetchYearlyMonthlyTotals(
  year: number
): Promise<MonthlyTotalPoint> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    return { income: new Array(12).fill(0), expense: new Array(12).fill(0) };
  }

  const income = new Array(12).fill(0);
  const expense = new Array(12).fill(0);

  const viewRes = await supabase
    .schema(schema)
    .from('monthly_bank_summary')
    .select('tx_month, type, total_amount')
    .eq('tx_year', year);

  if (!viewRes.error && viewRes.data) {
    viewRes.data.forEach((row: Record<string, unknown>) => {
      const mIdx = Number(row.tx_month) - 1;
      const amt = Number(row.total_amount || 0);
      if (mIdx >= 0 && mIdx < 12) {
        if (row.type === 'income') income[mIdx] += amt;
        else if (row.type === 'expense') expense[mIdx] += amt;
      }
    });
    return { income, expense };
  }

  // Fallback
  const startISO = `${year}-01-01T00:00:00+07:00`;
  const endISO = `${year}-12-31T23:59:59.999+07:00`;

  const { data } = await supabase
    .schema(schema)
    .from('transactions')
    .select('type, amount, transaction_date, created_at')
    .gte('transaction_date', startISO)
    .lte('transaction_date', endISO)
    .limit(10000);

  (data || []).forEach((row: Record<string, unknown>) => {
    const dateKey = getTxDateKey(row as unknown as Transaction);
    const mIdx = Number.parseInt(dateKey.slice(5, 7), 10) - 1;
    const amt = Number(row.amount || 0);
    if (mIdx >= 0 && mIdx < 12) {
      if (row.type === 'income') income[mIdx] += amt;
      else if (row.type === 'expense') expense[mIdx] += amt;
    }
  });

  return { income, expense };
}

/**
 * ดึงรายการเดือนที่มีข้อมูลและรายชื่อธนาคารทั้งหมดจาก View `monthly_bank_summary`
 */
export async function fetchMetadata(): Promise<{
  months: string[];
  years: number[];
  banks: string[];
}> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    return {
      months: [currentMonth],
      years: [currentYear],
      banks: [],
    };
  }

  const viewRes = await supabase
    .schema(schema)
    .from('monthly_bank_summary')
    .select('year_month, tx_year, bank');

  if (!viewRes.error && viewRes.data && viewRes.data.length > 0) {
    const monthSet = new Set<string>([currentMonth]);
    const yearSet = new Set<number>([currentYear]);
    const bankSet = new Set<string>();

    viewRes.data.forEach((r: Record<string, unknown>) => {
      if (r.year_month) monthSet.add(String(r.year_month));
      if (r.tx_year) yearSet.add(Number(r.tx_year));
      if (r.bank && r.bank !== 'ไม่ระบุธนาคาร') bankSet.add(String(r.bank));
    });

    return {
      months: Array.from(monthSet).sort().reverse(),
      years: Array.from(yearSet).sort((a, b) => b - a),
      banks: Array.from(bankSet),
    };
  }

  const { data } = await supabase
    .schema(schema)
    .from('transactions')
    .select('transaction_date, created_at, bank')
    .order('transaction_date', { ascending: false, nullsFirst: false })
    .limit(2000);

  const monthSet = new Set<string>([currentMonth]);
  const yearSet = new Set<number>([currentYear]);
  const bankSet = new Set<string>();

  (data || []).forEach((r: Record<string, unknown>) => {
    const d = getTxDateKey(r as unknown as Transaction);
    if (d.length >= 7) {
      monthSet.add(d.slice(0, 7));
      const y = Number.parseInt(d.slice(0, 4), 10);
      if (!Number.isNaN(y)) yearSet.add(y);
    }
    if (r.bank) bankSet.add(String(r.bank).trim());
  });

  return {
    months: Array.from(monthSet).sort().reverse(),
    years: Array.from(yearSet).sort((a, b) => b - a),
    banks: Array.from(bankSet),
  };
}

export async function insertTransactionsToDb(
  items: NewTransactionInput[]
): Promise<void> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const rowsToInsert = items.map((item) => ({
    type: item.type === 'income' ? 'income' : 'expense',
    amount: Number(item.amount) || 0,
    description: item.description ? String(item.description) : null,
    transaction_date: item.transaction_date
      ? new Date(String(item.transaction_date)).toISOString()
      : new Date().toISOString(),
    bank: item.bank ? String(item.bank) : null,
    email_id: item.email_id ? String(item.email_id) : null,
    raw_body: item.raw_body ? String(item.raw_body) : null,
  }));

  const { error } = await supabase
    .schema(schema)
    .from('transactions')
    .insert(rowsToInsert);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTransactionFromDb(id: number): Promise<void> {
  const { supabase, schema, isConfigured } = getSupabaseClient();
  if (!isConfigured || !supabase) {
    throw new Error(MISSING_ENV_ERROR);
  }

  const { error } = await supabase
    .schema(schema)
    .from('transactions')
    .delete()
    .eq('id', Number(id));

  if (error) {
    throw new Error(error.message);
  }
}

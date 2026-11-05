'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { getSupabaseClient } from '@/lib/supabase';
import { NewTransactionInput, Transaction } from '@/types/transaction';
import { getTxDateKey } from '@/utils/dateUtils';

const MISSING_ENV_ERROR =
  'กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local หรือ GitHub Actions Secrets';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { supabase, schema, isConfigured } = getSupabaseClient();
    if (!isConfigured || !supabase) {
      setTransactions([]);
      setErrorMessage(MISSING_ENV_ERROR);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .schema(schema)
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        setTransactions([]);
        const hint =
          error.code === 'PGRST106'
            ? ` (กรุณาเพิ่ม "${schema}" ใน Supabase Settings -> API -> Exposed schemas)`
            : '';
        setErrorMessage(`${error.message}${hint}`);
        return;
      }

      const rows: Transaction[] = (data || []).map(
        (row: Record<string, unknown>) => ({
          ...(row as unknown as Transaction),
          amount:
            row.amount !== null && row.amount !== undefined
              ? Number(row.amount)
              : 0,
        })
      );

      setTransactions(rows);

      if (rows.length > 0) {
        const latestMonth = getTxDateKey(rows[0]).slice(0, 7);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const hasCurrent = rows.some((r) =>
          getTxDateKey(r).startsWith(currentMonth)
        );
        if (!hasCurrent && latestMonth) {
          setSelectedMonth(latestMonth);
        }
      }
    } catch (err: unknown) {
      setTransactions([]);
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ Supabase ได้'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(new Date().toISOString().slice(0, 7));
    transactions.forEach((t) => {
      const d = getTxDateKey(t);
      if (d.length >= 7) set.add(d.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const addTransactions = useCallback(
    async (items: NewTransactionInput[]) => {
      const { supabase, schema, isConfigured } = getSupabaseClient();
      if (!isConfigured || !supabase) {
        Swal.fire('เกิดข้อผิดพลาด', MISSING_ENV_ERROR, 'error');
        return;
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
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        return;
      }

      await fetchTransactions();
      Swal.fire({
        title: 'สำเร็จ',
        text: 'บันทึกข้อมูลลง Supabase เรียบร้อยแล้ว',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
      });
    },
    [fetchTransactions]
  );

  const deleteTransaction = useCallback(async (id: number) => {
    const { supabase, schema, isConfigured } = getSupabaseClient();
    if (!isConfigured || !supabase) {
      Swal.fire('เกิดข้อผิดพลาด', MISSING_ENV_ERROR, 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: 'ลบรายการนี้?',
      text: 'คุณต้องการลบรายการธุรกรรมนี้ใช่หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e63946',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'ลบรายการ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .schema(schema)
      .from('transactions')
      .delete()
      .eq('id', Number(id));

    if (error) {
      Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    Swal.fire({
      title: 'ลบสำเร็จ',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
    });
  }, []);

  return {
    transactions,
    loading,
    errorMessage,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    fetchTransactions,
    addTransactions,
    deleteTransaction,
  };
}

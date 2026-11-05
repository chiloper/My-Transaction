'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { NewTransactionInput, Transaction } from '@/types/transaction';
import { getTxDateKey } from '@/utils/dateUtils';

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
    try {
      const res = await fetch('/api/transactions', { cache: 'no-store' });
      const json = await res.json();

      if (!res.ok) {
        setTransactions([]);
        const hintSuffix = json.hint ? ` (${json.hint})` : '';
        setErrorMessage(
          `${json.error || 'ไม่สามารถดึงข้อมูลจาก Supabase ได้'}${hintSuffix}`
        );
        return;
      }

      const rows: Transaction[] = json.data || [];
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
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
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
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: items }),
      });
      const json = await res.json();
      if (!res.ok) {
        Swal.fire(
          'เกิดข้อผิดพลาด',
          json.error || 'ไม่สามารถบันทึกข้อมูลได้',
          'error'
        );
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

    const res = await fetch(`/api/transactions?id=${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) {
      Swal.fire('เกิดข้อผิดพลาด', json.error || 'ลบไม่สำเร็จ', 'error');
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

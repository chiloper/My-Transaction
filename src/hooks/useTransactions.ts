'use client';

import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  deleteTransactionFromDb,
  fetchBankSummaryByPeriod,
  fetchMetadata,
  insertTransactionsToDb,
  MonthlyBankSummaryRow,
} from '@/services/transactionService';
import { NewTransactionInput } from '@/types/transaction';

export function useTransactions() {
  const [bankSummaryRows, setBankSummaryRows] = useState<
    MonthlyBankSummaryRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [availableMonths, setAvailableMonths] = useState<string[]>(() => [
    new Date().toISOString().slice(0, 7),
  ]);
  const [availableYears, setAvailableYears] = useState<number[]>(() => [
    new Date().getFullYear(),
  ]);
  const [knownBanks, setKnownBanks] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMetadata = useCallback(async () => {
    try {
      const meta = await fetchMetadata();
      setAvailableMonths(meta.months);
      setAvailableYears(meta.years);
      setKnownBanks(meta.banks);

      const currentMonth = new Date().toISOString().slice(0, 7);
      if (
        meta.months.length > 0 &&
        !meta.months.includes(currentMonth) &&
        selectedMonth === currentMonth
      ) {
        setSelectedMonth(meta.months[0]);
      }
    } catch {
      // ignore metadata error
    }
  }, [selectedMonth]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const rows = await fetchBankSummaryByPeriod(selectedMonth);
      setBankSummaryRows(rows);
    } catch (err: unknown) {
      setBankSummaryRows([]);
      setErrorMessage(
        err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อ Supabase ได้'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata, refreshKey]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshKey]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const addTransactions = useCallback(
    async (items: NewTransactionInput[]) => {
      try {
        await insertTransactionsToDb(items);
        triggerRefresh();
        Swal.fire({
          title: 'สำเร็จ',
          text: 'บันทึกข้อมูลลง Supabase เรียบร้อยแล้ว',
          icon: 'success',
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err: unknown) {
        Swal.fire(
          'เกิดข้อผิดพลาด',
          err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้',
          'error'
        );
      }
    },
    [triggerRefresh]
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
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

      try {
        await deleteTransactionFromDb(id);
        triggerRefresh();
        Swal.fire({
          title: 'ลบสำเร็จ',
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (err: unknown) {
        Swal.fire(
          'เกิดข้อผิดพลาด',
          err instanceof Error ? err.message : 'ลบไม่สำเร็จ',
          'error'
        );
      }
    },
    [triggerRefresh]
  );

  return {
    bankSummaryRows,
    loading,
    errorMessage,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    availableYears,
    knownBanks,
    refreshKey,
    fetchTransactions: triggerRefresh,
    addTransactions,
    deleteTransaction,
  };
}

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Transaction, NewTransactionInput } from '@/types/transaction';
import DashboardSection, { getTxDateKey } from '@/components/DashboardSection';
import CalendarSection from '@/components/CalendarSection';
import TransactionsSection from '@/components/TransactionsSection';

type ActiveTab = 'dashboard' | 'calendar' | 'transactions';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Month filter for Dashboard
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  // Date filters for Transactions tab (used when clicking a calendar day)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/transactions', {
        cache: 'no-store',
      });
      const json = await res.json();

      if (res.ok) {
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
      } else {
        setTransactions([]);
        setErrorMessage(json.hint ? `${json.error} (${json.hint})` : json.error || 'ไม่สามารถดึงข้อมูลจาก Supabase ได้');
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
    const currentMonth = new Date().toISOString().slice(0, 7);
    set.add(currentMonth);
    transactions.forEach((t) => {
      const d = getTxDateKey(t);
      if (d.length >= 7) set.add(d.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const handleAddTransactions = async (items: NewTransactionInput[]) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: items }),
    });
    const json = await res.json();
    if (!res.ok) {
      Swal.fire('เกิดข้อผิดพลาด', json.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
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
  };

  const handleDeleteTransaction = async (id: number) => {
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
  };

  const handleViewDayInHistory = (dateStr: string) => {
    setFilterStartDate(dateStr);
    setFilterEndDate(dateStr);
    setActiveTab('transactions');
  };

  const pageTitleMap: Record<ActiveTab, string> = {
    dashboard: 'Dashboard ภาพรวม',
    calendar: 'ปฏิทินรายรับ-จ่าย',
    transactions: 'บันทึกรายการ / ประวัติ',
  };

  return (
    <div className="min-h-screen">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[1040] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fas fa-wallet"></i>
            <span>Money Planner</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white lg:hidden text-lg cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="sidebar-menu">
          <nav className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className={`nav-link-item ${
                activeTab === 'dashboard' ? 'active' : ''
              }`}
            >
              <i className="fas fa-chart-pie"></i>
              <span>ภาพรวม (Dashboard)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('calendar');
                setSidebarOpen(false);
              }}
              className={`nav-link-item ${
                activeTab === 'calendar' ? 'active' : ''
              }`}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>ปฏิทินรายรับ-จ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('transactions');
                setSidebarOpen(false);
              }}
              className={`nav-link-item ${
                activeTab === 'transactions' ? 'active' : ''
              }`}
            >
              <i className="fas fa-plus-circle"></i>
              <span>บันทึกรายการ</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-700 text-xl p-1 cursor-pointer"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h5 className="m-0 text-[#4361ee] font-bold text-base sm:text-lg">
              {pageTitleMap[activeTab]}
            </h5>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => fetchTransactions()}
              title="รีเฟรชข้อมูล"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-[#4361ee] flex items-center justify-center transition cursor-pointer"
            >
              <i className={`fas fa-sync-alt text-xs ${loading ? 'fa-spin' : ''}`}></i>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  !errorMessage ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
              <span className="hidden sm:inline">
                {!errorMessage ? 'Online' : 'Disconnected'}
              </span>
            </span>
          </div>
        </header>

        {/* Body */}
        <main className="content-body">
          {/* Error Banner (only if error exists) */}
          {errorMessage && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-rose-600"></i>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchTransactions()}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition cursor-pointer shrink-0"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {/* Active Section */}
          {activeTab === 'dashboard' && (
            <DashboardSection
              transactions={transactions}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarSection
              transactions={transactions}
              onViewDayInHistory={handleViewDayInHistory}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsSection
              transactions={transactions}
              onAddTransactions={handleAddTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-4 rounded-lg text-xs font-medium cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#4361ee]' : 'text-gray-500'
          }`}
        >
          <i className="fas fa-chart-pie text-base mb-0.5"></i>
          <span>ภาพรวม</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center py-1 px-4 rounded-lg text-xs font-medium cursor-pointer ${
            activeTab === 'calendar' ? 'text-[#4361ee]' : 'text-gray-500'
          }`}
        >
          <i className="fas fa-calendar-alt text-base mb-0.5"></i>
          <span>ปฏิทิน</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center py-1 px-4 rounded-lg text-xs font-medium cursor-pointer ${
            activeTab === 'transactions' ? 'text-[#4361ee]' : 'text-gray-500'
          }`}
        >
          <i className="fas fa-plus-circle text-base mb-0.5"></i>
          <span>รายการ</span>
        </button>
      </nav>
    </div>
  );
}

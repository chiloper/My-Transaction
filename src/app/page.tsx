'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import Sidebar, { ActiveTab } from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ErrorBanner from '@/components/layout/ErrorBanner';
import DashboardSection from '@/components/DashboardSection';
import CalendarSection from '@/components/CalendarSection';
import TransactionsSection from '@/components/TransactionsSection';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const {
    bankSummaryRows,
    loading,
    errorMessage,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    availableYears,
    knownBanks,
    refreshKey,
    fetchTransactions,
    addTransactions,
    deleteTransaction,
  } = useTransactions();

  const handleViewDayInHistory = (dateStr: string) => {
    setFilterStartDate(dateStr);
    setFilterEndDate(dateStr);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <TopHeader
          activeTab={activeTab}
          loading={loading}
          isConnected={!errorMessage}
          onOpenSidebar={() => setSidebarOpen(true)}
          onRefresh={fetchTransactions}
        />

        <main className="content-body">
          <ErrorBanner message={errorMessage} onRetry={fetchTransactions} />

          {activeTab === 'dashboard' && (
            <DashboardSection
              bankSummaryRows={bankSummaryRows}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              availableMonths={availableMonths}
              availableYears={availableYears}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarSection
              refreshKey={refreshKey}
              onViewDayInHistory={handleViewDayInHistory}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsSection
              knownBanks={knownBanks}
              refreshKey={refreshKey}
              onAddTransactions={addTransactions}
              onDeleteTransaction={deleteTransaction}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
            />
          )}
        </main>
      </div>

      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}

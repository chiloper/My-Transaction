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
    transactions,
    loading,
    errorMessage,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
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

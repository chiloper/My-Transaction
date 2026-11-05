'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BANK_CONFIG,
  NewTransactionInput,
  Transaction,
} from '@/types/transaction';
import { getTxDateKey } from '@/utils/dateUtils';
import TransactionFormCard from './transactions/TransactionFormCard';
import TransactionFilterBar from './transactions/TransactionFilterBar';
import TransactionDesktopTable from './transactions/TransactionDesktopTable';
import TransactionMobileList from './transactions/TransactionMobileList';
import PaginationBar from './transactions/PaginationBar';
import RawBodyModal from './transactions/RawBodyModal';

interface TransactionsSectionProps {
  transactions: Transaction[];
  onAddTransactions: (items: NewTransactionInput[]) => Promise<void>;
  onDeleteTransaction: (id: number) => Promise<void>;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
}

export default function TransactionsSection({
  transactions,
  onAddTransactions,
  onDeleteTransaction,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
}: Readonly<TransactionsSectionProps>) {
  const [showFilter, setShowFilter] = useState(true);
  const [filterBank, setFilterBank] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRawTx, setSelectedRawTx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const bankOptions = useMemo(() => {
    const set = new Set<string>(Object.keys(BANK_CONFIG));
    transactions.forEach((t) => {
      if (t.bank) set.add(t.bank.trim());
    });
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions.filter((t) => {
      const dateStr = getTxDateKey(t);
      if (filterBank && (t.bank || '') !== filterBank) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterStartDate && dateStr < filterStartDate) return false;
      if (filterEndDate && dateStr > filterEndDate) return false;
      if (query) {
        const desc = (t.description || '').toLowerCase();
        const bank = (t.bank || '').toLowerCase();
        const raw = (t.raw_body || '').toLowerCase();
        if (!desc.includes(query) && !bank.includes(query) && !raw.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [
    transactions,
    filterBank,
    filterType,
    filterStartDate,
    filterEndDate,
    searchQuery,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterBank,
    filterType,
    filterStartDate,
    filterEndDate,
    searchQuery,
    pageSize,
  ]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, safeCurrentPage, pageSize]);

  const resetFilters = () => {
    setFilterBank('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div>
      <TransactionFormCard
        bankOptions={bankOptions}
        onAddTransactions={onAddTransactions}
        onSuccess={() => setCurrentPage(1)}
      />

      <div className="app-card">
        <div className="app-card-header flex flex-wrap justify-between items-center gap-2">
          <span>
            <i className="fas fa-history mr-2 text-[#4361ee]"></i>
            ประวัติรายการล่าสุด ({totalItems.toLocaleString()} รายการ)
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-normal">
              <span className="hidden sm:inline">แสดงหน้าละ:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
              >
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowFilter((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-medium cursor-pointer"
            >
              <i className="fas fa-filter mr-1.5"></i>ตัวกรอง
            </button>
          </div>
        </div>

        <div className="app-card-body">
          {showFilter && (
            <TransactionFilterBar
              bankOptions={bankOptions}
              filterBank={filterBank}
              setFilterBank={setFilterBank}
              filterType={filterType}
              setFilterType={setFilterType}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onReset={resetFilters}
            />
          )}

          <TransactionDesktopTable
            transactions={paginatedTransactions}
            onInspectRaw={setSelectedRawTx}
            onDeleteTransaction={onDeleteTransaction}
          />

          <TransactionMobileList
            transactions={paginatedTransactions}
            onInspectRaw={setSelectedRawTx}
            onDeleteTransaction={onDeleteTransaction}
          />

          <PaginationBar
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <RawBodyModal
        transaction={selectedRawTx}
        onClose={() => setSelectedRawTx(null)}
      />
    </div>
  );
}

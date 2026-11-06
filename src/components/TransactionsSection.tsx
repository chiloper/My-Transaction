'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPaginatedTransactions } from '@/services/transactionService';
import {
  BANK_CONFIG,
  NewTransactionInput,
  Transaction,
} from '@/types/transaction';
import TransactionFormCard from './transactions/TransactionFormCard';
import TransactionFilterBar from './transactions/TransactionFilterBar';
import TransactionDesktopTable from './transactions/TransactionDesktopTable';
import TransactionMobileList from './transactions/TransactionMobileList';
import PaginationBar from './transactions/PaginationBar';
import RawBodyModal from './transactions/RawBodyModal';

interface TransactionsSectionProps {
  knownBanks: string[];
  refreshKey: number;
  onAddTransactions: (items: NewTransactionInput[]) => Promise<void>;
  onDeleteTransaction: (id: number) => Promise<void>;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
}

export default function TransactionsSection({
  knownBanks,
  refreshKey,
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRawTx, setSelectedRawTx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<Transaction[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);

  // Debounce search query for server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterBank,
    filterType,
    filterStartDate,
    filterEndDate,
    debouncedSearch,
    pageSize,
  ]);

  const loadPage = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetchPaginatedTransactions({
        page: currentPage,
        pageSize,
        filterBank,
        filterType,
        filterStartDate,
        filterEndDate,
        searchQuery: debouncedSearch,
      });
      setRows(res.rows);
      setTotalItems(res.totalCount);
    } catch {
      setRows([]);
      setTotalItems(0);
    } finally {
      setTableLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    filterBank,
    filterType,
    filterStartDate,
    filterEndDate,
    debouncedSearch,
  ]);

  useEffect(() => {
    loadPage();
  }, [loadPage, refreshKey]);

  const bankOptions = useMemo(() => {
    const set = new Set<string>(Object.keys(BANK_CONFIG));
    knownBanks.forEach((b) => set.add(b));
    rows.forEach((t) => {
      if (t.bank) set.add(t.bank.trim());
    });
    return Array.from(set);
  }, [knownBanks, rows]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const resetFilters = () => {
    setFilterBank('');
    setFilterType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchQuery('');
    setDebouncedSearch('');
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
              <label htmlFor="page-size-select" className="hidden sm:inline">
                แสดงหน้าละ:
              </label>
              <select
                id="page-size-select"
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
            transactions={rows}
            loading={tableLoading}
            onInspectRaw={setSelectedRawTx}
            onDeleteTransaction={onDeleteTransaction}
          />

          <TransactionMobileList
            transactions={rows}
            loading={tableLoading}
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

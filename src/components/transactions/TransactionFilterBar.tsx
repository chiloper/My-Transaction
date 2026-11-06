'use client';

import React from 'react';

interface TransactionFilterBarProps {
  bankOptions: string[];
  filterBank: string;
  setFilterBank: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStartDate: string;
  setFilterStartDate: (val: string) => void;
  filterEndDate: string;
  setFilterEndDate: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onReset: () => void;
}

export default function TransactionFilterBar({
  bankOptions,
  filterBank,
  setFilterBank,
  filterType,
  setFilterType,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  searchQuery,
  setSearchQuery,
  onReset,
}: Readonly<TransactionFilterBarProps>) {
  return (
    <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label
            htmlFor="filter-bank"
            className="block text-xs text-gray-500 mb-1"
          >
            ธนาคาร (bank)
          </label>
          <select
            id="filter-bank"
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
          >
            <option value="">-- ทั้งหมด --</option>
            {bankOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-type"
            className="block text-xs text-gray-500 mb-1"
          >
            ประเภท (type)
          </label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
          >
            <option value="">-- ทั้งหมด --</option>
            <option value="income">รายรับ (income)</option>
            <option value="expense">รายจ่าย (expense)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-start-date"
            className="block text-xs text-gray-500 mb-1"
          >
            เริ่มวันที่
          </label>
          <input
            id="filter-start-date"
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="filter-end-date"
            className="block text-xs text-gray-500 mb-1"
          >
            ถึงวันที่
          </label>
          <input
            id="filter-end-date"
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="filter-search"
            className="block text-xs text-gray-500 mb-1"
          >
            ค้นหารายละเอียด
          </label>
          <div className="flex gap-1.5">
            <input
              id="filter-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา..."
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={onReset}
              title="รีเซ็ตตัวกรอง"
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium shrink-0 cursor-pointer"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

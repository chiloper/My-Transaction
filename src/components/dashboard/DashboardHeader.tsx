'use client';

import React from 'react';
import { formatMonthThai } from '@/utils/dateUtils';

export type GroupByOption = 'bank' | 'description';

interface DashboardHeaderProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  groupBy: GroupByOption;
  onChangeGroupBy: (groupBy: GroupByOption) => void;
}

export default function DashboardHeader({
  selectedMonth,
  onSelectMonth,
  availableMonths,
  groupBy,
  onChangeGroupBy,
}: Readonly<DashboardHeaderProps>) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
      <div>
        <h4 className="text-xl font-bold text-gray-800 mb-1">ภาพรวมการเงิน</h4>
        <p className="text-sm text-gray-500 m-0">
          สรุปข้อมูลประจำเดือน{' '}
          <span className="font-semibold text-[#4361ee]">
            {formatMonthThai(selectedMonth)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <div className="inline-flex rounded-lg bg-white p-1 shadow-xs border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => onChangeGroupBy('bank')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              groupBy === 'bank'
                ? 'bg-[#4361ee] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-university mr-1.5"></i>แยกตามธนาคาร
          </button>
          <button
            type="button"
            onClick={() => onChangeGroupBy('description')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              groupBy === 'description'
                ? 'bg-[#4361ee] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fas fa-list-ul mr-1.5"></i>แยกตามรายการ
          </button>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => onSelectMonth(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#4361ee] flex-1 sm:flex-none sm:w-52"
        >
          <option value="ALL">ดูทั้งหมดทุกเดือน</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthThai(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

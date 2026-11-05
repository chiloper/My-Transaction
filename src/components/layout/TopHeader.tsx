'use client';

import React from 'react';
import { ActiveTab } from './Sidebar';

interface TopHeaderProps {
  activeTab: ActiveTab;
  loading: boolean;
  isConnected: boolean;
  onOpenSidebar: () => void;
  onRefresh: () => void;
}

const PAGE_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Dashboard ภาพรวม',
  calendar: 'ปฏิทินรายรับ-จ่าย',
  transactions: 'บันทึกรายการ / ประวัติ',
};

export default function TopHeader({
  activeTab,
  loading,
  isConnected,
  onOpenSidebar,
  onRefresh,
}: Readonly<TopHeaderProps>) {
  return (
    <header className="top-header">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden text-gray-700 text-xl p-1 cursor-pointer"
        >
          <i className="fas fa-bars"></i>
        </button>
        <h5 className="m-0 text-[#4361ee] font-bold text-base sm:text-lg">
          {PAGE_TITLES[activeTab]}
        </h5>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onRefresh}
          title="รีเฟรชข้อมูล"
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-[#4361ee] flex items-center justify-center transition cursor-pointer"
        >
          <i className={`fas fa-sync-alt text-xs ${loading ? 'fa-spin' : ''}`}></i>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          ></span>
          <span className="hidden sm:inline">
            {isConnected ? 'Online' : 'Disconnected'}
          </span>
        </span>
      </div>
    </header>
  );
}

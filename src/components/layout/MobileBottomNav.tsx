'use client';

import React from 'react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

const NAV_ITEMS: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'ภาพรวม' },
  { id: 'calendar', icon: 'fas fa-calendar-alt', label: 'ปฏิทิน' },
  { id: 'transactions', icon: 'fas fa-plus-circle', label: 'รายการ' },
];

export default function MobileBottomNav({
  activeTab,
  onSelectTab,
}: Readonly<MobileBottomNavProps>) {
  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectTab(item.id)}
          className={`flex flex-col items-center py-1 px-4 rounded-lg text-xs font-medium cursor-pointer ${
            activeTab === item.id ? 'text-[#4361ee]' : 'text-gray-500'
          }`}
        >
          <i className={`${item.icon} text-base mb-0.5`}></i>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

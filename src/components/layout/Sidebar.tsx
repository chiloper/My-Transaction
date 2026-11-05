'use client';

import React from 'react';

export type ActiveTab = 'dashboard' | 'calendar' | 'transactions';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: 'fas fa-chart-pie', label: 'ภาพรวม (Dashboard)' },
  { id: 'calendar', icon: 'fas fa-calendar-alt', label: 'ปฏิทินรายรับ-จ่าย' },
  { id: 'transactions', icon: 'fas fa-plus-circle', label: 'บันทึกรายการ' },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}: Readonly<SidebarProps>) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          className="fixed inset-0 bg-black/40 z-[1040] lg:hidden w-full h-full border-0 cursor-default"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fas fa-wallet"></i>
            <span>Money Planner</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-white lg:hidden text-lg cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="sidebar-menu">
          <nav className="flex flex-col">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`nav-link-item ${
                  activeTab === item.id ? 'active' : ''
                }`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 text-center">
          <small className="text-gray-400 text-xs block">
            Schema: <code className="text-[#4361ee]">autoscript.transactions</code>
          </small>
        </div>
      </aside>
    </>
  );
}

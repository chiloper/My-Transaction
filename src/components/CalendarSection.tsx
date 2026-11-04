'use client';

import React, { useMemo, useState } from 'react';
import { Transaction, getBankColor } from '@/types/transaction';
import { getTxDateKey } from './DashboardSection';

interface CalendarSectionProps {
  transactions: Transaction[];
  onViewDayInHistory: (dateStr: string) => void;
}

function formatShortAmount(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return Math.round(num).toLocaleString();
}

export default function CalendarSection({
  transactions,
  onViewDayInHistory,
}: CalendarSectionProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const changeCalendarMonth = (offset: number) => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const monthTitle = useMemo(() => {
    const mName = new Date(year, month, 1).toLocaleDateString('th-TH', {
      month: 'long',
    });
    return `${mName} ${year + 543}`;
  }, [year, month]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Pre-index daily transactions
  const dailyMap = useMemo(() => {
    const map: Record<
      string,
      { inc: number; exp: number; bal: number; txs: Transaction[] }
    > = {};

    transactions.forEach((tx) => {
      const dateStr = getTxDateKey(tx);
      if (!dateStr) return;
      if (!map[dateStr]) {
        map[dateStr] = { inc: 0, exp: 0, bal: 0, txs: [] };
      }
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') map[dateStr].inc += amt;
      else map[dateStr].exp += amt;
      map[dateStr].bal = map[dateStr].inc - map[dateStr].exp;
      map[dateStr].txs.push(tx);
    });

    return map;
  }, [transactions]);

  const selectedDayTxs = useMemo(() => {
    if (!selectedDayModal) return [];
    return dailyMap[selectedDayModal]?.txs || [];
  }, [dailyMap, selectedDayModal]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h4 className="text-xl font-bold text-gray-800 mb-1">ปฏิทินการเงิน</h4>
          <p className="text-sm text-gray-500 m-0">
            ดูรายการรับ-จ่าย ในรูปแบบปฏิทิน (แตะที่วันที่เพื่อดูรายละเอียด)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-xs border border-gray-100">
          <button
            type="button"
            onClick={() => changeCalendarMonth(-1)}
            className="w-9 h-9 rounded-lg border border-[#4361ee]/30 text-[#4361ee] hover:bg-[#4361ee] hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <h5 className="mb-0 px-3 font-bold text-gray-800 text-sm sm:text-base min-w-[140px] text-center">
            {monthTitle}
          </h5>
          <button
            type="button"
            onClick={() => changeCalendarMonth(1)}
            className="w-9 h-9 rounded-lg border border-[#4361ee]/30 text-[#4361ee] hover:bg-[#4361ee] hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="app-card overflow-hidden">
        <div className="p-3 sm:p-6">
          {/* Days of Week Header */}
          <div className="calendar-grid mb-2">
            <div className="calendar-header-day text-rose-500">อา.</div>
            <div className="calendar-header-day">จ.</div>
            <div className="calendar-header-day">อ.</div>
            <div className="calendar-header-day">พ.</div>
            <div className="calendar-header-day">พฤ.</div>
            <div className="calendar-header-day text-[#4361ee]">ศ.</div>
            <div className="calendar-header-day">ส.</div>
          </div>

          {/* Calendar Cells */}
          <div className="calendar-grid">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="calendar-day empty"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;
              const summary = dailyMap[dateStr];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayModal(dateStr)}
                  className={`calendar-day ${isToday ? 'today' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="day-number">{day}</span>
                    {summary && summary.txs.length > 0 && (
                      <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-[#4361ee] px-1.5 py-0.5 rounded-full font-medium">
                        {summary.txs.length}
                      </span>
                    )}
                  </div>

                  {summary && (summary.inc > 0 || summary.exp > 0) ? (
                    <div className="day-summary">
                      {summary.inc > 0 && (
                        <div className="sum-item sum-inc">
                          <span className="label-txt">รับ</span>
                          <span>+{formatShortAmount(summary.inc)}</span>
                        </div>
                      )}
                      {summary.exp > 0 && (
                        <div className="sum-item sum-exp">
                          <span className="label-txt">จ่าย</span>
                          <span>-{formatShortAmount(summary.exp)}</span>
                        </div>
                      )}
                      <div className="sum-item sum-bal">
                        <span className="w-full text-center">
                          {summary.bal >= 0 ? '+' : ''}
                          {formatShortAmount(summary.bal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Legend */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center">
              <i className="fas fa-circle text-[#2ecc71] mr-2 text-[8px]"></i> รายรับ
            </div>
            <div className="flex items-center">
              <i className="fas fa-circle text-rose-500 mr-2 text-[8px]"></i> รายจ่าย
            </div>
            <div className="flex items-center">
              <i className="fas fa-circle text-[#8e44ad] mr-2 text-[8px]"></i> คงเหลือสุทธิรายวัน
            </div>
          </div>
        </div>
      </div>

      {/* Daily Detail Modal */}
      {selectedDayModal && (
        <div
          className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedDayModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#4361ee] text-white px-5 py-4 flex justify-between items-center">
              <div>
                <h5 className="font-bold text-base m-0">
                  รายการประจำวันที่{' '}
                  {new Date(selectedDayModal).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h5>
                <p className="text-xs text-indigo-100 m-0 mt-0.5">
                  ทั้งหมด {selectedDayTxs.length} รายการ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="text-white/80 hover:text-white text-lg cursor-pointer"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedDayTxs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="fas fa-calendar-day text-3xl mb-2 opacity-40"></i>
                  <p className="m-0 text-sm">ไม่มีรายการธุรกรรมในวันนี้</p>
                </div>
              ) : (
                selectedDayTxs.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/60"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 text-xs font-bold mt-0.5"
                          style={{ backgroundColor: getBankColor(tx.bank) }}
                        >
                          {(tx.bank || 'TX').slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-gray-800 truncate">
                            {tx.description || 'ไม่ระบุรายละเอียด'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{tx.bank || 'ไม่ระบุธนาคาร'}</span>
                            {tx.transaction_date && (
                              <span>
                                •{' '}
                                {new Date(tx.transaction_date).toLocaleTimeString(
                                  'th-TH',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}{' '}
                                น.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-bold text-sm shrink-0 ml-2 ${
                          isInc ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isInc ? '+' : '-'}฿
                        {Number(tx.amount || 0).toLocaleString('th-TH', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDayModal;
                  setSelectedDayModal(null);
                  onViewDayInHistory(d);
                }}
                className="text-xs sm:text-sm font-medium text-[#4361ee] hover:underline cursor-pointer"
              >
                <i className="fas fa-external-link-alt mr-1.5"></i>
                ดูและจัดการในหน้าประวัติรายการ
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

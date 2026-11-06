'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DailySummaryRow,
  fetchDailySummaryByMonth,
} from '@/services/transactionService';
import { formatShortAmount } from '@/utils/dateUtils';
import DailyDetailModal from './calendar/DailyDetailModal';

interface CalendarSectionProps {
  refreshKey: number;
  onViewDayInHistory: (dateStr: string) => void;
}

const WEEKDAYS = [
  { label: 'อา.', className: 'text-rose-500' },
  { label: 'จ.', className: '' },
  { label: 'อ.', className: '' },
  { label: 'พ.', className: '' },
  { label: 'พฤ.', className: '' },
  { label: 'ศ.', className: 'text-[#4361ee]' },
  { label: 'ส.', className: '' },
];

export default function CalendarSection({
  refreshKey,
  onViewDayInHistory,
}: Readonly<CalendarSectionProps>) {
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [dailySummaryRows, setDailySummaryRows] = useState<DailySummaryRow[]>(
    []
  );
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const yearMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    let active = true;
    fetchDailySummaryByMonth(yearMonthKey)
      .then((rows) => {
        if (active) setDailySummaryRows(rows);
      })
      .catch(() => {
        if (active) setDailySummaryRows([]);
      });
    return () => {
      active = false;
    };
  }, [yearMonthKey, refreshKey]);

  const changeCalendarMonth = (offset: number) => {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)
    );
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

  const dailyMap = useMemo(() => {
    const map: Record<
      string,
      { inc: number; exp: number; bal: number; count: number }
    > = {};

    dailySummaryRows.forEach((row) => {
      const dateStr = row.tx_date;
      if (!dateStr) return;
      if (!map[dateStr]) {
        map[dateStr] = { inc: 0, exp: 0, bal: 0, count: 0 };
      }
      const amt = Number(row.total_amount || 0);
      if (row.type === 'income') map[dateStr].inc += amt;
      else map[dateStr].exp += amt;
      map[dateStr].bal = map[dateStr].inc - map[dateStr].exp;
      map[dateStr].count += Number(row.tx_count || 0);
    });

    return map;
  }, [dailySummaryRows]);

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
          <div className="calendar-grid mb-2">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd.label}
                className={`calendar-header-day ${wd.className}`}
              >
                {wd.label}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstDayOfWeek }, (_, idx) => (
              <div
                key={`empty-${year}-${month}-${idx}`}
                className="calendar-day empty"
              ></div>
            ))}

            {Array.from({ length: daysInMonth }, (_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(
                2,
                '0'
              )}-${String(day).padStart(2, '0')}`;
              const summary = dailyMap[dateStr];
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDayModal(dateStr)}
                  className={`calendar-day text-left ${isToday ? 'today' : ''}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="day-number">{day}</span>
                    {summary && summary.count > 0 && (
                      <span className="hidden sm:inline-block text-[10px] bg-indigo-50 text-[#4361ee] px-1.5 py-0.5 rounded-full font-medium">
                        {summary.count}
                      </span>
                    )}
                  </div>

                  {summary && (summary.inc > 0 || summary.exp > 0) ? (
                    <div className="day-summary w-full">
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
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center">
              <i className="fas fa-circle text-[#2ecc71] mr-2 text-[8px]"></i>{' '}
              รายรับ
            </div>
            <div className="flex items-center">
              <i className="fas fa-circle text-rose-500 mr-2 text-[8px]"></i>{' '}
              รายจ่าย
            </div>
            <div className="flex items-center">
              <i className="fas fa-circle text-[#8e44ad] mr-2 text-[8px]"></i>{' '}
              คงเหลือสุทธิรายวัน
            </div>
          </div>
        </div>
      </div>

      <DailyDetailModal
        dateStr={selectedDayModal}
        onClose={() => setSelectedDayModal(null)}
        onViewDayInHistory={onViewDayInHistory}
      />
    </div>
  );
}

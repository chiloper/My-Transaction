'use client';

import React from 'react';
import { getBankColor, Transaction } from '@/types/transaction';

interface DailyDetailModalProps {
  dateStr: string | null;
  transactions: Transaction[];
  onClose: () => void;
  onViewDayInHistory: (dateStr: string) => void;
}

export default function DailyDetailModal({
  dateStr,
  transactions,
  onClose,
  onViewDayInHistory,
}: Readonly<DailyDetailModalProps>) {
  if (!dateStr) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#4361ee] text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h5 className="font-bold text-base m-0">
              รายการประจำวันที่{' '}
              {new Date(dateStr).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h5>
            <p className="text-xs text-indigo-100 m-0 mt-0.5">
              ทั้งหมด {transactions.length} รายการ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <i className="fas fa-calendar-day text-3xl mb-2 opacity-40"></i>
              <p className="m-0 text-sm">ไม่มีรายการธุรกรรมในวันนี้</p>
            </div>
          ) : (
            transactions.map((tx) => {
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
              onClose();
              onViewDayInHistory(dateStr);
            }}
            className="text-xs sm:text-sm font-medium text-[#4361ee] hover:underline cursor-pointer"
          >
            <i className="fas fa-external-link-alt mr-1.5"></i>
            ดูและจัดการในหน้าประวัติรายการ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

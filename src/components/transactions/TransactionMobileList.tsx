'use client';

import React from 'react';
import { getBankColor, Transaction } from '@/types/transaction';

interface TransactionMobileListProps {
  transactions: Transaction[];
  loading?: boolean;
  onInspectRaw: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
}

export default function TransactionMobileList({
  transactions,
  loading,
  onInspectRaw,
  onDeleteTransaction,
}: Readonly<TransactionMobileListProps>) {
  if (loading) {
    return (
      <div className="md:hidden py-8 text-center text-gray-400 text-sm">
        <i className="fas fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {transactions.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          ไม่พบรายการธุรกรรมตามเงื่อนไขที่เลือก
        </div>
      ) : (
        transactions.map((tx) => {
          const isInc = tx.type === 'income';
          const rawDate = tx.transaction_date || tx.created_at;
          const dObj = rawDate ? new Date(rawDate) : null;
          const bankColor = getBankColor(tx.bank);

          return (
            <div
              key={tx.id}
              className="p-3.5 rounded-xl border border-gray-100 bg-white shadow-2xs flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: bankColor }}
                >
                  {(tx.bank || 'TX').slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-800 truncate">
                    {tx.description || 'ไม่ระบุรายละเอียด'}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">
                      {tx.bank || 'ไม่ระบุ'}
                    </span>
                    {dObj && !Number.isNaN(dObj.getTime()) && (
                      <span>
                        • {dObj.toLocaleDateString('th-TH')}{' '}
                        {dObj.toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span
                  className={`font-bold text-sm ${
                    isInc ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isInc ? '+' : '-'}฿
                  {Number(tx.amount || 0).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  {(tx.email_id || tx.raw_body) && (
                    <button
                      type="button"
                      onClick={() => onInspectRaw(tx)}
                      className="p-1.5 text-xs text-gray-500 hover:text-[#4361ee]"
                    >
                      <i className="fas fa-file-alt"></i>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 text-xs text-rose-500"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

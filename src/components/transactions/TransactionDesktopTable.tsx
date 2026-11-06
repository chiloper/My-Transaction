'use client';

import React from 'react';
import { getBankColor, Transaction } from '@/types/transaction';

interface TransactionDesktopTableProps {
  transactions: Transaction[];
  loading?: boolean;
  onInspectRaw: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
}

export default function TransactionDesktopTable({
  transactions,
  loading,
  onInspectRaw,
  onDeleteTransaction,
}: Readonly<TransactionDesktopTableProps>) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase">
            <th className="py-3 px-4 font-semibold">วันที่ / เวลา</th>
            <th className="py-3 px-4 font-semibold">ธนาคาร</th>
            <th className="py-3 px-4 font-semibold">ประเภท</th>
            <th className="py-3 px-4 font-semibold">รายละเอียด</th>
            <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน</th>
            <th className="py-3 px-4 font-semibold text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {loading ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-gray-400">
                <i className="fas fa-spinner fa-spin mr-2"></i>กำลังโหลดข้อมูล...
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-gray-400">
                ไม่พบรายการธุรกรรมตามเงื่อนไขที่เลือก
              </td>
            </tr>
          ) : (
            transactions.map((tx) => {
              const isInc = tx.type === 'income';
              const rawDate = tx.transaction_date || tx.created_at;
              const dObj = rawDate ? new Date(rawDate) : null;
              const bankColor = getBankColor(tx.bank);

              return (
                <tr
                  key={tx.id}
                  className="hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                    {dObj && !Number.isNaN(dObj.getTime()) ? (
                      <div>
                        <div className="font-medium text-gray-800">
                          {dObj.toLocaleDateString('th-TH')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {dObj.toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          น.
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: bankColor }}
                    >
                      {tx.bank || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                        isInc
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isInc ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                    <div className="font-medium truncate">
                      {tx.description || '-'}
                    </div>
                    {tx.email_id && (
                      <div className="text-[11px] text-gray-400 truncate">
                        <i className="fas fa-envelope mr-1"></i>
                        {tx.email_id}
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                      isInc ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isInc ? '+' : '-'}฿
                    {Number(tx.amount || 0).toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {(tx.email_id || tx.raw_body) && (
                        <button
                          type="button"
                          onClick={() => onInspectRaw(tx)}
                          title="ดูข้อความต้นฉบับ (raw_body)"
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-[#4361ee] flex items-center justify-center transition cursor-pointer"
                        >
                          <i className="fas fa-file-alt text-xs"></i>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        title="ลบรายการ"
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-rose-50 text-rose-500 flex items-center justify-center transition cursor-pointer"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

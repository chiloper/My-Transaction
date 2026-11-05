'use client';

import React from 'react';
import { Transaction } from '@/types/transaction';

interface RawBodyModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function RawBodyModal({
  transaction,
  onClose,
}: Readonly<RawBodyModalProps>) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        <div className="bg-gray-800 text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h5 className="font-bold text-base m-0">
              รายละเอียดข้อมูลดิบ (Email / Raw Body)
            </h5>
            <p className="text-xs text-gray-300 m-0 mt-0.5">
              ID: #{transaction.id}{' '}
              {transaction.email_id ? `| Email ID: ${transaction.email_id}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
            <div>
              <span className="text-gray-400 block">ธนาคาร:</span>
              <span className="font-semibold text-gray-800">
                {transaction.bank || '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">จำนวนเงิน:</span>
              <span className="font-semibold text-gray-800">
                ฿
                {Number(transaction.amount || 0).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-1">
              ข้อความต้นฉบับ (raw_body):
            </span>
            <pre className="bg-gray-900 text-gray-100 p-3.5 rounded-xl text-xs whitespace-pre-wrap break-words max-h-60 overflow-y-auto font-mono custom-scrollbar">
              {transaction.raw_body || 'ไม่มีข้อมูล raw_body'}
            </pre>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import { MonthlyBankSummaryRow } from '@/services/transactionService';
import { getBankColor } from '@/types/transaction';

interface BankBreakdownCardProps {
  bankSummaryRows: MonthlyBankSummaryRow[];
  totalVolume: number;
}

export default function BankBreakdownCard({
  bankSummaryRows,
  totalVolume,
}: Readonly<BankBreakdownCardProps>) {
  const bankSummary = useMemo(() => {
    const map: Record<
      string,
      { bank: string; income: number; expense: number; count: number }
    > = {};

    bankSummaryRows.forEach((row) => {
      const b = (row.bank || 'ไม่ระบุธนาคาร').trim();
      if (!map[b]) {
        map[b] = { bank: b, income: 0, expense: 0, count: 0 };
      }
      if (row.type === 'income') map[b].income += Number(row.total_amount || 0);
      else map[b].expense += Number(row.total_amount || 0);
      map[b].count += Number(row.tx_count || 0);
    });

    return Object.values(map).sort(
      (a, b) => b.expense + b.income - (a.expense + a.income)
    );
  }, [bankSummaryRows]);

  return (
    <div className="app-card mb-0 flex flex-col">
      <div className="app-card-header flex justify-between items-center">
        <span>สรุปแยกตามธนาคาร</span>
        <i className="fas fa-university text-[#4361ee]"></i>
      </div>

      <div
        className={`app-card-body space-y-4 ${
          bankSummary.length > 5
            ? 'overflow-y-auto max-h-[340px] custom-scrollbar'
            : ''
        }`}
      >
        {bankSummary.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-gray-400 text-sm">
            <i className="fas fa-search text-2xl mb-2 opacity-50"></i>
            <span>ยังไม่มีรายการธุรกรรมในเดือนนี้</span>
          </div>
        ) : (
          bankSummary.map((item, idx) => {
            const maxTotal = Math.max(totalVolume, 1);
            const bankTotal = item.income + item.expense;
            const pct = Math.min((bankTotal / maxTotal) * 100, 100);
            const bankColor = getBankColor(item.bank, idx);

            return (
              <div key={item.bank} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-semibold text-gray-800 flex items-center gap-2 min-w-0 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: bankColor }}
                    ></span>
                    <span className="truncate">{item.bank}</span>
                    <span className="text-gray-400 font-normal shrink-0">
                      ({item.count.toLocaleString()} รายการ)
                    </span>
                  </span>
                  <span className="font-medium text-gray-600 shrink-0">
                    {item.income > 0 && (
                      <span className="text-emerald-600 mr-2">
                        +฿{item.income.toLocaleString()}
                      </span>
                    )}
                    {item.expense > 0 && (
                      <span className="text-rose-600">
                        -฿{item.expense.toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bankColor,
                    }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

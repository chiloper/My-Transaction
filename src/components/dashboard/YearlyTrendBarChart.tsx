'use client';

import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Transaction } from '@/types/transaction';
import { getTxDateKey, THAI_MONTHS_SHORT } from '@/utils/dateUtils';

interface YearlyTrendBarChartProps {
  transactions: Transaction[];
}

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f0f0f0' },
      ticks: {
        font: { family: 'Prompt', size: 11 },
        callback: (val: string | number) => `฿${Number(val).toLocaleString()}`,
      },
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Prompt', size: 12 } },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { font: { family: 'Prompt', size: 12 } },
    },
    tooltip: {
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => {
          const val = Number(ctx.raw || 0);
          return ` ${ctx.dataset.label}: ฿${val.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
          })}`;
        },
      },
    },
  },
};

export default function YearlyTrendBarChart({
  transactions,
}: Readonly<YearlyTrendBarChartProps>) {
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach((tx) => {
      const dateStr = getTxDateKey(tx);
      if (dateStr.length >= 4) {
        const y = Number.parseInt(dateStr.slice(0, 4), 10);
        if (!Number.isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );

  const yearChartData = useMemo(() => {
    const incData: number[] = [];
    const expData: number[] = [];

    for (let i = 0; i < 12; i++) {
      const mPrefix = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const mTxs = transactions.filter((t) =>
        getTxDateKey(t).startsWith(mPrefix)
      );
      const inc = mTxs
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const exp = mTxs
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      incData.push(inc);
      expData.push(exp);
    }

    return {
      labels: THAI_MONTHS_SHORT,
      datasets: [
        {
          label: 'รายรับ',
          data: incData,
          backgroundColor: '#2ecc71',
          borderRadius: 6,
        },
        {
          label: 'รายจ่าย',
          data: expData,
          backgroundColor: '#f72585',
          borderRadius: 6,
        },
      ],
    };
  }, [transactions, selectedYear]);

  return (
    <div className="app-card">
      <div className="app-card-header flex flex-wrap justify-between items-center gap-2">
        <span>แนวโน้มรายรับ-รายจ่าย ตลอดปี (พ.ศ. {selectedYear + 543})</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4361ee]"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              ปี พ.ศ. {y + 543} ({y})
            </option>
          ))}
        </select>
      </div>
      <div className="app-card-body">
        <div className="h-[320px] sm:h-[350px] w-full">
          <Bar data={yearChartData} options={BAR_OPTIONS} />
        </div>
      </div>
    </div>
  );
}
